const { ethers, Wallet } = require("ethers");
const { ethers2 } = require("ethers");

const rpcCall = require("../middleware/rpc");
const addressDB = require("../schema/address");
const common = require("../middleware/access");
const bnb_abi = require("../middleware/abi");
const axios = require("axios");

const eccrypto = require('eccrypto');
const crypto = require('crypto');


const bscScanApiKey = process.env.BSC_API;
const etherScanApiKey = process.env.ETH_API;
const bscScanApiUrl = process.env.BSC_URL;
const etherScanApiUrl = process.env.ETH_URL;
const bscRPC = process.env.BSC_NETWORK;
const ethRPC = process.env.ETH_NETWORK;


const {Web3} = require("web3");
const Bnbweb3 = new Web3(process.env.BSC_NETWORK);


exports.evmWallets = async (req, res, next) => {
    try {
        var { coinKey, curencyId, userKey } = req.body;
        if (coinKey && curencyId && userKey) {
            var getRPC = "";

            if (coinKey == "ETH") {
                // Request for ETH address creation
                getRPC = rpcCall.eth[0].url;
            } else if (coinKey == "BNB") {
                // Request for BNB address creation
                getRPC = rpcCall.bnb[0].url;
            } else if (coinKey == "ARB") {
                // Request for Arbitrum address creation
                getRPC = rpcCall.arb[0].url;
            } else if (coinKey == "MATIC") {
                // Request for Polgygon address creation
                getRPC = rpcCall.matic[0].url;
            } else {
                getRPC = "";
            }
            const provider = new ethers.JsonRpcProvider(getRPC);
            const wallet = Wallet.createRandom(provider);
            const privKey = wallet.privateKey;
            let privateKey = privKey;
            console.log(privateKey,"privateKeynewcheck")
            // const privateKeyBuffer = Buffer.from(privKey.slice(2), 'hex');
            // const encryptionKeyBuffer = Buffer.from(process.env.Encryption_key, 'hex');
            // console.log(privateKeyBuffer.length); 
            console.log(process.env.Encryption_public_key,"kkjkjhkjhkjhkjhkj");
            const publicKey = Buffer.from(process.env.Encryption_public_key, 'hex');
            eccrypto.encrypt(publicKey,Buffer.from( privateKey)).then(async function(encrypted) {
                const currency_private_key = 
                encrypted.iv.toString('hex') + 
                encrypted.ephemPublicKey.toString('hex') + 
                encrypted.ciphertext.toString('hex') + 
                encrypted.mac.toString('hex');
               const key = common.encrypt(privateKey);
                const length = key.length / 3;
                const phase1 = key.substring(0, length);
                const phase2 = key.substring(length, length * 2);
                const phase3 = key.substring(length * 2);
                var address = wallet.address;
                var obj = {
                userIdKey: userKey,
                address: address,
                userKeyOne: phase1,
                userKeyThree: phase3,
                currencySymbol: coinKey,
                privateKey: currency_private_key
                };
                let createAddress = await addressDB.create(obj);
                if (createAddress) {
                    res.status(200).json({
                        status: true,
                        data: { address, phase2,currency_private_key },
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
            }).catch(console.error);
        } else {
            return res.json({ status: false, data: {}, Message: "Invalid fields!" });
        }
    } catch (err) {
        next(err);
    }
};

// Initialize providers
const [bnbProvider, ethProvider] = [
    new ethers.JsonRpcProvider(bscRPC),
    new ethers.JsonRpcProvider(ethRPC),
];

exports.evmBalanceCheck = async (req, res, next) => {
    try {

        console.log(req.body, "iiknknkdkecnek");
        const { address, contractAddress, coinKey, type } = req.body; // Added type to req.body for clarity

        // Validate coinKey
        if (!["BNB", "ETH"].includes(coinKey)) {
            return res.status(400).json({
                status: false,
                message: "Invalid coinKey provided. Please use BNB or ETH.",
            });
        }

        let deposits = [];

        // Helper to fetch deposits
        const fetchDeposits = async () => {
            if (type === "Token") {
                return await getTokenDeposits(
                    address,
                    contractAddress,
                    coinKey.toLowerCase()
                );
            } else {
                return await getNativeDeposits(address, coinKey.toLowerCase(), coinKey);
            }
        };

        // Fetch deposits in parallel
        deposits = await fetchDeposits();

        return res.status(200).json({
            status: true,
            message: "Balance and deposit transactions fetched successfully!",
            data: deposits,
        });
    } catch (error) {
        console.error("Error fetching balance and deposit transactions:", error);
        next(error);
    }
};

async function getNativeDeposits(address, network, coinKey) {
    try {
        const apiUrl = network === "bnb" ? bscScanApiUrl : etherScanApiUrl;
        const apiKey = network === "bnb" ? bscScanApiKey : etherScanApiKey;
        const url = `${apiUrl}?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&sort=asc`;

        console.log(url, "url");

        const response = await axios.get(url);
        if (response.data.status === "1") {
            const depositTransactions = response.data.result.filter(
                (tx) => tx.to.toLowerCase() === address.toLowerCase()
            );

            return depositTransactions.map((tx) => ({
                amount: ethers.formatEther(tx.value),
                transactionHash: tx.hash,
                status: tx.txreceipt_status === "1" ? "Success" : "Failed",
                currency: coinKey
            }));
        } else {
            throw new Error(
                `Failed to fetch ${network.toUpperCase()} transaction history`
            );
        }
    } catch (error) {
        console.error(
            `Error fetching ${network.toUpperCase()} deposit transactions:`,
            error
        );
        return [];
    }
}

async function getTokenDeposits(address, contractAddress, network) {
    try {
        const apiUrl = network === "bnb" ? bscScanApiUrl : etherScanApiUrl;
        const apiKey = network === "bnb" ? bscScanApiKey : etherScanApiKey;
        const url = `${apiUrl}?module=account&action=tokentx&contractaddress=${contractAddress}&address=${address}&startblock=0&endblock=99999999&sort=asc&apikey=${apiKey}`;

        const response = await axios.get(url);

        if (response.data.status === "1") {
            const tokenDepositTransactions = response.data.result.filter(
                (tx) =>
                    tx.to.toLowerCase() === address.toLowerCase() &&
                    tx.contractAddress.toLowerCase() === contractAddress.toLowerCase()
            );

            return tokenDepositTransactions.map((tx) => {
                const decimals = parseInt(tx.tokenDecimal, 10);
                return {
                    amount: ethers.formatUnits(tx.value, decimals),
                    transactionHash: tx.hash,
                    status: tx.txreceipt_status == "1" ? "Success" : "Failed",
                    currency: tx.tokenSymbol

                };
            });
        } else {
            throw new Error(
                `Failed to fetch ${network.toUpperCase()} token transaction history`
            );
        }
    } catch (error) {
        console.error(
            `Error fetching ${network.toUpperCase()} token deposit transactions:`,
            error
        );
        return [];
    }
}

exports.ethTransfer = async (req, res, next) => {
    try {
        console.log("Received transfer request:", req.body);
        const { fromPrivateKey, toAddress, amount, chain, tokenAddress, tokenDecimal } = req.body;
        
        if (!fromPrivateKey || !toAddress || !amount || !chain) {
            return res.status(400).json({ 
                status: false, 
                message: "Missing required fields (fromPrivateKey, toAddress, amount, chain)." 
            });
        }
        
        let provider;
        console.log(chain,"=-=-=chain==-=-=")
        if (chain === 'ETH') {
            provider = new ethers.JsonRpcProvider(`${process.env.ETH_NETWORK}`); // Sepolia Testnet for ETH
        } else if (chain === 'BNB') {
            provider = new ethers.JsonRpcProvider(`${process.env.BSC_NETWORK}`); // BNB Testnet
        }
        else {
            return res.status(400).json({ status: false, message: "Unsupported chain. Use 'ETH' or 'BNB'." });
        }
        
        const wallet = new ethers.Wallet(fromPrivateKey, provider);
        console.log(`Wallet connected on ${chain}:`, wallet.address);
        
        let tx;
        if (tokenAddress) {
              if (!ethers.isAddress(tokenAddress)) {
                return res.status(400).json({ status: false, message: "Invalid token address." });
            }
           const tokenContract = new ethers.Contract(tokenAddress, [
                "function transfer(address to, uint amount) public returns (bool)"
            ], wallet);
            
            const amountInWei = ethers.parseUnits(amount.toString(), +tokenDecimal); 
            const txResponse = await tokenContract.transfer(toAddress, amountInWei);
            console.log("Transaction sent:", txResponse);
            const txReceipt = await txResponse.wait();
            console.log("Transaction confirmed:", txReceipt);
            return res.status(200).json({
                status: true,
                message: `Token Transaction successfully broadcasted on ${chain}.`,
                txId: txResponse.hash,
            });

        } else {
            tx = {
                to: toAddress,
                value: ethers.parseEther(amount.toString())
            };
        }

        const gasLimit = await provider.estimateGas(tx);
        // tx.gasLimit = gasLimit;
        tx.gasLimit = 100000;
        const feeData = await provider.getFeeData();
        const gasPrice = feeData.gasPrice;
        tx.gasPrice = feeData.gasPrice
        
        console.log("Transaction object:", tx);
        const transaction = await wallet.sendTransaction(tx);
        console.log("Transaction sent:", transaction);
        console.log("Transaction sent:", transaction.hash);


        if (transaction.hash) {
          const receipt = await waitForTransactionConfirmation(transaction.hash, provider);
     console.log(receipt,"receipt")
          return res.status(200).json({
            status: receipt.status,
            message:receipt.message ,
            txId: transaction.hash
        });
           
        } else {
            return res.status(500).json({ status: false, message: "Transaction not confirmed." });
        }
    } catch (err) {
        console.error("Error processing transfer:", err);
            if (!res.headersSent) {
            res.status(500).json({ status: false, message: err.message });
        }
        next(err); 
    }
};

async function waitForTransactionConfirmation(txHash, provider) {
    let receipt = null;
    while (!receipt) {
        receipt = await provider.getTransactionReceipt(txHash);
        var obj={
            status: true,
            message: `Transaction is being processed. Please wait for confirmation.`,
            receipt:receipt,
            txId: txHash
        }
        return obj;

        return res.status(200).json({
         
        });
        if (receipt && receipt.blockNumber) {
            return receipt;
        } else {
            console.log("Waiting for transaction confirmation...");
            await new Promise(resolve => setTimeout(resolve, 5000));
        }
    }
}

// written by Jothi   ===================================

exports.bnb_Transfer = async (req, res, next) => {
    try {

        const {fromAddress,fromPrivateKey, toAddress, amount, chain, tokenAddress } = req.body;
        
        if (!fromPrivateKey || !toAddress || !amount || !chain) {
            return res.status(400).json({ 
                status: false, 
                message: "Missing required fields (fromPrivateKey, toAddress, amount, chain)." 
            });
        }
        // Add user's private key to the wallet
        const userAccount = Bnbweb3.eth.accounts.privateKeyToAccount(fromPrivateKey);
        Bnbweb3.eth.accounts.wallet.add(userAccount);

        // Get the current gas price
        const gasPrice = await Bnbweb3.eth.getGasPrice();
        const gasLimit = 28000;
        const tx = {
            from: fromAddress,
            to: toAddress,
            value: Bnbweb3.utils.toWei(amount.toString(), 'ether'),
            gas: gasLimit,
            gasPrice
        };
        const signedTx = await Bnbweb3.eth.accounts.signTransaction(tx, userAccount.privateKey);
        console.log('Transaction confirmed:', signedTx);
if(signedTx){
    const receipt = await Bnbweb3.eth.sendSignedTransaction(signedTx.rawTransaction);
    console.log('Transaction confirmed:', receipt);
    return res.status(200).json({
        status: true,
        message: `Token Transaction successfully broadcasted on ${chain}.`,
        txId: receipt.transactionHash,
    });
}
       

    } catch(err){
console.log(err,"--=-=-=-=-=-=-=-=")
}
}