const express = require("express");
const router = express.Router();
const auth = require("../middleware/AuthMiddleware");
const { upload } = require('../utility/fileUpload');


const {
    registerAdmin,
    loginAdmin,
    updateAdmin,
    registerUser,
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
    searchEngine, 
    verifyOtp,
    resendVerificationOtp
    // upload // Import upload middleware
} = require("../controller/AdminController");

// Admin routes
router.post("/register", registerAdmin); // Register a new admin
router.post("/login", loginAdmin); // Login admin
router.put("/update/:id", upload.single('profilePicture'), updateAdmin); // Update admin details

//managing users
router.post("/register/user", registerUser);
router.get("/users", viewAllUsers); // View all users
router.get("/users/:id", viewOneUser); // View one user
router.put("/users/:id", updateUser); // Update user details
router.delete("/users/:id", deleteUser); // Delete a user

// Product routes
router.post("/products", upload.single('image'), createProduct); // Create a new product with image upload
router.get("/products", viewAllProducts); // View all products
router.get("/products/:id", viewOneProduct); // View one product
router.put("/products/:id", upload.single('image'), updateProduct); // Update product details with image upload
router.delete("/products/:id", deleteProduct); // Delete a product

// managing orders
router.get("/orders", viewAllOrders); // View all orders
router.put("/orders/payment/:orderId", updatePaymentStatus); // Update payment status
router.put("/orders/delivery/:orderId", updateDeliveryStatus); // Update delivery status

//search engine route
router.get("/search", searchEngine);

//email verification
router.post('/verifyotp',verifyOtp)
router.post('/resendverifyotp',resendVerificationOtp)

// Protected route
router.get("/protected", auth, (req, res) => {
    res.send("This is a protected route");
});

module.exports = router;
