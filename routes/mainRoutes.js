const express = require('express');
const router = express.Router();
const mainController = require('../controllers/mainController');

router.get('/', mainController.getIndex);
router.get('/account', mainController.getAccount);

module.exports = router;
