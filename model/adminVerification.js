const mongoose = require("mongoose");


// Function to get current date and time in the desired format
const getCurrentDateTime = () => {
    const now = new Date();
    return now.toLocaleString();
};

// Define the admin schemas
const adminVerificationSchema = mongoose.Schema({
    adminId:String,
    otp:String,
    createdAt:Date,
    expiresAt:Date ,
});

// Create the admin model
const adminVerify = mongoose.model('Adminsverification', adminVerificationSchema);

module.exports = adminVerify;
