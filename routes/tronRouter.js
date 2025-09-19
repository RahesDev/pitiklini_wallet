const express = require('express');
const router = express.Router();
const tronController = require('../controllers/tronController');
const common = require('../middleware/access');
const verifySignature = require('../middleware/signatureMiddleware');
const whitelistMiddleware = require('../middleware/whitelistMiddleware');

// router.post('/mainnet/trxWallets', common.isEmpty,whitelistMiddleware,verifySignature, tronController.tronWallets);
// router.post('/mainnet/trxBalanceFind', common.isEmpty,whitelistMiddleware,verifySignature, tronController.trxBalanceFind);
router.post('/mainnet/trxTransfer', common.isEmpty,whitelistMiddleware,verifySignature, tronController.trxTransfer);
router.post('/mainnet/trxWallets', common.isEmpty, tronController.tronWallets);
router.post('/mainnet/trxBalanceFind', common.isEmpty, tronController.trxBalanceFind);
// router.post('/mainnet/getTronTokenBalance', common.isEmpty, tronController.getTronTokenBalance);



module.exports = router;
