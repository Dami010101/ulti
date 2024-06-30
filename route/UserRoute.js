const express = require("express");
const router = express.Router();
const { registerUser, loginUser, updateUser, viewAllUser } = require("../controller/UserController");
const auth = require("../middleware/authMiddleware");

router.post("/register", registerUser);
router.post("/login", loginUser);
router.put("/update/:id", updateUser);
router.get("/viewAllUser", viewAllUser);

// protected route
router.get("/protected", auth, (req, res) => {
    res.send("This is a protected route");
});

module.exports = router;
