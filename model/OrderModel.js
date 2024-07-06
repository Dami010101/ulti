const mongoose = require("mongoose");

// Function to generate a unique orderId
function generateUniqueOrderId() {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const letterPart = 'O' + 
                       letters.charAt(Math.floor(Math.random() * letters.length)) +
                       letters.charAt(Math.floor(Math.random() * letters.length));
    const numberPart = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
    return letterPart + numberPart;
}

// Define the order schema
const orderSchema = mongoose.Schema({
    orderId: {
        type: String,
        unique: true,
        default: generateUniqueOrderId
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
        trim: true,
        match: [
            /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
            'Please enter a valid email'
        ]
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
    phoneNumber: {
        type: String,
        required: [true, 'Please enter your phone number']
    },
    totalAmount: {
        type: Number,
        required: [true, 'Please enter the total amount']
    },
    cartPageUrl: {
        type: String,
        required: [true, 'Please provide the URL to the cart page']
    },
    paymentStatus: {
        type: String,
        enum: ["unpaid", "paid"],
        default: "unpaid",
    },
    deliveryStatus: {
        type: String,
        enum: ["undelivered", "delivered"],
        default: "undelivered",
    },
    orderDate: {
        type: Date,
        default: Date.now
    },
}, {
    timestamps: true
});

// Create the order model
const OrderModel = mongoose.model('Orders', orderSchema);

module.exports = OrderModel;
