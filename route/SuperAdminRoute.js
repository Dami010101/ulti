const express = require("express");
const router = express.Router();
const auth = require('../middleware/authMiddleware');

const { upload } = require('../utility/fileUpload');

const {
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
} = require("../controller/SuperAdminController");

// SuperAdmin routes
router.post("/register", registerSuperAdmin); // Register a new super admin
router.post("/login", loginSuperAdmin); // Login super admin
router.put("/update/:id", updateSuperAdmin); // Update super admin details

// User routes
router.post("/register/user", registerUser);
router.get("/users", viewAllUsers); // View all users
router.get("/users/:id", viewOneUser); // View one user
router.put("/users/:id", updateUser); // Update user details
router.delete("/users/:id", deleteUser); // Delete a user

// Admin routes
router.post("/register/admin", registerAdmin); // Register a new admin
router.get("/admins", viewAllAdmins); // View all admins
router.get("/admins/:id", viewOneAdmin); // View one admin
router.put("/admins/:id", updateAdmin); // Update admin details
router.delete("/admins/:id", deleteAdmin); // Delete an admin

// Product routes
router.post("/products", upload.single('image'), createProduct); // Create a new product with image upload
router.get("/products", viewAllProducts); // View all products
router.get("/products/:id", viewOneProduct); // View one product
router.put("/products/:id", upload.single('image'), updateProduct); // Update product details with image upload
router.delete("/products/:id", deleteProduct); // Delete a product

// Order routes
router.get("/orders", viewAllOrders); // View all orders
router.put("/orders/payment/:orderId", updatePaymentStatus); // Update payment status
router.put("/orders/delivery/:orderId", updateDeliveryStatus); // Update delivery status

// Search engine route
router.get("/search", searchEngine);

// Protected route
router.get("/protected", auth, (req, res) => {
    res.send("This is a protected route");
});

module.exports = router;
