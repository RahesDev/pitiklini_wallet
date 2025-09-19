const express = require('express');
const router = express.Router();
const bitcoinController = require('../controllers/bitcoinController');
const common = require('../middleware/access');
const verifySignature = require('../middleware/signatureMiddleware'); 
const whitelistMiddleware=require('../middleware/whitelistMiddleware')
// router.post('/mainnet/btctransfer',common.isEmpty,whitelistMiddleware,verifySignature,bitcoinController.btctransfer)
// router.post('/mainnet/btcwalletdetails', common.isEmpty,whitelistMiddleware,verifySignature, bitcoinController.btcwalletdetails);
// router.post('/mainnet/btcbalance', common.isEmpty,whitelistMiddleware,verifySignature, bitcoinController.btcbalance);

router.post('/mainnet/btctransfer',common.isEmpty,bitcoinController.btctransfer)
router.post('/mainnet/btcwalletdetails', common.isEmpty, bitcoinController.btcwalletdetails);
router.post('/mainnet/btcbalance', common.isEmpty, bitcoinController.btcbalance);

module.exports = router;
