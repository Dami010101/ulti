const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const UserModel = require("../model/UserModel");
const fs = require('fs');
const path = require('path');
const OrderModel = require("../model/OrderModel");
const cloudinary = require('cloudinary').v2; // Ensure you have cloudinary setup
const nodemailer = require('nodemailer');
const crypto = require('crypto');

// Nodemailer configuration
const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      user: process.env.EMAIL_SECRET,
      pass: process.env.PASS_SECRET
    }
});

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
    const verificationToken = crypto.randomBytes(20).toString('hex');

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
        nationality,
        verificationToken
    });

    await newUser.save();

    const mailOptions = {
        from: process.env.EMAIL_SECRET,
        to: newUser.email,
        subject: 'Email Verification',
        text: `Please verify your email by clicking the following link: http://localhost:8004/verify-email?token=${verificationToken}`
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error('Error sending email:', error);
            return res.status(500).send({ error: 'Error sending email' });
        }
        res.status(201).send({ message: 'User registered. Please check your email to verify your account.' });
    });
};

// Email verification
const emailVerification = async (req, res) => {
    const { token } = req.query;

    const user = await UserModel.findOne({ verificationToken: token });
    if (!user) {
        return res.status(400).send({ error: 'Invalid token' });
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    await user.save();

    res.send({ message: 'Email verified successfully. You can now log in.' });
}

// Login a user
const loginUser = async (req, res) => {
    const { email, password } = req.body;

    if (!email) return res.status(400).json("Please enter your email address");
    if (!password) return res.status(400).json("Please enter your password");

    const user = await UserModel.findOne({ email });
    if (!user) return res.status(400).json("Invalid email or password");

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json("Invalid email or password");

    if (!user.isVerified) {
        return res.status(400).send({ error: 'Email not verified. Please check your email.' });
    }

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

        if (!firstName || !lastName || !email || !street || !postcode || !country || !stateCounty ||
            !cityTown || !sex || !phoneNumber) {
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

// Change user password
const changePassword = async (req, res) => {
    const user = await UserModel.findById(req.user._id);

    const { oldPassword, password } = req.body;

    if (!user) {
        res.status(400);
        throw new Error('User Not Found, sign up');
    }

    // validation
    if (!oldPassword || !password) {
        res.status(400);
        throw new Error('Please add old and new password');
    }

    // Check if old password matches password in DB
    const passwordIsCorrect = await bcrypt.compare(oldPassword, user.password);

    // Save new password 
    if (user && passwordIsCorrect) {
        user.password = await bcrypt.hash(password, 10);
        await user.save();
        res.status(200).send('Password change successful');
    } else {
        res.status(404);
        throw new Error('Old password is incorrect');
    }
};

// Forgot password
const forgotPassword = async (req, res) => {
    const { email } = req.body;
    const user = await UserModel.findOne({ email });
    if (!user) {
        res.status(404);
        throw new Error('User does not exist');
    }

    // Delete token if token exists
    let token = await Token.findOne({ userId: user._id });
    if (token) {
        await token.deleteOne();
    }

    // Create reset token
    let resetToken = crypto.randomBytes(32).toString('hex') + user._id;

    // Hash token before saving to DB
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    // Save token to DB
    await new Token({
        userId: user._id,
        token: hashedToken,
        createdAt: Date.now(),
        expiresAt: Date.now() + 30 * (60 * 1000) // 30 minutes
    }).save();

    // Construct reset URL
    const resetURL = `${process.env.CLIENT_URL}/resetpassword/${resetToken}`;

    // Construct reset email
    const message = `
        <h2>Hello ${user.name}</h2>
        <p>Please use the URL below to reset your password</p>
        <p>The reset link is only valid for 30 minutes</p>
        <a href=${resetURL} clicktracking=off>${resetURL}</a>
        <p>Regards,</p>
        <p>Your Company</p>
    `;

    const subject = "Password Reset Request";
    const send_to = user.email;
    const sent_from = process.env.EMAIL_USER;

    try {
        await sendMail(subject, message, send_to, sent_from);
        res.status(200).json({ success: true, message: "Reset Email Sent" });
    } catch (error) {
        res.status(500);
        throw new Error("Email not sent, please try again later");
    }
};

// Reset password
const resetPassword = async (req, res, next) => {
    const { password } = req.body;
    const { resetToken } = req.params;

    // Hash token, then compare to Token in DB
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    // Find token in DB
    const userToken = await Token.findOne({
        token: hashedToken,
        expiresAt: { $gt: Date.now() },
    });

    if (!userToken) {
        res.status(404);
        throw new Error("Invalid or Expired Token");
    }

    // Find user
    const user = await UserModel.findOne({ _id: userToken.userId });
    user.password = await bcrypt.hash(password, 10);
    await user.save();
    res.status(200).json({
        message: "Password Reset Successful, Please Login",
    });
};

module.exports = { registerUser, loginUser, updateUser, viewAllUser, placeOrder, changePassword, forgotPassword, resetPassword, emailVerification };
