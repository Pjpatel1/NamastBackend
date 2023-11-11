const mongoose = require ('mongoose');
const UserSchema = new mongoose.Schema({
    
    LastName: {
        type: String,
        required: true
      },
    FirstName: {
        type: String,
        required: true
      },
      Email:{
        type:String,
        required: true
      },
      Password: {
        type: String,
        required: true
      },
      Verificationtoken:
      {
        type: String,
        require: true,
        unique: true,
      }
})
const Usermodel =  mongoose.model("User", UserSchema)
module.exports = Usermodel