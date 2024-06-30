const mongoose = require("mongoose");

// Define the product schema
const productSchema = mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please enter your product name']
    },
    brand: {
        type: String,
        required: [true, 'Please enter brand name']
    },
    email: {
        type: String,
        required: [true, 'Please enter an email'],
        unique: true,
        trim: true,
        match: [
            /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
            'Please enter a valid email'
        ]
    },
    price: {
        type: Number,
        required: [true, 'Please enter the product price']
    },
    description: {
        type: String,
        required: [true, 'Please enter a description']
    },
    phone: {
        type: String,
        required: [true, 'Please enter a phone number']
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
