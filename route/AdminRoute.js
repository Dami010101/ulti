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
    deleteUser
} = require("../controller/AdminController");

// Admin routes
router.post("/register", registerAdmin); // Register a new admin
router.post("/login", loginAdmin); // Login admin
router.put("/update/:id", updateAdmin); // Update admin details
router.get("/users", viewAllUsers); // View all users
router.get("/users/:id", viewOneUser); // View one user
router.put("/users/:id", updateUser); // Update user details
router.delete("/users/:id", deleteUser); // Delete a user

// protected route
router.get("/protected", auth, (req, res) => {
res.send("This is a protected route");
});

module.exports = router;
