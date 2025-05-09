const {Schema, model} = require('mongoose');
module.exports = model('Neighbourhood', new Schema({
    neighbourhood_name: {
        type: String,
        required: true,
        unique: true
    }
}));