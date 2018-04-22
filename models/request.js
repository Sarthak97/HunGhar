var mongoose = require("mongoose");

var ReqSchema = new mongoose.Schema({
   claim: String,
   type: String,
   amount: String
});

module.exports = mongoose.model("Request", ReqSchema);