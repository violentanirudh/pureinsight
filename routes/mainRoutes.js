const express = require('express');
const router = express.Router();
const mainController = require('../controllers/mainController');
const Verified = require('../models/Verified');
const htmlToText = require('html-to-text');
const QRCode = require('qrcode');
const fs = require('fs');

router.get('/', mainController.getIndex);
router.get('/account', mainController.getAccount);
router.get('/testing', (req, res) => {
    res.render('testing');
});

router.get('/aboutus', (req, res) => {
    res.render('aboutus');
});

router.get('/blog/health', (req, res) => {
    // Read JSON file for blog data
    fs.readFile('./public/blogs/health.json', 'utf8', (err, data) => {
      if (err) {
        console.error('Error reading JSON file:', err);
        return res.status(500).send('Internal Server Error');
      }
  
      const blogs = JSON.parse(data);
      res.render('blog', { blogs });
    });
  });
  

router.get('/blog/skin', (req, res) => {
    // Read JSON file for blog data
    fs.readFile('./public/blogs/skin.json', 'utf8', (err, data) => {
      if (err) {
        console.error('Error reading JSON file:', err);
        return res.status(500).send('Internal Server Error');
      }
  
      const blogs = JSON.parse(data);
      res.render('blog', { blogs });
    });
});
  
router.get('/aboutus', (req, res) => {
    res.render('aboutus');
});

router.get('/qr', async (req, res) => {
    try {
      // Extract page and limit from query parameters, with default values
      const page = parseInt(req.query.page) || 1; // Default to page 1
      const limit = parseInt(req.query.limit) || 10; // Default to 10 items per page
  
      // Calculate the starting index for pagination
      const skip = (page - 1) * limit;
  
      // Fetch the paginated products from the database
      const VerifiedData = await Verified.find({}).skip(skip).limit(limit);
  
      // Generate QR codes for each product
      const productsWithQR = await Promise.all(
        VerifiedData.map(async (product) => {
          // Extract only the required fields
          const analysisText = {
            title: product.title,
          };
  
          const qrCode = await QRCode.toDataURL("https://pureinsight.vercel.app/read/" + product.ean);
  
          // Return the data along with the QR code
          return { title: analysisText.title, qrCode };
        })
      );
  
      // Count the total number of products in the database for pagination metadata
      const totalProducts = await Verified.countDocuments();
  
      // Calculate total pages
      const totalPages = Math.ceil(totalProducts / limit);
  
      // Render the HTML page with the products, their QR codes, and pagination metadata
      res.render('qr', {
        products: productsWithQR,
        currentPage: page,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
        nextPage: page + 1,
        prevPage: page - 1,
      });
    } catch (err) {
      console.error('Error fetching products:', err);
      res.status(500).send('Internal Server Error');
    }
  });
  
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

router.get('/recipe/:slug', (req, res) => {
    const slug = req.params.slug;
  
    // Read the JSON file
    fs.readFile('./recipes.json', 'utf8', (err, data) => {
      if (err) {
        console.error('Error reading file:', err);
        return res.status(500).send('Internal Server Error');
      }
  
      // Parse JSON and find the recipe by slug
      const recipes = JSON.parse(data);
      const recipe = recipes.find((r) => r.slug === slug);
  
      if (!recipe) {
        return res.status(404).send('Recipe not found');
      }
  
      // Render the HTML dynamically
      res.render('article', { recipe });
    });
  });

module.exports = router;
