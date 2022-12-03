const mongoose = require("mongoose");

let userSchema = new mongoose.Schema({
  username: {
    type: "String"
  },
  password: {
    type: "String"
  }
})
// 對應著該 test db 的 users collection
const User = mongoose.model("User", userSchema)

module.exports = User