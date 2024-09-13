const mongoose = require("mongoose");


// Function to get current date and time in the desired format
const getCurrentDateTime = () => {
    const now = new Date();
    return now.toLocaleString();
};

// Define the superAdmin schemas
const superAdminVerificationSchema = mongoose.Schema({
    superAdminId:String,
    otp:String,
    createdAt:Date,
    expiresAt:Date ,
});

// Create the admin model
const superAdminVerify = mongoose.model('Superadminsverification', superAdminVerificationSchema);

module.exports = superAdminVerify;
