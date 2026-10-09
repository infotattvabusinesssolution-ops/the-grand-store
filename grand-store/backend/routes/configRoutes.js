const express = require('express');
const router = express.Router();
const configController = require('../controllers/configController');

router.get('/currency-rates', configController.getCurrencyRates);
router.get('/geo-lookup', configController.geoLookup);

module.exports = router;

