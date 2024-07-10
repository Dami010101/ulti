//creating server
const express = require('express');
const app = express();
const dotenv=require('dotenv').config()
const PORT = 8004
const mongoose = require("mongoose")

//path for media file upload
const path = require('path')


//importing route---> to be done after done with route
const userRoute = require('../route/UserRoute')
const adminRoute = require('../route/AdminRoute')


//send request--->to be done after done with route
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))
app.use('/profilePicture', express.static(path.join(__dirname, 'profilePicture')))
app.use('/api/user', userRoute)
app.use("/api/admin", adminRoute);

// creating server
console.log(process.env.ULTMD)
mongoose.connect (process.env.ULTMD)
.then ((req,res)=>{
    app.listen (PORT,()=>{
        console.log(`server is now running ${PORT}` );
    })
    console.log('db connected');
    app.get('/',(req,res)=>{
        res.send('home page')
    })    
})
    .catch((err)=>{
    console.log(err);
})