const usermodel = require("../models/usermodel")
const mongoose = require('mongoose')



const login = async (email, pass,res,req)=>{
    let findone = await usermodel.findOne({
        email:email,
    })
    if(findone){
        if(pass==findone.password){
            res.cookie("email",findone.email)
            console.log("logined successfull")

            res.redirect("/home")
        }else{
            res.cookie("email","")
            console.log("something went wrong")
            let suc= req.flash("error","Email or password is incorrect")
            res.redirect("/")
        }
    }else{
        console.log("email not found")
        res.cookie("email","")
        let suc= req.flash("error","Email Not Found! Create a New Account")
        res.redirect("/register")
    }

}
module.exports = { login };