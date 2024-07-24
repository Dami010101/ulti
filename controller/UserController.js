const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const UserModel = require("../model/UserModel");
const fs = require('fs');
const path = require('path');
const OrderModel = require("../model/OrderModel");
const cloudinary = require('cloudinary').v2; // Ensure you have cloudinary setup

// Register a new user
const registerUser = async (req, res) => {
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
    // console.log(req.body);
    // return;
    if (!firstName) return res.status(400).json("Please enter your first name");
    if (!lastName) return res.status(400).json("Please enter your last name");
    if (!email) return res.status(400).json("Please enter your email address");
    if (!password) return res.status(400).json("Please enter your password");
    if (password.length < 6) return res.status(400).json("Password must be at least 6 characters");

    const uniqueEmail = await UserModel.findOne({ email });
    if (uniqueEmail) return res.status(400).json("Email already in use");

    const hashPassword = await bcrypt.hash(password, 10);

    const newUser = new UserModel({
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

    await newUser.save();

    res.status(200).json(newUser);
};

// Login a user
const loginUser = async (req, res) => {
    const { email, password } = req.body;

    if (!email) return res.status(400).json("Please enter your email address");
    if (!password) return res.status(400).json("Please enter your password");

    const user = await UserModel.findOne({ email });
    if (!user) return res.status(400).json("Invalid email or password");

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json("Invalid email or password");

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
        expiresIn: "1h"
    });

    res.status(200).json({ token, user });
};

// Update user
const updateUser = async (req, res) => {
    try {
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
            pob,
            sex,
            maritalStatus,
            phoneNumber,
            nationality
        } = req.body;

        if (
            !firstName || !lastName || !email || !street || !postcode || !country || !stateCounty ||
            !cityTown || !sex || !phoneNumber
        ) {
            return res.status(400).json("Please fill in all required fields");
        }
        let profilePicture = '';

        // Log for debugging
        console.log('Request file:', req.file);

        if (req.file) {
            try {
                const uploadProfilePicture = await cloudinary.uploader.upload(req.file.path, {
                    folder: "profilePicture",
                    resource_type: "image",
                });
                profilePicture = uploadProfilePicture.secure_url;
                console.log('Profile picture uploaded:', profilePicture);
            } catch (error) {
                console.error('Image upload error:', error);
                throw new Error("Image could not be uploaded");
            }
        }

        const hashpassword = await bcrypt.hash(password, 10);

        const updateFields = {
            firstName,
            lastName,
            email,
            street,
            postcode,
            country,
            pob,
            stateCounty,
            cityTown,
            age,
            sex,
            maritalStatus,
            phoneNumber,
            nationality,
            password: hashpassword,
            ...(profilePicture && { profilePicture }) // Update profile picture if a new one is uploaded
        };

        const updatedUser = await UserModel.findByIdAndUpdate(
            req.params.id,
            updateFields,
            {
                new: true,
                runValidators: true
            }
        );

        if (!updatedUser) {
            return res.status(404).json("User not found");
        }

        res.status(200).json(updatedUser);
    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({ error: error.message });
    }
};

// View all users
const viewAllUser = (req, res) => {
    UserModel.find()
        .then((users) => {
            console.log('Users found:', users);
            res.status(200).json(users);
        })
        .catch(error => {
            console.error('Error fetching users:', error);
            res.status(401).json('error' + error)
        });
};

// Place a new order
const placeOrder = async (req, res) => {
    const {
        firstName,
        lastName,
        email,
        street,
        postcode,
        country,
        stateCounty,
        cityTown,
        phoneNumber,
        cartPageUrl,
        totalAmount
    } = req.body;

    try {
        const newOrder = new OrderModel({
            firstName,
            lastName,
            email,
            street,
            postcode,
            country,
            stateCounty,
            cityTown,
            phoneNumber,
            totalAmount,
            cartPageUrl,
        });

        await newOrder.save();
        res.status(200).json(newOrder);
    } catch (error) {
        console.error('Place order error:', error);
        res.status(500).json({ error: error.message });
    }
};

module.exports = { registerUser, loginUser, updateUser, viewAllUser, placeOrder };
