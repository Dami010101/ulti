const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const UserModel = require("../model/UserModel");
const fs = require('fs');
const path = require('path');
const OrderModel = require("../model/OrderModel");
const cloudinary = require('cloudinary').v2; // Ensure you have cloudinary setup
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const userVerify = require("../model/userVerification");
const sendPasswordResetEmail = require("../utility/sendMail");




// Nodemailer configuration
const transporter = nodemailer.createTransport({
    service: 'gmail',
    host: process.env.EMAIL_HOST,
    auth: {
        user: process.env.EMAIL_SECRET,
        pass: process.env.PASS_SECRET
    },
    tls: {
        rejectUnauthorized: false
    }
});

// testing
transporter.verify((error, success) => {
    if (error) {
        console.log(error);
    } else {
        console.log('Ready for message');
        console.log(success);
    }
});

const registerUser = async (req, res) => {
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
            sex,
            maritalStatus,
            phoneNumber,
            nationality
        } = req.body;

        // Validate required fields
        if (!firstName) return res.status(400).json({ message: "Please enter your first name" });
        if (!lastName) return res.status(400).json({ message: "Please enter your last name" });
        if (!email) return res.status(400).json({ message: "Please enter your email address" });
        if (!password) return res.status(400).json({ message: "Please enter your password" });
        if (password.length < 6) return res.status(400).json({ message: "Password must be at least 6 characters" });

        // Check if email is already in use
        const existingUser = await UserModel.findOne({ email });
        if (existingUser) return res.status(400).json({ message: "Email already in use" });

        // Hash the password
        const hashPassword = await bcrypt.hash(password, 10);

        // Create and save the new user
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
            isVerified: false
        });

        const savedUser = await newUser.save();
        // Account verification
        await sendEmailVerification(savedUser, res);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const sendEmailVerification = async ({ _id, email }, res) => {
    try {
        const otp = `${Math.floor(1000 + Math.random() * 9000)}`;
        const mailOptions = {
            from: process.env.EMAIL_SECRET,
            to: email,
            subject: 'Verify your email',
            html: `<p>Use the OTP <b>${otp}</b> in the app to verify your email address and complete your registration. <b>Expires in 6 hours</b>.</p>`
        };
        const saltRounds = 10;
        const hashedOTP = await bcrypt.hash(otp, saltRounds);
        const newVerify = new userVerify({
            userId: _id,
            otp: hashedOTP,
            createdAt: Date.now(),
            expiresAt: Date.now() + 3600000 * 6 // 6 hours
        });

        await newVerify.save();
        await transporter.sendMail(mailOptions);
        res.status(200).json({ message: 'Verification OTP email sent', data: { userId: _id, email } });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const verifyOtp = async (req, res) => {  // Corrected function name and arguments order
    try {
        const { userId, otp } = req.body;
        if (!userId || !otp) {
            throw new Error('Empty OTP details are not allowed');
        }

        const otpVerifyRecord = await userVerify.findOne({ userId });
        if (!otpVerifyRecord) {
            throw new Error('Account record does not exist');
        }
        const { expiresAt, otp: hashedOtp } = otpVerifyRecord;
        if (expiresAt < Date.now()) {
            await userVerify.deleteMany({ userId });
            throw new Error('OTP code has expired');
        }

        const isValidOtp = await bcrypt.compare(otp, hashedOtp);
        if (!isValidOtp) {
            throw new Error('Invalid OTP code');
        }

        await UserModel.updateOne({ _id: userId }, { isVerified: true });
        await userVerify.deleteMany({ userId });

        res.status(200).json({ message: 'User email verified successfully' });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};
const resendVerificationOtp = async (req, res) => {  // Corrected function name and arguments order
    try {
        const { userId, email } = req.body;
        if (!userId || !email) {
            throw new Error('Empty user details');
        }

        await userVerify.deleteMany({ userId });
        await sendEmailVerification({ _id: userId, email }, res);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Login a user
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate input
        if (!email) return res.status(400).json({ message: "Please enter your email address" });
        if (!password) return res.status(400).json({ message: "Please enter your password" });

        // Check if the user exists
        const user = await UserModel.findOne({ email });
        if (!user) return res.status(400).json({ message: "Invalid email or password" });

        // Check if the password is correct
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: "Invalid email or password" });

        // Ensure the user is verified before allowing login
        if (!user.isVerified) {
            return res.status(400).json({ message: 'Email not verified. Please check your email for the verification OTP.' });
        }

        // Generate JWT token if verification passed
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });

        // Send the token and user information
        res.status(200).json({ token, user });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}
;

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
const changePassword = async (req, res, next) => {
    try {
        const user = await UserModel.findById(req.user._id)
        const { oldPassword, password } = req.body;

        if (!user) {
            res.status(404);
            return res.json({ message: 'User not found, please sign up' });
        }

        // Validation
        if (!oldPassword || !password) {
            res.status(400);
            return res.json({ message: 'Please add both old and new password' });
        }
        
        // Check if old password matches password in DB
        const passwordIsCorrect = await bcrypt.compare(oldPassword, user.password);
        // console.log(user)
        // console.log('Token:', token);
        // console.log('Decoded JWT:', decoded);

        // Save new password 
        if (passwordIsCorrect) {
            user.password = await bcrypt.hash(password, 10);
            await user.save();
            res.status(200).json({ message: 'Password change successful' });
        } else {
            res.status(400);
            return res.json({ message: 'Old password is incorrect' });
        }
    } catch (error) {
        next(error); // Pass the error to the error-handling middleware
    }
};





const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await UserModel.findOne({ email });
        
        if (!user) {
            return res.status(404).json({ success: false, message: 'User does not exist' });
        }

        // Create reset token using JWT
        const resetToken = jwt.sign(
            { userId: user._id }, 
            process.env.JWT_SECRET, 
            { expiresIn: '30m' } // Token expires in 30 minutes
        );

        // Construct the reset URL
        const resetURL = `${process.env.CLIENT_URL}/resetpassword/${resetToken}`;

        // Email message
        const message = `
            <h2>Hello ${user.name}</h2>
            <p>Please use the URL below to reset your password</p>
            <p>The reset link is only valid for 30 minutes</p>
            <a href=${resetURL} clicktracking=off>${resetURL}</a>
            <p>Regards,</p>
            <p>Your Company</p>
        `;

        // Sending the reset email using sendEmailVerification
        const subject = "Password Reset Request";
        await sendPasswordResetEmail({ email: user.email, subject, message }, res);

    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: "Email not sent, please try again later" });
    }
};


// Verify reset token

const resetPassword = async (req, res) => {
    const { token, password } = req.body;

    try {
        // Verify the token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await UserModel.findById(decoded.userId);

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found or invalid token' });
        }

        // Hash the new password before saving
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Update the user's password with the hashed password
        user.password = hashedPassword;
        await user.save();

        res.status(200).json({ success: true, message: "Password has been reset successfully" });
    } catch (error) {
        return res.status(400).json({ success: false, message: "Invalid or expired token" });
    }
};




module.exports = { registerUser, loginUser, updateUser, viewAllUser, placeOrder, changePassword, forgotPassword, resetPassword, verifyOtp,resendVerificationOtp};
