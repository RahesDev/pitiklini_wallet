const bitcoin = require("bitcoinjs-lib");
const { networks, ECPair, payments } = require("@bitgo/utxo-lib");
const axios = require("axios");
const addressDB = require("../schema/address");
const common = require("../middleware/access");
const ECPairFactory = require("ecpair").ECPairFactory;
const ecc = require("tiny-secp256k1");

const eccrypto = require("eccrypto");
const crypto = require("crypto");
const mainnet = bitcoin.networks.bitcoin;

exports.btcwalletdetails = async (req, res, next) => {
  try {
    // Generate a random private key
    console.log(req.body, "Generating");
    var currency = req.body.coinKey;
    if (currency == "BTC") {
      var currentNework = await networks.bitcoin;
      // var currentNework = networks.testnet;

      console.log(currentNework, "currentNework");
    } else if (currency == "LTC") {
      var currentNework = await networks.Litecoin;
      // var currentNework = await networks.litecoinTest;
    }
    const keyPair = ECPair.makeRandom({ network: mainnet });
    const { address } = bitcoin.payments.p2pkh({
      pubkey: keyPair.publicKey,
      network: mainnet,
    });
    const privateKey = keyPair.toWIF();
    const publicKey = Buffer.from(process.env.Encryption_public_key, "hex");
    eccrypto
      .encrypt(publicKey, Buffer.from(privateKey))
      .then(async function (encrypted) {
        const currency_private_key =
          encrypted.iv.toString("hex") +
          encrypted.ephemPublicKey.toString("hex") +
          encrypted.ciphertext.toString("hex") +
          encrypted.mac.toString("hex");
        const key = common.encrypt(privateKey);
        const length = key.length / 3;
        const phase1 = key.substring(0, length);
        const phase2 = key.substring(length, length * 2);
        const phase3 = key.substring(length * 2);
        var obj = {
          userIdKey: req.body.userKey,
          address: address,
          userKeyOne: phase1,
          userKeyThree: phase3,
          currencySymbol: currency,
          privateKey: currency_private_key,
        };
        let createAddress = await addressDB.create(obj);
        if (createAddress) {
          res.status(200).json({
            status: true,
            data: { address, phase2, currency_private_key },
            Message: "Success",
          });
        } else {
          return res.json({
            status: false,
            data: {},
            Message: "Blokchain error, Please try again.",
          });
        }
        // Now decrypt the message with the private key
        // eccrypto.decrypt(process.env.Encryption_private_key, encrypted).then(function(plaintext) {
        //     console.log("Decrypted message:", plaintext.toString());
        //     console.log("Decrypted message:", plaintext.toString()==privateKey);
        // }).catch(console.error);
      })
      .catch(console.error);
    // const key = common.encrypt(privateKey);
    // const length = key.length / 3;
    // const phase1 = key.substring(0, length);
    // const phase2 = key.substring(length, length * 2);
    // const phase3 = key.substring(length * 2);
    // var obj = {
    //   userIdKey: req.body.userKey,
    //   address: address,
    //   userKeyOne: phase1,
    //   userKeyThree: phase3,
    //   currencySymbol: currency
    // }
    // let createAddress = await addressDB.create(obj);
    // if (createAddress) {
    //   res.status(200).json({ status: true, data: { address, phase2 }, Message: "Success" });
    // } else {
    //   return res.json({ status: false, data: {}, Message: "Blokchain error, Please try again." });
    // }
  } catch (err) {
    next(err);
  }
};

exports.btcbalance = async (req, res, next) => {
  try {
    // Define the BTC address and Blockstream API URL
    const btcAddress = req.body.address;
    const blockstreamApiUrl = `https://blockstream.info/api/address/${btcAddress}/txs`;
    // const blockstreamApiUrl = `https://blockstream.info/testnet/api/address/${btcAddress}/txs`; // Use testnet API URL

    const { data: transactions } = await axios.get(blockstreamApiUrl);
    if (transactions?.length > 0) {
      // Process transactions and format response as an array of objects
      const result = transactions.map(({ txid, vout, status }) => {
        const depositedAmount = vout.reduce(
          (acc, { scriptpubkey_address, value }) =>
            scriptpubkey_address === btcAddress ? acc + value : acc,
          0
        );
        return {
          transactionHash: txid,
          currency: "BTC",
          amount: depositedAmount / 1e8, // Convert satoshis to BTC
          confirmations: status.confirmed ? status.block_height : 0,
        };
      });
      var obj = {
        status: true,
        data: result,
      };

      return res.json(obj);
    } else {
      var obj = {
        status: false,
        data: [],
      };
      return res.json(obj);
    }
  } catch (error) {
    return { error: "Error fetching BTC details" };
  }
};

const estimateTxSize = (numInputs, numOutputs) => {
  return numInputs * 148 + numOutputs * 34 + 10;
};
function estimateBTCFee(utxos, numOutputs, feeRate) {
  const numInputs = utxos.length;
  const txSize = estimateTxSize(numInputs, numOutputs);
  return txSize * feeRate;
}

exports.btctransfer = async (req, res, next) => {
  try {
    console.log("Received transfer request:", req.body);
    const { fromAddress, fromPrivateKeyWIF, toAddress, amount } = req.body;
    if (!fromAddress || !fromPrivateKeyWIF || !toAddress || !amount) {
      return res.status(400).json({
        status: false,
        message:
          "Missing required fields (fromAddress, fromPrivateKeyWIF, toAddress, amount).",
      });
    }

    const amountSatoshis = Math.floor(amount * 1e8); // Convert and round to an integer
    console.log(amountSatoshis, "amountSatoshis");

    const btcFee = estimateBTCFee([amount], amount, 15);

    let transferAmount = amountSatoshis;

    console.log("transferAmount", transferAmount);

    transferAmount = transferAmount / 1e8;

    let convert_amount = parseFloat(transferAmount).toFixed(8);

    console.log("convert_amount", convert_amount);

    let fee_convert = btcFee / 1e8;

    fee_convert = parseFloat(fee_convert).toFixed(8);

    console.log("fee_convert", fee_convert);

    const options = {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        "x-api-key": process.env.BTC_KEY,
      },
      body: JSON.stringify({
        fromAddress: [
          {
            address: fromAddress,
            privateKey: fromPrivateKeyWIF,
          },
        ],
        to: [{ address: toAddress, value: Number(convert_amount) }],
        fee: fee_convert.toString(),
        changeAddress: fromAddress,
      }),
    };

    //  fetch('https://api.tatum.io/v3/bitcoin/transaction', options)
    //    .then(response => response.json())
    //    .then(async response =>{
    //      if(response.txId)
    //      {
    //       res.status(200).json({
    //         status: true,
    //         message: "Transaction successfully broadcasted on testnet.",
    //         txId: response.txId,
    //       });
    //      }
    //    })
    //    .catch(err => console.error(err));

    const tatumRes = await fetch(
      "https://api.tatum.io/v3/bitcoin/transaction",
      options
    );
    const tatumData = await tatumRes.json();
    console.log("Tatum response:", tatumData);

    if (tatumData.txId) {
      return res.status(200).json({
        status: true,
        message: "Transaction successfully broadcasted.",
        txId: tatumData.txId,
      });
    } else {
      return res.status(400).json({
        status: false,
        message: "Transaction failed.",
        error: tatumData,
      });
    }
  } catch (error) {
    console.error("Error processing transfer:", err);
    next(err);
  }
};
