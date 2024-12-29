const express = require('express');
const app = express();
const port = 3000;

// Set EJS as the view engine
app.set('view engine', 'ejs');


app.use(express.static('public'));

// Define routes
app.get('/', (req, res) => {
    res.render('index');
});

app.get('/account', (req, res) => {
    res.render('account');
})

// Start the server
app.listen(port, () => {
    console.log(`App running on http://localhost:${port}`);
});
