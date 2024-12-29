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

// Sign Up Page
app.get('/signup', (req, res) => {
    res.render('signup');
});

// Handle Sign Up Form Submission
app.post('/signup', (req, res) => {
    const { username, password } = req.body;

    // Check if user already exists (simplified for demonstration)
    const userExists = users.some(user => user.username === username);

    if (userExists) {
        return res.send('User already exists');
    }

    // Create a new user (in a real app, hash passwords before saving them)
    users.push({ username, password });
    res.send('User successfully registered');
});

// Log In Page
app.get('/login', (req, res) => {
    res.render('login');
});

// Handle Login Form Submission
app.post('/login', (req, res) => {
    const { username, password } = req.body;

    // Check if the user exists
    const user = users.find(u => u.username === username && u.password === password);

    if (!user) {
        return res.send('Invalid credentials');
    }

    // Store user session (for demo purposes)
    req.session.user = user;
    res.send('Logged in successfully');
});

// Log Out Route
app.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.send('Error logging out');
        }
        res.send('Logged out successfully');
    });
});

// Start the server
app.listen(port, () => {
    console.log(`App running on http://localhost:${port}`);
});
