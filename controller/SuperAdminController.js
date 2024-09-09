const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const SuperAdminModel = require("../model/SuperAdminModel")
const AdminModel = require("../model/AdminModel");
const UserModel = require("../model/UserModel");
const ProductModel = require("../model/ProductModel");
const fs = require('fs');//for profile picture upload
const path = require('path');
// const multer = require("multer");// for product image upload
const OrderModel = require("../model/OrderModel");
const { fileSizeFormatter } = require("../utility/fileUpload");
const cloudinary = require('cloudinary').v2; // Ensure you have cloudinary setup
const superAdminVerify = require("../model/superAdminVerification");
const nodemailer = require('nodemailer');


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


// Register a new superAdmin
const registerSuperAdmin = async (req, res) => {
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
        if (!firstName) return res.status(400).json("Please enter your first name");
        if (!lastName) return res.status(400).json("Please enter your last name");
        if (!email) return res.status(400).json("Please enter your email address");
        if (!password) return res.status(400).json("Please enter your password");
        if (password.length < 6) return res.status(400).json("Password must be at least 6 characters");

        // Check if the email is already in use
        const uniqueEmail = await SuperAdminModel.findOne({ email });
        if (uniqueEmail) return res.status(400).json("Email already in use");

        // Hash the password
        const hashPassword = await bcrypt.hash(password, 10);

        // Create a new superAdmin
        const newSuperAdmin = new SuperAdminModel({
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

        // Save the new superAdmin to the database
        const savedSuperAdmin = await newSuperAdmin.save();

        // Account verification
        await sendEmailVerification(savedSuperAdmin, res);

        // Send the new superAdmin data in the response
        res.status(200).json(savedSuperAdmin);

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
        const newVerify = new superAdminVerify({
            superAdminId: _id,
            otp: hashedOTP,
            createdAt: Date.now(),
            expiresAt: Date.now() + 3600000 * 6 // 6 hours
        });

        await newVerify.save();
        await transporter.sendMail(mailOptions);
        res.status(200).json({ message: 'Verification OTP email sent', data: { superAdminId: _id, email } });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const verifyOtp = async (req, res) => {  // Corrected function name and arguments order
    try {
        const { superAdminId, otp } = req.body;
        if (!superAdminId || !otp) {
            throw new Error('Empty OTP details are not allowed');
        }

        const otpVerifyRecord = await superAdminVerify.findOne({ superAdminId });
        if (!otpVerifyRecord) {
            throw new Error('Account record does not exist');
        }

        const { expiresAt, otp: hashedOtp } = otpVerifyRecord;
        if (expiresAt < Date.now()) {
            await superAdminVerify.deleteMany({ superAdminId });
            throw new Error('OTP code has expired');
        }

        const isValidOtp = await bcrypt.compare(otp, hashedOtp);
        if (!isValidOtp) {
            throw new Error('Invalid OTP code');
        }

        await SuperAdminModel.updateOne({ _id: superAdminId }, { isVerified: true });
        await superAdminVerify.deleteMany({ superAdminId });

        res.status(200).json({ message: 'SuperAdmin email verified successfully' });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};
const resendVerificationOtp = async (req, res) => {  // Corrected function name and arguments order
    try {
        const { superAdminId, email } = req.body;
        if (!superAdminId || !email) {
            throw new Error('Empty superadmin details');
        }

        await superAdminVerify.deleteMany({ superAdminId });
        await sendEmailVerification({ _id: superAdminId, email }, res);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};


// Login a superAdmin
const loginSuperAdmin = async (req, res) => {
    const { email, password } = req.body;

    // Validate required fields
    if (!email) return res.status(400).json("Please enter your email address");
    if (!password) return res.status(400).json("Please enter your password");

    // Check if the superAdmin exists
    const superAdmin = await SuperAdminModel.findOne({ email });
    if (!superAdmin) return res.status(400).json("Invalid email or password");

    // Compare the password with the hashed password
    const isMatch = await bcrypt.compare(password, superAdmin.password);
    if (!isMatch) return res.status(400).json("Invalid email or password");

     // Ensure the supersdmin is verified before allowing login
     if (!superAdmin.isVerified) {
        return res.status(400).json({ message: 'Email not verified. Please check your email for the verification OTP.' });
    }

    // Create a JWT token
    const token = jwt.sign({ id: superAdmin._id }, process.env.JWT_SECRET, {
        expiresIn: "1h"
    });

    // Send the token and superAdmin data in the response
    res.status(200).json({ token, superAdmin });
};



const updateSuperAdmin = async (req, res) => {
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

        const updatedSuperAdmin = await SuperAdminModel.findByIdAndUpdate(
            req.params.id,
            updateFields,
            {
                new: true,
                runValidators: true
            }
        );

        if (!updatedSuperAdmin) {
            return res.status(404).json("SuperAdmin not found");
        }

        res.status(200).json(updatedSuperAdmin);
    } catch (error) {
        console.error('Update superAdmin error:', error);
        res.status(500).json({ error: error.message });
    }
};

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

// View all admins
const viewAllAdmins = (req, res) => {
    AdminModel.find()
    .then((admins) => {
        res.status(200).json(admins);
    })
    .catch(error => res.status(401).json('error' + error));
};

// View one admin
const viewOneAdmin = (req, res) => {
    AdminModel.findById(req.params.id)
    .then((admin) => {
        if (!admin) return res.status(404).json("Admin not found");
        res.status(200).json(admin);
    })
    .catch(error => res.status(401).json('error' + error));
};

// Update admin details
const updateAdmin = async (req, res) => {
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

    // Find and update the admin by ID
    AdminModel.findByIdAndUpdate(
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
        res.status(200).json("Admin account updated successfully");
    })
    .catch((error) => {
        res.status(404).json(error);
    });
};

// Delete an admin
const deleteAdmin = (req, res) => {
    AdminModel.findByIdAndDelete(req.params.id)
    .then(() => {
        res.status(200).json("Admin deleted successfully");
    })
    .catch(error => res.status(404).json('error' + error));
};



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

    //search engine
const searchEngine = async (req, res)=>{
  const { query } = req.query;

  try {
    if (!query) {
      return res.status(400).json({ message: 'Query parameter is required' });
    }

    // Perform search (case-insensitive, partial match)
    const products = await ProductModel.find({
      name: { $regex: query, $options: 'i' },
    });

    res.json({ products });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }

}


module.exports = { 
    registerSuperAdmin, 
    loginSuperAdmin, 
    updateSuperAdmin, 
    registerUser,
    viewAllUsers, 
    viewOneUser, 
    updateUser, 
    deleteUser, 
    registerAdmin,
    viewAllAdmins, 
    viewOneAdmin, 
    updateAdmin, 
    deleteAdmin, 
    createProduct,
    viewOneProduct,
    viewAllProducts,
    updateProduct,
    deleteProduct,
    viewAllOrders,
    updatePaymentStatus, 
    updateDeliveryStatus,
    searchEngine,
    verifyOtp,
    resendVerificationOtp
 };
