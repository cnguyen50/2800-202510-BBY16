const express = require('express');
const {connectDB} = require('./db.cjs');

(async () => {
    try {
        const db = await connectDB();

        const app = express();

        app.get('/', (req, res) => {
            res.json({
              status: 'ok',
              database: db.databaseName,     
              time: new Date().toISOString(),
            });
        });

        const PORT = process.env.PORT || 3000;

        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    } catch (error) {
        console.error('Error starting the server:', error);
       // process.exit(1);
    }
})();


