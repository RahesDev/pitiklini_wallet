const sodium = require('libsodium-wrappers');
const axios = require('axios');

const sendRequestToGenerateAddress = async () => {
    await sodium.ready;

    const privateKey = Buffer.from(process.env.WALLET_TO_GEN_PRIVATE_KEY, 'hex');
    const message = Buffer.from(JSON.stringify({ test: 'data' }), 'utf8');
    const signature = sodium.crypto_sign_detached(message, privateKey);
    console.log('Generated Signature:', Buffer.from(signature).toString('hex'));

    const url = process.env.GENERATE_ADDRESS_URL;

    const headers = {
        'Content-Type': 'application/json',
        'X-Signature': Buffer.from(signature).toString('hex'),
        'Authorization': `Bearer 8f3b1e92f0ae4d7b987c2c68d9b1e1d6`,
    };

    try {
        const response = await axios.post(url, { test: 'data' }, { headers });
        console.log('Response from generateAddress:', response.data);
    } catch (error) {
        console.error('Error sending request:', error.response ? error.response.data : error.message);
    }
};

module.exports = { sendRequestToGenerateAddress };