const PrivateKeyShare = require('../models/privateKeyShare');

async function getPrivateKeyShare(req, res) {
    try {
    const { part } = req.params;
    const { network } = req.query; 
    const privateKeyShare = await PrivateKeyShare.findOne({ part, network });
    if (!privateKeyShare) {
    return res.status(404).json({ error: 'Private key share not found' });
    }
    res.json({ share: privateKeyShare.share });
    } catch (error) {
    res.status(500).json({ error: error.message });
    }
    }
    
    

async function storePrivateKeyShare(req, res) {
try {
const { share, part, network } = req.body; 
const privateKeyShare = new PrivateKeyShare({ share, part, network });
await privateKeyShare.save();
res.json({ message: 'Private key share stored successfully' });
} catch (error) {
res.status(500).json({ error: error.message });
}
}

module.exports = {
storePrivateKeyShare,
getPrivateKeyShare
};
