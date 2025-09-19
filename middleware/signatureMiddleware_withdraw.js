const sodium = require('libsodium-wrappers');

(async () => {
await sodium.ready;
})();

const verifySignature = async (req, res, next) => {
const receivedSignature = req.headers['x-signature'];
const publicKeyHex = process.env.PUBLICKEY_WITHDRAW;
const publicKey = Buffer.from(publicKeyHex, 'hex');

if (!receivedSignature) {
return res.status(401).json({ status: false, message: "Signature required" });
}

try {
  const url = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
const message = Buffer.from(url, 'utf8');
const signature = Buffer.from(receivedSignature, 'hex');

console.log("Received Signature:", receivedSignature); 
console.log("Message for Verification:", message.toString()); 
console.log("Signature for Verification:", signature.toString('hex'));

const isValid = sodium.crypto_sign_verify_detached(signature, message, publicKey);
if (isValid) {
console.log("Signature verified successfully");
return next();
} else {
return res.status(401).json({ status: false, message: "Invalid signature" });
}
} catch (error) {
console.error("Signature verification error:", error);
return res.status(500).json({ status: false, message: "Signature verification error", error });
}
};

module.exports = verifySignature;