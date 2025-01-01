const jwt = require('jsonwebtoken');
const asyncHandler = require('../middlewares/asyncHandler');
const User = require('../models/User');

const protect = (...roles) => {
    return asyncHandler(async (req, res, next) => {
        let token;
    
        if (req.cookies.token) {
            token = req.cookies.token;
        }
    
        if (!token) {
            return res.redirect('/account');
        }
    
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(decoded.id).select('-password');
    
            if (!user) {
                return res.redirect('/account');
            }
    
            // Check if user role is allowed
            if (roles.length && !roles.includes(user.role)) {
                return res.redirect('/account');
            }
    
            req.user = user;
            next();
        } catch (error) {
            return res.redirect('/account');
        }
    });
};

module.exports = {
    protect
}