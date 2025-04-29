const { MongoClient } = require('mongodb');
require('dotenv').config();     

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

async function connectDB() {
    try {
        await client.connect();
        console.log('Connected to the database successfully!');
        return client.db('Comp2800BBY16');
      
    } catch (error) {
        console.error('Error connecting to the database:', error);
        await client.close();
        throw error;
    }
}

module.exports = { connectDB };
