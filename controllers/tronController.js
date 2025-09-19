const { ethers, Wallet } = require("ethers");
const rpcCall = require("../middleware/rpc");
const addressDB = require('../schema/address');
const common = require('../middleware/access');
const TronWeb = require('tronweb');
const axios = require('axios');

const eccrypto = require('eccrypto');
const crypto = require('crypto');


exports.tronWallets = async (req, res, next) => {
    try {
        var { coinKey, curencyId, userKey } = req.body;
        if (coinKey && curencyId && userKey) {

            const tronWeb = new TronWeb({
                fullHost: process.env.TRON_NETWORK,
                headers: { "TRON-PRO-API-KEY": process.env.TRX_KEY },
            });
            let wallet = await tronWeb.createAccount()
            //call wallet generate
            console.log(wallet)
            const privKey = wallet.privateKey;
            let privateKey = privKey;
            const publicKey = Buffer.from(process.env.Encryption_public_key, 'hex');
            eccrypto.encrypt(publicKey, Buffer.from(privateKey)).then(async function (encrypted) {
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
                var address = wallet.address.base58;
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
            }).catch(console.error);
        } else {
            return res.json({ status: false, data: {}, Message: "Invalid fields!" });
        }

    } catch (err) {
        next(err);
    }
};

exports.trxBalanceFind = async (req, res) => {
    try {
        const tronWeb = new TronWeb({
            fullHost: process.env.TRON_NETWORK, // Nile Testnet URL
            headers: { "TRON-PRO-API-KEY": process.env.TRX_KEY },
        });

        const { contractAddress, address: trxAddress, type, token } = req.body;

        // Validate the TRX address early to prevent unnecessary API calls
        if (!tronWeb.isAddress(trxAddress)) {
            return res.status(400).json({
                status: false,
                message: 'Invalid TRX address',
            });
        }

        const trxAddressHex = tronWeb.address.toHex(trxAddress);
        const tronGridApiUrl = `${process.env.TRON_NETWORK}/v1/accounts/${trxAddress}`;
        const tokenTransfersUrl = `${process.env.TRON_NETWORK}/v1/accounts/${trxAddress}/transactions/trc20`;
        let depositTransactions = [];

        // Concurrent API calls for token transactions or TRX transactions based on type
        if (type === "Token") {
            const tokenTransfersResponse = await axios.get(`${tokenTransfersUrl}?contract_address=${contractAddress}&toAddress=${trxAddress}`);

            // const tokenTransfers = tokenTransfersResponse.data.token_transfers || [];
            const tokenTransfers = tokenTransfersResponse.data.data || [];

            depositTransactions = tokenTransfers.map((transfer) => {
                // Check if the transfer's `to` address matches the `trxAddress`

                console.log(transfer.to, "transfer", trxAddress);
                if (transfer.to == trxAddress) {
                    return {
                        transactionHash: transfer.transaction_id,
                        amount: transfer.quant
                            ? transfer.quant
                            : transfer.value / Math.pow(10, transfer.tokenInfo?.tokenDecimal || 6), // Convert based on token decimals, default to 6 if not specified
                        type: 'Token Deposit',
                        confirmations: transfer.confirmed && transfer.contractRet === 'SUCCESS',
                        fromAddress: transfer.from_address || transfer.from,
                        toAddress: transfer.to_address || transfer.to,
                        // currency : token
                        currency: "USDT"


                    };
                }
                return null; // Return null for transfers that do not match the address
            }).filter(transaction => transaction !== null); // Filter out null values



        } else {
            const transactionResponse = await axios.get(
                `${tronGridApiUrl}/transactions?limit=50&order_by=block_timestamp,desc`
            );

            const transactions = transactionResponse.data.data || [];

            // Process TRX deposits
            depositTransactions = transactions.reduce((acc, { txID, raw_data, ret }) => {
                const contract = raw_data.contract[0]?.parameter.value;
                if (contract?.to_address === trxAddressHex) {
                    acc.push({
                        transactionHash: txID,
                        amount: contract.amount / 1e6, // Convert SUN to TRX
                        type: 'Deposit',
                        confirmations: ret[0]?.contractRet === 'SUCCESS',
                        currency: "TRON"
                    });
                }
                return acc;
            }, []);
        }

        // Return response with deposit details
        return res.status(200).json({
            status: true,
            message: 'Balance and deposit transactions fetched successfully!',
            data: depositTransactions,
        });
    } catch (error) {
        console.error('Error fetching TRX data:', error.message);
        return res.status(500).json({
            status: false,
            message: 'Internal Server Error',
        });
    }
};


exports.trxTransfer = async (req, res, next) => {
    try {
        console.log("Received TRX transfer request:", req.body);
        const { privateKey, fromAddress, toAddress, amount, tokenAddress } = req.body;
        console.log(privateKey, ">>>>>>>>>>>>>>>>>>>>>>>>>>>")
        if (!privateKey || !toAddress || !amount || !fromAddress) {
            return res.status(400).json({
                status: false,
                message: "Missing required fields (fromPrivateKey, fromAddress, toAddress, amount)."
            });
        }
        let fullHost = process.env.TRON_NETWORK;

        console.log(`Wallet connected on fullHost:`, fullHost);

        const tronWeb = new TronWeb({
            fullHost: fullHost,
            privateKey: privateKey
        });
        const derivedFromAddress = tronWeb.address.fromPrivateKey(privateKey);

        if (fromAddress !== derivedFromAddress) {
            console.log(`Wallet connected on tronWeb: comes`);
            return res.status(400).json({
                status: false,
                message: "Invalid fromAddress. It does not match the address derived from the private key."
            });
        }
        if (tokenAddress) {

            tronWeb.setPrivateKey(privateKey);

            if (!tronWeb.isAddress(tokenAddress)) {
                return res.status(400).json({ status: false, message: "Invalid token address." });
            }

            const contract = await tronWeb.contract().at(tokenAddress);
            const amountInSun = tronWeb.toSun(amount.toString());
            try {
                // const tx = await contract.methods.transfer(toAddress, amountInSun).send();

                const tx = await contract.methods.transfer(toAddress, amountInSun).send({
                    feeLimit: 30_000_000,  // Set fee limit (100 TRX in SUN)
                    callValue: 0,           // Since this is a token transfer, no TRX is sent
                    from: fromAddress
                });
                console.log("Transaction sent:", tx);
                return res.status(200).json({
                    status: true,
                    message: `TRC20 token transaction successfully broadcasted.`,
                    txId: tx
                });
            } catch (error) {
                console.error("Error during TRC20 transfer:", error);
                return res.status(500).json({
                    status: false,
                    message: "Error during TRC20 transfer: " + (error.message || "Unknown error")
                });
            }
        }
        else {
            tronWeb.setPrivateKey(privateKey);
            // Handle TRX transfer
            console.log(`Transferring ${amount} TRX to ${toAddress}`);
            const tx = await tronWeb.trx.sendTransaction(toAddress, amount.toString());

            console.log("Transaction sent:", tx);
            return res.status(200).json({
                status: true,
                message: `TRX transaction successfully broadcasted.`,
                txId: tx.txid
            });
        }

    } catch (err) {
        console.error("Error processing TRX transfer:", err);

        if (!res.headersSent) {
            res.status(500).json({ status: false, message: err.message });
        }
        next(err);
    }
};