const express = require('express');
const router = express.Router();
const { getSitemapXml } = require('../controllers/sitemapController');

router.get('/sitemap.xml', getSitemapXml);
router.get('/', getSitemapXml);

module.exports = router;
