const mongoose= require('mongoose');

const userSchema = new mongoose.Schema({
    name:{
        required:true,
        type: String
    },
    email:{
        required:true,
        unique:true,
        type:String
    },
    password:{
        required:true,
        type:String
    },
    created_at:{
        required:true,
        type:Date,
        default:Date.now
    },
    updated_at:{
        required:true,
        type:Date,
        default:Date.now
    }
});

module.exports = mongoose.model('user',userSchema);