const express = require('express');
const router = express.Router();
const evmController = require('../controllers/evmController');
const common = require('../middleware/access');
const verifySignature = require('../middleware/signatureMiddleware');
const whitelistMiddleware = require('../middleware/whitelistMiddleware');

router.post('/mainnet/ethTransfer', common.isEmpty,whitelistMiddleware,verifySignature, evmController.ethTransfer);
router.post('/mainnet/bnb_Transfer', common.isEmpty,whitelistMiddleware,verifySignature, evmController.bnb_Transfer);
router.post('/mainnet/evmwallets', evmController.evmWallets);
router.post('/mainnet/checkBalance', evmController.evmBalanceCheck);

module.exports = router;
