const mongoose = require("mongoose");

// Function to generate a unique productId
function generateUniqueProductId() {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const letterPart = 'P' + 
                       letters.charAt(Math.floor(Math.random() * letters.length)) +
                       letters.charAt(Math.floor(Math.random() * letters.length));
    const numberPart = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
    return letterPart + numberPart;
}

// Define the product schema
const productSchema = mongoose.Schema({
    productId: {
        type: String,
        unique: true,
        default: generateUniqueProductId
    },
    name: {
        type: String,
        required: [true, 'Please enter product name']
    },
    brand: {
        type: String,
        required: [true, 'Please enter brand name']
    },
    price: {
        type: Number,
        required: [true, 'Please enter product price']
    },
    description: {
        type: String,
        required: [true, 'Please enter a description']
    },
    image: {
        type: String,
        required: [true, 'Please enter an image URL']
    },
    category: {
        type: String,
        required: [true, 'Please enter a category']
    }
}, {
    timestamps: true
});

// Create the product model
const ProductModel = mongoose.model('Products', productSchema);

module.exports = ProductModel;
