const express  = require('express');
const { registerUser } = require('../controller/UserController');
const router = express.Router();

router.post('/register_user', registerUser);
// router.post('/login_user', loginUser);
module.exports = router;