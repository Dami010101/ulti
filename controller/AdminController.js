const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const AdminModel = require("../model/AdminModel");
const UserModel = require("../model/UserModel");

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
            nationality
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
        address,
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
            address,
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

module.exports = { registerAdmin, loginAdmin, updateAdmin, viewAllUsers, viewOneUser, updateUser, deleteUser };
