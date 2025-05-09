const mongoose = require('mongoose');

const savedVideoSchema = new mongoose.Schema({
  email:String,
  id:String,
  title:String,
  channelTitle:String,
  description:String,
  thumbnail:String,
  url:String,
})

module.exports = mongoose.model('Saved', savedVideoSchema);



