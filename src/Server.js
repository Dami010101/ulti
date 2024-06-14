//creating server
const express = require('express');
const app = express();
const dotenv=require('dotenv').config()
const PORT = 8004
const mongoose = require("mongoose")

//importing route---> to be done after done with route
const userRoute = require('../route/UserRoute')

//send request--->to be done after done with route
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use('/api/user', userRoute)

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