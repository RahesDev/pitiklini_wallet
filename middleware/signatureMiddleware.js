const sodium = require('libsodium-wrappers');

(async () => {
  await sodium.ready;
})();

const verifySignature = async (req, res, next) => {
  const receivedSignature = req.headers['x-signature'];
  const publicKeyHex = process.env.LIBSODIUMPUBLIC_KEY;
  const publicKey = Buffer.from(publicKeyHex, 'hex');

  if (!receivedSignature) {
    return res.status(401).json({ status: false, message: "Signature required" });
  }
  console.log("Received signature:", receivedSignature);


  try {
    const signature = Buffer.from(receivedSignature, 'hex');
  } catch (error) {
    return res.status(400).json({ status: false, message: "Invalid signature format", error });
  }
  
  try {
    const message = Buffer.from(JSON.stringify(req.body));
    
    const signature = Buffer.from(receivedSignature, 'hex');
    
    // Logging to debug
    console.log("Message:", message.toString());
    console.log("Signature:", signature.toString('hex'));

    const isValid = sodium.crypto_sign_verify_detached(signature, message, publicKey);
      if (isValid) {
        return next();

    }else{
      return res.status(401).json({ status: false, message: "Invalid signature" });
    }

   
  } catch (error) {
    console.error("Signature verification error:", error);
    return res.status(500).json({ status: false, message: "Signature verification error", error });
  }
};

module.exports = verifySignature;
