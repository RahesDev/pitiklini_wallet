const addressDB = require('../schema/address');
const common = require('../middleware/access');
const xrpl = require("xrpl");
const eccrypto = require('eccrypto');

// Address generator //

exports.xrpWallets = async (req, res, next) => {
  try {
    var { coinKey, curencyId, userKey } = req.body;
    if (coinKey && curencyId && userKey) {
      //call wallet generate
      const wallet = xrpl.Wallet.generate("ed25519");
      console.log(wallet)
      const privKey = wallet.seed;
      let privateKey = privKey;
      const key = common.encrypt(privateKey);
      const length = key.length / 3;
      const phase1 = key.substring(0, length);
      const phase2 = key.substring(length, length * 2);
      const phase3 = key.substring(length * 2);
      var address = wallet.classicAddress;
      var publicKey = wallet.publicKey;
      const enc_publicKey = Buffer.from(process.env.Encryption_public_key, 'hex');
      eccrypto.encrypt(enc_publicKey,Buffer.from(privateKey)).then(async function(encrypted) {
          const currency_private_key = 
          encrypted.iv.toString('hex') + 
          encrypted.ephemPublicKey.toString('hex') + 
          encrypted.ciphertext.toString('hex') + 
          encrypted.mac.toString('hex');
        var obj = {
          userIdKey: userKey,
          address: address,
          userKeyOne: phase1,
          userKeyThree: phase3,
          currencySymbol: coinKey,
          publicKey: publicKey,
          privateKey: currency_private_key
        }
        console.log(obj, '=-=-obj=-=-')
        let createAddress = await addressDB.create(obj);
      if (createAddress) {
        res.status(200).json({ status: true, data: { address, phase2, publicKey }, Message: "Success" });
      } else {
        return res.json({ status: false, data: {}, Message: "Blokchain error, Please try again." });
      }
    }).catch(console.error);
    } else {
      return res.json({ status: false, data: {}, Message: "Invalid fields!" });
    }

  } catch (err) {
    next(err);
  }
};

exports.xrpBalanceFind = async (req, res) => {
  try {
    //const client = new xrpl.Client('wss://s.altnet.rippletest.net:51233'); // Use Ripple Testnet endpoint
    const client = new xrpl.Client('wss://s2.ripple.com'); // Use Ripple Mainnet endpoint

    await client.connect();

    const address = req.body.address;
    const type = req.body.type;

    // Validate the XRP address
    if (!xrpl.isValidAddress(address)) {
      return res.status(400).json({
        status: false,
        message: 'Invalid XRP address',
        data: [],
      });
    }


    // Fetch transactions to the address
    const paymentTxResponse = await client.request({
      command: 'account_tx',
      account: address,
      ledger_index_min: -1,
      ledger_index_max: -1,
      binary: false,
      limit: 20,
    });

    console.log(paymentTxResponse.result.transactions, "paymentTxResponse");

    const depositTransactions = paymentTxResponse.result.transactions
      .map(transaction => {

        const { tx_json, meta } = transaction;
        if (!tx_json || !meta) {
          return null; // Skip invalid transactions
        }

        console.log(tx_json, meta, "tx_json", transaction.hash)
        // Ensure the transaction is of type 'Payment'

        if (tx_json.TransactionType === 'Payment' && tx_json.Destination == address) {

          const amountDrops = tx_json.Amount || tx_json.DeliverMax || meta.delivered_amount;
          const amount = amountDrops / 1e6; // Convert drops to XRP
          const confirmations = meta.TransactionResult === 'tesSUCCESS' ? 1 : 0;
          return {
            transactionHash: transaction.hash,
            amount: amount,
            type: 'Deposit',
            confirmations,
            currency: "XRP"
          };
        }

        return null; // Skip non-payment transactions
      })
      .filter(tx_json => tx_json);
    await client.disconnect();

    // Return response with balance and deposit details
    return res.status(200).json({
      status: true,
      message: 'Balance and deposit transactions fetched successfully!',
      data: depositTransactions,
    });
  } catch (error) {
    console.error('Error fetching XRP data:', error.message);
    return res.status(500).json({
      status: false,
      data: [],
      message: 'Internal Server Error',
    });
  }
};

async function verifyAccount(client, address) {
  const accountInfo = await client.request({
    command: 'account_info',
    account: address,
    ledger_index: 'current'
  });
  return accountInfo;
}

exports.xrpTransfer = async (req, res, next) => {
  const { fromAddress, fromSecret, toAddress, amount } = req.body;

      if (!fromAddress || !fromSecret || !toAddress || !amount) {
        return res.status(400).json({ status: false, message: "Missing required fields (fromAddress, fromSecret, toAddress, amount)." });
      }

      const client = new xrpl.Client('wss://s2.ripple.com');
      
      try {

        await client.connect();

        // Create wallet from the seed
        const wallet = xrpl.Wallet.fromSeed(fromSecret);
    
        // Ensure wallet address
        const fromAddress = wallet.classicAddress;
    
        console.log(`Sending from: ${fromAddress} to: ${toAddress}`);
    
        // Prepare payment transaction
        const tx = await client.autofill({
          TransactionType: "Payment",
          Account: fromAddress,
          Destination: toAddress,
          Amount: xrpl.xrpToDrops(amount), // Convert XRP to drops
        });
    
        // Sign the transaction
        const signed = wallet.sign(tx);
    
        // Submit the signed transaction
        const response = await client.submitAndWait(signed.tx_blob);
    
        // Check result
        if (response.result.meta.TransactionResult === "tesSUCCESS") {
          console.log("Transaction successful!");
          console.log("Transaction Hash:", response.result.hash);
          return res.status(200).json({
            status: true,
            message: "Transaction successfully broadcasted on testnet.",
            txId: response.result.hash // Transaction ID
          });

        } else {
          console.error("Transaction failed:", response.result.meta.TransactionResult);
          return res.status(400).json({
            status: false,
            message: `Transaction failed: ${result.result.engine_result_message}`
          });
        }
    
      } catch (error) {
        console.error("Error sending XRP:", error);
        return res.status(500).json({ status: false, message: "Internal server error" });
      } finally {
        await client.disconnect();
      }
};