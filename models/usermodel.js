const mongoose  = require('mongoose')
const userSchema =mongoose.Schema( {
    name:{
        type:String,
       
    },
    email:{
        type:String,
       unique:false,
    },
    
    password:String,
    
    
  
   

});
module.exports=mongoose.model("peron",userSchema)