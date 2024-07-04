const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const UserModel = require("../model/UserModel");
const fs = require('fs');
const path = require('path');

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

    // Check if a new profile picture is uploaded
    if (req.file) {
        profilePicture = req.file.path;
        // Optionally, delete the old profile picture file if necessary
    }

    const updatedUser = await UserModel.findByIdAndUpdate(
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
    );

    if (!updatedUser) {
        return res.status(404).json("User not found");
    }

    res.status(200).json(updatedUser);
};

// View all users
const viewAllUser = (req, res) => {
    UserModel.find()
        .then((user) => {
            res.status(200).json(user);
        })
        .catch(error => res.status(401).json('error' + error))
}

module.exports = { registerUser, loginUser, updateUser, viewAllUser };
