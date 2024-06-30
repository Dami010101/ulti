const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const UserModel = require("../model/UserModel");

// Register a new user
const registerUser = async (req, res) => {
    // Extract fields from the request body
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
    const uniqueEmail = await UserModel.findOne({ email });
    if (uniqueEmail) return res.status(400).json("Email already in use");

    // Hash the password
    const hashPassword = await bcrypt.hash(password, 10);

    // Create a new user
    const newUser = await UserModel.create({
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

    // Send the new user data in the response
    res.status(200).json(newUser);
};

// Login a user
const loginUser = async (req, res) => {
    const { email, password } = req.body;

    // Validate required fields
    if (!email) return res.status(400).json("Please enter your email address");
    if (!password) return res.status(400).json("Please enter your password");

    // Check if the user exists
    const user = await UserModel.findOne({ email });
    if (!user) return res.status(400).json("Invalid email or password");

    // Compare the password with the hashed password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json("Invalid email or password");

    // Create a JWT token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
        expiresIn: "1h"
    });

    // Send the token and user data in the response
    res.status(200).json({ token, user });
};

//update user
const updateUser = async(req,res)=>{
    const{ firstName,
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
    }=req.body
    UserModel.findByIdAndUpdate(
        req.params.id,
        {
            firstName,
            lastName,
            email,
            password:await bcrypt.hash(password,10),
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
            new:true,
            runValidators:true
        }
        )
    .then(()=>{
            res.status(200).json(" USER ACCOUNT UPDATED SUCCESSFULLY")
        })
    .catch((error)=>{
            res.status(404).json(error)
        })
}

//view all users
const viewAllUser = (req,res) =>{
    UserModel.find() 
    .then((user)=>{
        res.status(200).json(user)
    })
    .catch(error=>res.status(401).json('error'+error))
}

module.exports = { registerUser, loginUser, updateUser, viewAllUser };
