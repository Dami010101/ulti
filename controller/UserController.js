// const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const UserModel = require("../model/UserModel");
const registerUser = (async(req, res)=>{
    const{firstName, lastName, email, password} = req.body
    console.log(req.body);
    return;
    if (firstName == '') {
        res.status(400).json("Please enter your first name")
    }
    if (lastName == '') {
        res.status(400).json("Please enter your last name")
    }
    if (email == '') {
        res.status(400).json("Please enter your email address")
    }
    if (password == '') {
        res.status(400).json("Please enter your password")
    }
    if (password.length<6 ) {
        res.status(400).json("Password must be at least 6 characters")
    }
    const uniqueEmail = await UserModel.findOne({email})
    if (uniqueEmail) {
        res.status(400).json("Email already in use")
    }
    const hashPassword = await bcrypt.hash(password, 10)
    const newUser =await UserModel.create(
        {
            firstName,
            lastName,
            email : email,
            password: hashPassword
        }
    )
    // res.status(200).json(newUser)
    res.send(newUser)
    console.log(newUser)
})
// const loginUser = (async(req, res)=>{
//     const{email, password} = req.body
//     const userEmail = await Auth.findOne({email})
//     if (!userEmail) {
//         res.status(400).json("Please enter a valid email address")
//     }
//     if (!password) {
//         res.status(400).json("Please enter a valid password")
//     }else {
//         const isMatch = await bcrypt.compare(password, userEmail.password)
//         if (isMatch) {
//             const token = await jwt.sign({id: userEmail._id, role: 'admin'}, `${process.env.ADMIN}`)
//             res.status(200).json({token, userEmailId: userEmail._id})
//         }
//     }
// })
module.exports = {registerUser}