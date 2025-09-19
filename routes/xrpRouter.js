const express = require('express');
const router = express.Router();
const xrpController = require('../controllers/xrpController');
const common = require('../middleware/access');
const verifySignature = require('../middleware/signatureMiddleware'); 
const whitelistMiddleware=require('../middleware/whitelistMiddleware')
// Mainnet
// router.post('/mainnet/xrpWallets', common.isEmpty,whitelistMiddleware,verifySignature,xrpController.xrpWallets);
// router.post('/mainnet/xrpBalanceFind', common.isEmpty,whitelistMiddleware,verifySignature,xrpController.xrpBalanceFind);
 router.post('/mainnet/xrpTransfer', common.isEmpty,whitelistMiddleware,verifySignature,xrpController.xrpTransfer);
router.post('/mainnet/xrpWallets', common.isEmpty,xrpController.xrpWallets);
router.post('/mainnet/xrpBalanceFind', common.isEmpty,xrpController.xrpBalanceFind);



module.exports = router;