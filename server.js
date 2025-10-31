import express from "express";
import cds from "@sap/cds";
import cors from "cors";
import mongoose from './src/config/connectToMongoDB.config.js';
import docEnvX from "./src/config/dotenvXConfig.js";

const router = express.Router();

export default async (o) => {
    try {
        let app = express();
        app.express = express;
        //MALR: 🖖🛑 limit json api response
        app.use(express.json({ limit: "500kb" }));
        app.use(cors());
        app.use(docEnvX.API_URL, router);
        o.app = app;
        o.app.httpServer = await cds.server(o);
        return o.app.httpServer;
    } catch (error) {
        console.error('Error strating server:', error);
        process.exit(1);
    }
};