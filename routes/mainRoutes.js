const express = require('express');
const router = express.Router();
const mainController = require('../controllers/mainController');
const Verified = require('../models/Verified');

router.get('/', mainController.getIndex);
router.get('/account', mainController.getAccount);
router.get('/read/:ean', async (req, res) => {
    const eanCode = req.params.ean;

    try {
        // Find the document with the matching EAN
        const result = await Verified.findOne({ ean: eanCode });

        if (!result) {
            return res.status(404).render('notFound', { message: 'EAN not found' });
        }

        // Render a detailed view with the result data
        res.render('details', { result });
    } catch (error) {
        console.error(error);
        res.status(500).send('An error occurred while fetching details.');
    }
});

module.exports = router;
