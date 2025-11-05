//Para conectarnos a la base de datos de Azure Cosmos DB
import { CosmosClient } from '@azure/cosmos';
import configX from './dotenvXConfig.js';

// Crear una instancia del cliente Cosmos DB
const client = new CosmosClient({
    endpoint: configX.COSMOSDB_ENDPOINT,
    key: configX.COSMOSDB_KEY
});

// Conectar a la base de datos de Cosmos DB
const database = client.database(configX.COSMOSDB_DATABASE);

// Asegúrate de que la base de datos esté conectada
client
    .getDatabaseAccount()
    .then(response => {
        console.log('Database connected to Cosmos DB: ', database.id);
    })
    .catch(error => {
        console.log('Error connecting to Cosmos DB: ', error);
    });

// ¡CAMBIO AQUÍ! Exporta el objeto 'database' directamente.
// Ya no es una función, sino el objeto en sí.
export const cosmosDatabase = database; 

// Opcional: puedes mantener tu función original si la usas en otro lado
export const getContainer = (containerName) => database.container(containerName);