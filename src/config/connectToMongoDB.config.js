
// src/config/connectToMongoDB.config.js
import mongoose from 'mongoose';
import configX from './dotenvXConfig.js';

(async () => { 
    try { 
        const db = await mongoose.connect(configX.CONNECTION_STRING, { 
            dbName: configX.DATABASE 
        }); 
        console.log('Database is connected to: ', db.connection.name); 
    } catch (error) { 
        console.log('Error: ', error); 
    } 
})();

export default mongoose;