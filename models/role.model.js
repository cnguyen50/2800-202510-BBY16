const {Schema, model} = require('mongoose');

module.exports = model('Role', new Schema({
    role_name: {
        type:String,
        required: true,
        unique: true
    }
}))