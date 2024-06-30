const jwt = require("jsonwebtoken");
const AdminModel = require("../model/AdminModel");

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
    const token = req.header("Authorization");
    if (!token) return res.status(401).json("Access denied. No token provided.");

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.admin = decoded;
        next();
    } catch (ex) {
        res.status(400).json("Invalid token.");
    }
};

module.exports = { verifyToken };
