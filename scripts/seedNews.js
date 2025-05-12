const mongoose = require('mongoose');
const { connectDB } = require('./scripts/db.js');  // Assuming this function connects to DB
const News = require('./models/news.model');  // Adjust path if needed

(async () => {
    try {
        // Connect to MongoDB
        const { db, client } = await connectDB();

        // Define hardcoded news data
        const newsData = [
            {
                user_id: mongoose.Types.ObjectId(), // Example user ID
                title: 'Local Park Gets a Makeover',
                body: 'The community park has been renovated with new playground equipment, benches, and a walking track.',
                neighborhood: 'Downtown',
                image_url: '/uploads/park-makeover.jpg',
                created_at: new Date()
            },
            {
                user_id: mongoose.Types.ObjectId(), // Example user ID
                title: 'New Cafe Opens in the City Center',
                body: 'A new coffee shop has opened its doors, offering a variety of artisanal brews and baked goods.',
                neighborhood: 'City Center',
                image_url: '/uploads/cafe-opening.jpg',
                created_at: new Date()
            },
            {
                user_id: mongoose.Types.ObjectId(), // Example user ID
                title: 'Neighborhood Clean-Up Event This Weekend',
                body: 'Join us this Saturday for a neighborhood clean-up event. Volunteers will gather at the park at 9 AM.',
                neighborhood: 'Uptown',
                image_url: '/uploads/cleanup-event.jpg',
                created_at: new Date()
            }
        ];

        // Insert the hardcoded data into the News collection
        await News.insertMany(newsData);

        console.log('News data inserted successfully!');

        // Close DB connection
        client.close();
    } catch (error) {
        console.error('Error inserting news data:', error);
    }
})();