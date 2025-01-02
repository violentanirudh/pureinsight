const jwt = require('jsonwebtoken');
const asyncHandler = require('./asyncHandler');
const User = require('../models/User'); // Adjust the path to your User model

// Middleware to validate token and set res.locals.user
const validateToken = asyncHandler(async (req, res, next) => {
    let token;

    // Extract token from cookies
    if (req.cookies.token) {
        token = req.cookies.token;
    }

    // If no token, simply proceed without setting res.locals.user
    if (!token) {
        res.locals.user = null; // Explicitly set to null for clarity
        return next();
    }

    try {
        // Verify the token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Fetch the user from the database
        const user = await User.findById(decoded.id).select('-password');

        if (!user) {
            res.locals.user = null; // Explicitly set to null if user doesn't exist
            return next(); // Proceed without setting user
        }

        // Attach user to res.locals for templates and req for further middleware
        res.locals.user = user;
        req.user = user;

        next(); // Proceed to the next middleware or route handler
    } catch (error) {
        res.locals.user = null; // Explicitly set to null if token verification fails
        next(); // Proceed without setting user
    }
});

// Middleware to restrict access based on roles
const protect = (...roles) => {
    return (req, res, next) => {
        const user = res.locals.user; // Access the user set by validateToken

        // If no user is found (shouldn't happen if validateToken is used), redirect
        if (!user) {
            return res.redirect('/account');
        }

        // Check if user's role is allowed
        if (roles.length && !roles.includes(user.role)) {
            return res.redirect('/account'); // Redirect unauthorized users
        }

        next(); // Proceed to the next middleware or route handler
    };
};

// Export both middlewares
module.exports = { validateToken, protect };
