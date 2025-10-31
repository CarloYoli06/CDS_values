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
        
        // MALR: 🖖🛑 limit json api response
        app.use(express.json({ limit: "500kb" }));
        app.use(cors());
        app.use(docEnvX.API_URL, router);
        
        o.app = app;
        o.app.httpServer = await cds.server(o);
        
        // IMPORTANTE: Usar el puerto que Azure proporciona o 8080 por defecto
        const PORT = process.env.PORT || 8080;
        const HOST = process.env.HOST || '0.0.0.0';
        
        // Iniciar el servidor explícitamente
        return new Promise((resolve, reject) => {
            const server = o.app.httpServer.listen(PORT, HOST, (err) => {
                if (err) {
                    console.error('Error al iniciar el servidor:', err);
                    reject(err);
                } else {
                    console.log(`✅ Servidor corriendo en http://${HOST}:${PORT}`);
                    console.log(`📊 Base de datos: ${docEnvX.DATABASE}`);
                    console.log(`🔗 API URL: ${docEnvX.API_URL}`);
                    resolve(server);
                }
            });
            
            // Manejo de errores del servidor
            server.on('error', (error) => {
                console.error('Error del servidor:', error);
                reject(error);
            });
        });
        
    } catch (error) {
        console.error('❌ Error al iniciar el servidor:', error);
        process.exit(1);
    }
};

// Si se ejecuta directamente (no como módulo)
if (import.meta.url === `file://${process.argv[1]}`) {
    const start = async () => {
        try {
            const serverModule = await import(import.meta.url);
            await serverModule.default({});
        } catch (error) {
            console.error('Error fatal:', error);
            process.exit(1);
        }
    };
    start();
}