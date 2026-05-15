const mongoose= require('mongoose');

const DocumentSchema= new mongoose.Schema({
    title:{
        type:String, 
        required:true, 
        default:"New Document"
    },
    owner:{
        type:String,
        required:true
    },
    content:{
        type:String,
        default:""
    },
    created_at:{
        type:Date,
        default:Date.now
    },
    updated_at:{
        type:Date,
        default:Date.now
    }

});
module.exports = mongoose.model('Document',DocumentSchema);