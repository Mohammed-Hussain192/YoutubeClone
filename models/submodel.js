const mongoose = require('mongoose');

const chn = mongoose.Schema({
  email: String,
  channelID: String,
  channelTitle: String,
  channellogo:String,
});

module.exports = mongoose.model("creators", chn);
