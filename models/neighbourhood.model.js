const {Schema, model} = require('mongoose');

const NeighbourhoodSchema = new Schema({
    neighbourhood_name: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    center: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point',
            required: true
        },
        coordinates: {
            type: [Number],
            required: true
        }
    }
});

NeighbourhoodSchema.index({ center: '2dsphere' });

module.exports = model('Neighbourhood', NeighbourhoodSchema);