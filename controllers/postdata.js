const usermodel = require("../models/usermodel")
const mongoose = require('mongoose')



const post = async (name, email, password,res)=>{
    usermodel.create({
        name:name,
        email:email,
        password:password
    })
    res.cookie("email",email)
    res.redirect("/home")
    console.log("User created successfully!");
}
module.exports = { post };