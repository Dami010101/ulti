const mongoose = require("mongoose");

/// Function to generate a unique superAdminId
function generateUniqueSuperAdminId() {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const letterPart = 'S' + 
                       letters.charAt(Math.floor(Math.random() * letters.length)) +
                       letters.charAt(Math.floor(Math.random() * letters.length));
    const numberPart = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
    return letterPart + numberPart;
}

// Function to get current date and time in the desired format
const getCurrentDateTime = () => {
    const now = new Date();
    return now.toLocaleString();
};

// Define the superAdmin schema
const superAdminSchema = mongoose.Schema({
    superAdminId: {
        type: String,
        unique: true,
        default: generateUniqueSuperAdminId
    },
    firstName: {
        type: String,
        required: [true, 'Please enter your first name']
    },
    lastName: {
        type: String,
        required: [true, 'Please enter your last name']
    },
    email: {
        type: String,
        required: [true, 'Please enter an email'],
        unique: [true, 'Email is already in use'],
        trim: true,
        match: [
            /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
            'Please enter a valid email'
        ]
    },
    password: {
        type: String,
        required: [true, 'Please enter a password'],
        minlength: [6, 'Password must be at least 6 characters long']
    },
    street: {
        type: String,
        required: [true, 'Please enter your street']
    },
    postcode: {
        type: String,
        required: [true, 'Please enter your postcode']
    },
    country: {
        type: String,
        required: [true, 'Please enter your country']
    },
    stateCounty: {
        type: String,
        required: [true, 'Please enter your state/county']
    },
    cityTown: {
        type: String,
        required: [true, 'Please enter your city/town']
    },
    age: {
        type: Date,
        required: [true, 'Please enter your age']
    },
    sex: {
        type: String,
        enum: ['MALE', 'FEMALE'],
        required: [true, 'Please select your sex']
    },
    maritalStatus: {
        type: String,
        enum: ['SINGLE', 'MARRIED'],
        required: [false, 'Please select your marital status']
    },
    phoneNumber: {
        type: String,
        required: [true, 'Please enter your phone number']
    },
    nationality: {
        type: String,
        required: [false, 'Please select your nationality']
    },
    isVerified: {
        type: Boolean,
        default: false // Set default to false until verified
    },
    verificationToken: {
        type: String,
    },
    otp: {
        type: String, // Store the hashed OTP
    },
    otpExpiresAt: {
        type: Date, // To store OTP expiration time
    },
    lastLogin: {
        type: Date // To track the last login time
    },
    profilePicture: {
        type: String,
        default: ''
    }
}, {
    timestamps: true
});

// Create the user model
const SuperAdminModel = mongoose.model('SuperAdmins', superAdminSchema);

module.exports = SuperAdminModel;
