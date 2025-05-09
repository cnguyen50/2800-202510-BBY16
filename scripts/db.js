const mongoose = require('mongoose');
const uri = process.env.MONGODB_URI;

async function connectDB() {
    if(mongoose.connection.readyState === 0) {
        await mongoose.connect(uri, {
            dbName: process.env.DB_NAME,
        });
        console.log('Connected to MongoDB');
    }

    return {
        db: mongoose.connection.db,
        client: mongoose.connection.getClient(),
    };
}

module.exports = { connectDB, mongoose };