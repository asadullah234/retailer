const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware to protect routes
const protect = async (req, res, next) => {
    try {
        let token;

        // Check for token in headers
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        // Check for token in cookies (if using cookies)
        if (!token && req.cookies && req.cookies.token) {
            token = req.cookies.token;
        }

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Access denied. No token provided.'
            });
        }

        try {
            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

            // Get user from token
            const user = await User.findById(decoded.id).select('-password');

            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'Token is not valid. User not found.'
                });
            }

            if (!user.isActive) {
                return res.status(401).json({
                    success: false,
                    message: 'Account is deactivated.'
                });
            }

            // Add user to request
            req.user = user;
            next();

        } catch (error) {
            return res.status(401).json({
                success: false,
                message: 'Token is not valid.'
            });
        }

    } catch (error) {
        console.error('Auth middleware error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during authentication'
        });
    }
};

// Middleware to check if user is admin
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'User not authenticated'
            });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'User role not authorized to access this route'
            });
        }

        next();
    };
};

// Middleware to check if account is locked
const checkAccountLock = async (req, res, next) => {
    try {
        const user = await User.findOne({ email: req.body.email });

        if (user && user.isLocked) {
            const remainingTime = Math.ceil((user.lockUntil - Date.now()) / 1000 / 60);
            return res.status(423).json({
                success: false,
                message: `Account is temporarily locked due to too many failed login attempts. Try again in ${remainingTime} minutes.`
            });
        }

        next();
    } catch (error) {
        console.error('Account lock check error:', error);
        next();
    }
};

// Middleware to handle login attempts
const handleLoginAttempts = async (req, res, next) => {
    const { email } = req.body;

    try {
        const user = await User.findOne({ email });

        if (!user) {
            // Don't reveal if user exists or not for security
            return next();
        }

        // Reset attempts if login is successful (this will be called after successful auth)
        req.userForAttempts = user;
        next();

    } catch (error) {
        console.error('Login attempts middleware error:', error);
        next();
    }
};

// Middleware to generate JWT token
const generateToken = (userId) => {
    return jwt.sign(
        { id: userId },
        process.env.JWT_SECRET || 'your-secret-key',
        {
            expiresIn: process.env.JWT_EXPIRE || '7d'
        }
    );
};

// Middleware to send token response
const sendTokenResponse = (user, statusCode, res) => {
    // Create token
    const token = generateToken(user._id);

    // Remove password from user object
    const userObj = user.toObject();
    delete userObj.password;

    res.status(statusCode).json({
        success: true,
        token,
        user: userObj
    });
};

module.exports = {
    protect,
    authorize,
    checkAccountLock,
    handleLoginAttempts,
    generateToken,
    sendTokenResponse
};
