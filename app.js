const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const app = express();
const port = 3000;

// Set EJS as the view engine
app.set('view engine', 'ejs');

// Middleware to parse incoming request bodies
app.use(bodyParser.urlencoded({ extended: false }));

// Middleware for session management
app.use(session({
    secret: 'secret_key', // Replace with a strong secret in production
    resave: false,
    saveUninitialized: true,
}));

// Serve static files (e.g., CSS, JS)
app.use(express.static('public'));

// Dummy user data (in a real application, use a database)
const users = [];

// Routes
// Home Page
app.get('/', (req, res) => {
    res.render('index');
});

// Start the server
app.listen(port, () => {
    console.log(`App running on http://localhost:${port}`);
});
