const express = require('express');
const path = require('path');
const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static('public'));

app.get('/', (req, res) => {
    res.render('index');
});

app.get('/account', (req, res) => {
    res.render('account');
});

// Remove app.listen() for Vercel deployment
module.exports = app;
