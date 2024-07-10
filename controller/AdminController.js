const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const AdminModel = require("../model/AdminModel");
const UserModel = require("../model/UserModel");
const ProductModel = require("../model/ProductModel");
// const fs = require('fs');//for profile picture upload
// const path = require('path');
// const multer = require("multer");// for product image upload
const OrderModel = require("../model/OrderModel");
const { fileSizeFormatter } = require("../utility/fileUpload");
const cloudinary = require('../config/cloudinaryConfig');

// Register a new admin
const registerAdmin = async (req, res) => {
    const {
        firstName,
        lastName,
        email,
        password,
        street,
        postcode,
        country,
        stateCounty,
        cityTown,
        age,
        sex,
        maritalStatus,
        phoneNumber,
        nationality
    } = req.body;

    // Validate required fields
    if (!firstName) return res.status(400).json("Please enter your first name");
    if (!lastName) return res.status(400).json("Please enter your last name");
    if (!email) return res.status(400).json("Please enter your email address");
    if (!password) return res.status(400).json("Please enter your password");
    if (password.length < 6) return res.status(400).json("Password must be at least 6 characters");

    // Check if the email is already in use
    const uniqueEmail = await AdminModel.findOne({ email });
    if (uniqueEmail) return res.status(400).json("Email already in use");

    // Hash the password
    const hashPassword = await bcrypt.hash(password, 10);

    // Create a new admin
    const newAdmin = await AdminModel.create({
        firstName,
        lastName,
        email,
        password: hashPassword,
        street,
        postcode,
        country,
        stateCounty,
        cityTown,
        age,
        sex,
        maritalStatus,
        phoneNumber,
        nationality
    });

    // Send the new admin data in the response
    res.status(200).json(newAdmin);
};

// Login a admin
const loginAdmin = async (req, res) => {
    const { email, password } = req.body;

    // Validate required fields
    if (!email) return res.status(400).json("Please enter your email address");
    if (!password) return res.status(400).json("Please enter your password");

    // Check if the admin exists
    const admin = await AdminModel.findOne({ email });
    if (!admin) return res.status(400).json("Invalid email or password");

    // Compare the password with the hashed password
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) return res.status(400).json("Invalid email or password");

    // Create a JWT token
    const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, {
        expiresIn: "1h"
    });

    // Send the token and admin data in the response
    res.status(200).json({ token, admin });
};

// Update admin details
const updateAdmin = async (req, res) => {
    const {
        firstName,
        lastName,
        email,
        password,
        street,
        postcode,
        country,
        stateCounty,
        cityTown,
        age,
        sex,
        maritalStatus,
        phoneNumber,
        nationality
    } = req.body;

    let profilePicture = '';

    // // Check if a new profile picture is uploaded
    // if (req.file) {
    //     profilePicture = req.file.path;
    //     // Optionally, delete the old profile picture file if necessary
    // }

    if (req.file) {
        try {
            const uploadProfilePicture = await cloudinary.uploader.upload(req.file.path, {
                folder: "profilePicture",
                resource_type: "image",
            });
            profilePicture = uploadProfilePicture.secure_url;
      
        } catch (error) {
            throw new Error("Image could not be uploaded");
        }
    }


    // Find and update the admin by ID
    AdminModel.findByIdAndUpdate(
        req.params.id,
        {
            firstName,
            lastName,
            email,
            password: await bcrypt.hash(password, 10),
            street,
            postcode,
            country,
            stateCounty,
            cityTown,
            age,
            sex,
            maritalStatus,
            phoneNumber,
            nationality,
            ...(profilePicture && { profilePicture }) // Update profile picture if a new one is uploaded

        },
        {
            new: true,
            runValidators: true
        }
    )
    .then(() => {
        res.status(200).json("Admin account updated successfully");
    })
    .catch((error) => {
        res.status(404).json(error);
    });
};

// View all users
const viewAllUsers = (req, res) => {
    UserModel.find()
    .then((users) => {
        res.status(200).json(users);
    })
    .catch(error => res.status(401).json('error' + error));
};

// View one user
const viewOneUser = (req, res) => {
    UserModel.findById(req.params.id)
    .then((user) => {
        if (!user) return res.status(404).json("User not found");
        res.status(200).json(user);
    })
    .catch(error => res.status(401).json('error' + error));
};

// Update user details
const updateUser = async (req, res) => {
    const {
        firstName,
        lastName,
        email,
        phoneNumber,
        sex,
        age,
        maritalStatus,
        nationality,
        street,
        postcode,
        stateCounty,
        cityTown,
        profilePicture
    } = req.body;

    // Find and update the user by ID
    UserModel.findByIdAndUpdate(
        req.params.id,
        {
            firstName,
            lastName,
            email,
            phoneNumber,
            sex,
            age,
            maritalStatus,
            nationality,
            street,
            postcode,
            stateCounty,
            cityTown,
            profilePicture
        },
        {
            new: true,
            runValidators: true
        }
    )
    .then(() => {
        res.status(200).json("User account updated successfully");
    })
    .catch((error) => {
        res.status(404).json(error);
    });
};

// Delete a user
const deleteUser = (req, res) => {
    UserModel.findByIdAndDelete(req.params.id)
    .then(() => {
        res.status(200).json("User deleted successfully");
    })
    .catch(error => res.status(404).json('error' + error));
};

// Set up multer storage and file filter for product upload
// const storage = multer.diskStorage({
//     destination: function (req, file, cb) {
//         cb(null, "uploads/"); // Change this to your desired upload folder
//     },
//     filename: function (req, file, cb) {
//         cb(null, Date.now() + path.extname(file.originalname)); // Append extension
//     }
// });

// const fileFilter = (req, file, cb) => {
//     // Accept only image files
//     if (file.mimetype.startsWith("image/")) {
//         cb(null, true);
//     } else {
//         cb(new Error("Invalid file type, only images are allowed!"), false);
//     }
// };

// const upload = multer({ storage: storage, fileFilter: fileFilter });

// Upload image
const uploadImage = async (req) => {
    if (req.file) {
        try {
            const uploadedFile = await cloudinary.uploader.upload(req.file.path, {
                folder: "uploads",
                resource_type: "image",
            });
            return {
                fileName: req.file.originalname,
                filePath: uploadedFile.secure_url,
                fileType: req.file.mimetype,
                fileSize: fileSizeFormatter(req.file.size, 2),
            };
        } catch (error) {
            throw new Error("Image could not be uploaded");
        }
    }
    return null;
};

// Create a new product
// const createProduct = async (req, res) => {
//     const { name, brand, price, description, category } = req.body;
//     const image = req.file ? req.file.path : null;

//     if (!name || !brand || !price || !description || !category || !image) {
//         return res.status(400).json("Please fill in all required fields");
//     }

//     try {
//         const newProduct = await ProductModel.create({
//             name,
//             brand,
//             price,
//             description,
//             category,
//             image
//         });
//         res.status(201).json(newProduct);
//     } catch (error) {
//         res.status(500).json(error.message);
//     }
// };

// Create a new product
const createProduct = async (req, res) => {
    const { name, brand, price, description, category } = req.body;
    // console.log(req.body);
    // return;
    // Validate required fields
    if (!name || !brand || !price || !description || !category) {
        return res.status(400).json("Please fill in all required fields");
    }

    try {
        const fileData = await uploadImage(req);
        if (!fileData) {
            return res.status(400).json("Please upload an image");
        }

        const newProduct = await ProductModel.create({
            name,
            brand,
            price,
            description,
            category,
            image: fileData.filePath // Ensure this is assigned correctly
        });

        res.status(200).json(newProduct);
    } catch (error) {
        res.status(500).json(error.message);
    }
};

// Update product details
const updateProduct = async (req, res) => {
    const { name, brand, price, description, category } = req.body;
    const image = req.file ? req.file.path : req.body.image; // Use new image if uploaded, else keep the old one

    try {
        const updatedProduct = await ProductModel.findByIdAndUpdate(
            req.params.id,
            { name, brand, price, description, category, image },
            { new: true, runValidators: true }
        );
        if (!updatedProduct) return res.status(404).json("Product not found");
        res.status(200).json(updatedProduct);
    } catch (error) {
        res.status(500).json(error.message);
    }
};

// View one product
const viewOneProduct = async (req, res) => {
    try {
        const product = await ProductModel.findById(req.params.id);
        if (!product) return res.status(404).json("Product not found");
        res.status(200).json(product);
    } catch (error) {
        res.status(500).json(error.message);
    }
};

// View all products
const viewAllProducts = async (req, res) => {
    try {
        const products = await ProductModel.find();
        res.status(200).json(products);
    } catch (error) {
        res.status(500).json(error.message);
    }
};

// Delete a product
const deleteProduct = async (req, res) => {
    try {
        const deletedProduct = await ProductModel.findByIdAndDelete(req.params.id);
        if (!deletedProduct) return res.status(404).json("Product not found");
        res.status(200).json("Product deleted successfully");
    } catch (error) {
        res.status(500).json(error.message);
    }
};

// View all orders
const viewAllOrders = (req, res) => {
    OrderModel.find()
        .then((orders) => {
            res.status(200).json(orders);
        })
        .catch(error => res.status(500).json({ error: error.message }));
};

// Update payment status
const updatePaymentStatus = (req, res) => {
    const { orderId } = req.params;
    const { paymentStatus } = req.body;

    OrderModel.findByIdAndUpdate(orderId, { paymentStatus }, { new: true })
        .then((order) => {
            res.status(200).json(order);
        })
        .catch(error => res.status(500).json({ error: error.message }));
};

// Update delivery status
const updateDeliveryStatus = (req, res) => {
    const { orderId } = req.params;
    const { deliveryStatus } = req.body;

    OrderModel.findByIdAndUpdate(orderId, { deliveryStatus }, { new: true })
        .then((order) => {
            res.status(200).json(order);
        })
        .catch(error => res.status(500).json({ error: error.message }));
};

module.exports = { 
    registerAdmin, 
    loginAdmin, 
    updateAdmin, 
    viewAllUsers, 
    viewOneUser, 
    updateUser, 
    deleteUser, 
    createProduct,
    viewOneProduct,
    viewAllProducts,
    updateProduct,
    deleteProduct,
    viewAllOrders,
    updatePaymentStatus, 
    updateDeliveryStatus,
    // upload // Export upload
 };
