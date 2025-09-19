const express = require('express');
const router = express.Router();
const { storePrivateKeyShare, getPrivateKeyShare } = require('../controllers/Privatekeyshares');
const verifySignature = require('../middleware/signatureMiddleware_withdraw');
const whitelistMiddleware = require('../middleware/whitelistMiddleware')

router.post('/storePrivateKeyShare', storePrivateKeyShare);
router.post('/storePrivateKeyShareETH', storePrivateKeyShare);
router.post('/storePrivateKeyShareTRX', storePrivateKeyShare)
router.post('/storePrivateKeyShareXRP', storePrivateKeyShare)

router.get('/getPrivateKeyShare/:part', whitelistMiddleware, verifySignature, (req, res, next) => {
    req.query.network = 'BTC';
    next();
}, getPrivateKeyShare);
router.get('/getPrivateKeyShareETH/:part', whitelistMiddleware, verifySignature, (req, res, next) => {
    req.query.network = 'ETH';
    next();
}, getPrivateKeyShare);
router.get('/getPrivateKeyShareTRX/:part', whitelistMiddleware, verifySignature, (req, res, next) => {
    req.query.network = 'TRX';
    next();
}, getPrivateKeyShare);
router.get('/getPrivateKeyShareXRP/:part', whitelistMiddleware, verifySignature, (req, res, next) => {
    req.query.network = 'XRP';
    next();
}, getPrivateKeyShare);

module.exports = router;
