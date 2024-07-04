const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");

const {
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
    upload // Import upload middleware
} = require("../controller/AdminController");

// Admin routes
router.post("/register", registerAdmin); // Register a new admin
router.post("/login", loginAdmin); // Login admin
router.put("/update/:id", updateAdmin); // Update admin details
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

// Protected route
router.get("/protected", auth, (req, res) => {
    res.send("This is a protected route");
});

module.exports = router;
