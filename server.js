// carloyoli06/cds_values/CDS_values-f79d2b1acb1d2fd91c17b3d9b02d9e181a1800aa/server.js
import express from "express";
import cds from "@sap/cds";
import cors from "cors";
import mongoose from './src/config/connectToMongoDB.config.js';
import docEnvX from "./src/config/dotenvXConfig.js";

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
        // CAP automáticamente monta los servicios definidos en .cds.
        // Se elimina la línea `app.use(docEnvX.API_URL, router);`
        
        o.app = app;
        
        // Esta línea es la que realmente inicia el servidor CAP
        o.app.httpServer = await cds.server(o);
        
        return o.app.httpServer;
    } catch (error) {
        // Su aplicación imprimió esto cuando falló: Database is connected to: 'db_esecurity'
        // Es posible que el error 500 se lance AQUÍ si cds.server(o) encuentra un problema
        // después de que la conexión de Mongo (arriba) ya se haya completado.
        console.error('Error starting server (CAP):', error);
        process.exit(1);
    }
};

// NOTA: La conexión a MongoDB se ejecuta inmediatamente cuando se importa.
// Si fallara después, la aplicación ya se habría bloqueado.