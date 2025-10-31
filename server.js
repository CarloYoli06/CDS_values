// carloyoli06/cds_values/CDS_values-f79d2b1acb1d2fd91c17b3d9b02d9e181a1800aa/server.js
import express from "express";
import cds from "@sap/cds";
import cors from "cors";
import mongoose from './src/config/connectToMongoDB.config.js';
import docEnvX from "./src/config/dotenvXConfig.js";

// --- INICIO DE ADICIÓN PARA DIAGNÓSTICO ---
// Captura promesas no manejadas (causa común de 500) y las reporta.
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    // Forzar la salida para que Azure sepa que falló.
    process.exit(1); 
});
// --- FIN DE ADICIÓN PARA DIAGNÓSTICO ---

// El router no es necesario para montar servicios CAP correctamente.
// const router = express.Router(); 

export default async (o) => {
    try {
        let app = express();
        app.express = express;
        
        // MALR: 🖖🛑 limit json api response
        app.use(express.json({ limit: "500kb" }));
        app.use(cors());

        // Si `docEnvX.API_URL` existe, se usará como prefijo para la ruta CAP.
        // Se eliminó: // app.use(docEnvX.API_URL, router); 
        
        o.app = app;
        
        // Esta línea es la que realmente inicia el servidor CAP
        o.app.httpServer = await cds.server(o);
        
        console.log('CAP Server started successfully.');
        return o.app.httpServer;
    } catch (error) {
        // Imprimir el error y el stack trace completo para un diagnóstico.
        console.error('Error starting server (CAP):', error.stack || error);
        process.exit(1);
    }
};

// NOTA: La conexión a MongoDB se ejecuta inmediatamente cuando se importa.