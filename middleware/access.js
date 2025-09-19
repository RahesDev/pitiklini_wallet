const crypto = require('crypto');

// Define an encryption algorithm
const algorithm = 'aes-256-cbc';

// Generate a random 32-byte encryption key (256 bits)
const encryptionKey = crypto.randomBytes(32);

// Generate a random 16-byte initialization vector (IV)
const iv = crypto.randomBytes(16);

exports.encrypt = (text) => {

    const cipher = crypto.createCipheriv(algorithm, encryptionKey, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
};

exports.decrypt = (encryptedText) => {
    const decipher = crypto.createDecipheriv(algorithm, encryptionKey, iv);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;

};

exports.isEmpty = (req, res, next) => {
    var value = req.body;
    console.log(value,'=-=value')
    if (
      value === undefined ||
      value === null ||
      (typeof value === "object" && Object.keys(value).length === 0) ||
      (typeof value === "string" && value.trim().length === 0)
    ) {
      return res.json({ status: false, message: "Please fill all fields" });
    } else {
      next();
    }
  };
  