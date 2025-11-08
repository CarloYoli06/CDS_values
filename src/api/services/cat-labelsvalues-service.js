
// FIC: COSMOS DB - Importar el cliente de Cosmos
import mongoose from 'mongoose';

import { BITACORA, DATA, AddMSG, OK, FAIL } from '../../middlewares/respPWA.handler.js';
import Etiqueta from '../models/mongodb/etiqueta.js';
import Valor from '../models/mongodb/valor.js';
// import { x } from "@sap/cds/lib/utils/tar-lib.js";


// ¡CAMBIO AQUÍ! Importamos el objeto 'database' directamente
import { cosmosDatabase } from '../../config/conectionToAzureCosmosDB.config.js';

const cosmosLabelsContainerId = "labels";
const cosmosValuesContainerId = "values";

let labelsContainer;
let valuesContainer;

// FIC: COSMOS DB - Función helper (usando la Solución 2)
async function getCosmosContainers() {
    
    if (!labelsContainer || !valuesContainer) {
        // Ahora esto funciona perfectamente, porque 'cosmosDatabase'
        // es el objeto de base de datos que sí tiene el método .container()
        labelsContainer = cosmosDatabase.container(cosmosLabelsContainerId);
        valuesContainer = cosmosDatabase.container(cosmosValuesContainerId);
    }
    
    return { labelsContainer, valuesContainer };
}

// ... el resto de tu código de servicio ...



/* EndPoint: localhost:8080/api/inv/crud?ProcessType='GETALL'&LoggedUser=FIBARRAC&DBServer=MongoDB/AzureCosmos  */
export async function crudLabelsValues(req) {
  
  let bitacora = BITACORA();
  let data = DATA();
  
  //let ProcessType = req.req.query?.ProcessType;
  let {ProcessType} = req.req.query;
  const {LoggedUser} = req.req.query;
  const {DBServer} = req.req.query;

  //FIC: get query params
  //let params = req.req.query;
  const body = req.req.body;
   const params = {
        //WithImagesURL : req.req.query?.WithImagesURL
        paramsQuery : req.req.query,
        paramString : req.req.query ? new URLSearchParams(req.req.query).toString().trim() : '',
        body : body
    };
  //FIC: get params of the service and convert in string
  //let paramString = req.req.query ? new URLSearchParams(req.req.query).toString().trim() : '';
  //FIC: get body 
  //const body = req.req.body;

  //FIC: start fill some properties of the bitacora
  bitacora.loggedUser = LoggedUser;
  bitacora.processType = ProcessType;
  bitacora.dbServer = DBServer;

  try {

    switch (DBServer) {
      case 'MongoDB':
        switch (ProcessType) {

          case 'GetAll':
                //FIC: Get One, Some or All Etiquetas y valores
                //------------------------------------------------------           
                bitacora = await getLabelsValues(bitacora, params)
                .then((bitacora) => {
                    if (!bitacora.success) {
                        bitacora.finalRes = true;
                        throw bitacora;
                    };
                    return bitacora;
                });
            break;
          
          case 'getEtiqueta':
                //FIC: Get One Etiqueta by ID
                //------------------------------------------------------
                bitacora = await getEtiqueta(bitacora, params)
                .then((bitacora) => {
                    if (!bitacora.success) {
                        bitacora.finalRes = true;
                        throw bitacora;
                    };
                    return bitacora;
                });
            break;

          case 'getJerarquia':
                //FIC: Get hierarchy tree by IDETIQUETA
                //------------------------------------------------------
                bitacora = await getJerarquiaPorEtiqueta(bitacora, params)
                .then((bitacora) => {
                    if (!bitacora.success) {
                        bitacora.finalRes = true;
                        throw bitacora;
                    };
                    return bitacora;
                });
            break;


          case 'getValor':
                //FIC: Get One Valor by ID
                //------------------------------------------------------
                bitacora = await getValor(bitacora, params)
                .then((bitacora) => {
                    if (!bitacora.success) {
                        bitacora.finalRes = true;
                        throw bitacora;
                    };
                    return bitacora;
                });
            break;
    
          case 'CRUD':
                //FIC: Add, update and delete etiquetas y Method
                //------------------------------------------------------           
                bitacora = await executeCrudOperations(bitacora, params, body)
                .then((bitacora) => {
                    if (!bitacora.success) {
                        bitacora.finalRes = true;
                        throw bitacora;
                    };
                    return bitacora;
                });
    
            break;
    
          default:
            const mongoError = new Error(`ProcessType '${ProcessType}' no válido para MongoDB`);
            mongoError.status = 400;
            throw mongoError;
        };
        break;
      case 'CosmosDB':
        // FIC: COSMOS DB - Inicio de la lógica de Cosmos
        switch (ProcessType) {
            case 'GetAll':
                //------------------------------------------------------
                bitacora = await getLabelsValues_Cosmos(bitacora, params)
                .then((bitacora) => {
                    if (!bitacora.success) {
                        bitacora.finalRes = true;
                        throw bitacora;
                    };
                    return bitacora;
                });
                break;
            case 'CRUD':
                //------------------------------------------------------
                bitacora = await executeCrudOperations_Cosmos(bitacora, params, body)
                .then((bitacora) => {
                    if (!bitacora.success) {
                        bitacora.finalRes = true;
                        throw bitacora;
                    };
                    return bitacora;
                });
                break;
            default:
                const cosmosError = new Error(`ProcessType '${ProcessType}' no válido para CosmosDB`);
                cosmosError.status = 400;
                throw cosmosError;
        }
        // FIC: COSMOS DB - Fin de la lógica de Cosmos
        break;
      default:
        const error = new Error(`DBServer must be MongoDB or CosmosDB`);
        error.status = 400;
        throw error;
    }


    //COMO LOGRARON CUANDO TODO ESTA OK Y ES UN POST RETORNAR NATIVaMENTE
    //EL ESTATUS DEL RESPONSE DEL METODO 201
    //FIC: Return response OK
    return OK(bitacora);


  } catch (errorBita) {
        // Si el error ya es una bitácora (lanzado desde FAIL), la usamos.
        // Si no, es un error no controlado y lo envolvemos en el formato de bitácora.
        const finalBitacora = errorBita.finalRes ? errorBita : (() => {
            data.status = errorBita.status || 500;
            data.messageDEV = errorBita.message || 'Error no controlado';
            data.messageUSR = `<<ERROR CATCH>> La operación en ${bitacora.dbServer} <<NO>> tuvo éxito.`;
            data.dataRes = errorBita;
            return AddMSG(bitacora, data, "FAIL");
        })();

        // Registramos los mensajes de la bitácora final.
        console.log(`<<Message USR>> ${finalBitacora.messageUSR}`);
        console.log(`<<Message DEV>> ${finalBitacora.messageDEV}`);

        // Enviamos la respuesta de fallo y notificamos al framework del error.
        // El framework espera un objeto con estas propiedades.
        throw { ...finalBitacora, innererror: finalBitacora };

    } finally {
      
    }

}



//********************************************************** */
//******************** MONGO DB METHODS ********************* */
//********************************************************** */

/**
 * Función auxiliar para construir un árbol anidado a partir de una lista plana.
 * Esta versión es eficiente (O(n)) usando un Map.
 */
const construirArbol = (raiz, descendientes) => {
    const mapa = new Map();
    
    // 1. Crear el nodo raíz anidado y agregarlo al mapa
    const nodoRaiz = { ...raiz, hijos: [] };
    mapa.set(nodoRaiz.IDVALOR, nodoRaiz);

    // 2. Mapear todos los descendientes para un acceso rápido
    for (const item of descendientes) {
        mapa.set(item.IDVALOR, { ...item, hijos: [] });
    }

    // 3. Anidar los nodos. Iteramos sobre los descendientes para encontrar su padre en el mapa.
    for (const item of descendientes) {
        if (item.IDVALORPA && mapa.has(item.IDVALORPA)) {
            const padre = mapa.get(item.IDVALORPA);
            const hijo = mapa.get(item.IDVALOR);
            if (padre && hijo) { // Doble chequeo de seguridad
                padre.hijos.push(hijo);
            }
        }
    }

    // Devolvemos solo el nodo raíz, que ahora contiene todo el árbol anidado
    return nodoRaiz;
}
// --- Helper Function para parsear y validar la operación ---
// La usaremos en ambas fases para no repetir código
const parseOperation = (op) => {
    const { collection, action,  payload} = op;
    let model;
    let idField;

    if (collection === 'labels') {
        model = Etiqueta;
        idField = 'IDETIQUETA';
    } else if (collection === 'values') {
        model = Valor;
        idField = 'IDVALOR';
    } else {
        throw new Error(`La colección '${collection}' no es válida.|INVALID_COLLECTION`);
    }

    return { collection, action, payload, model, idField };
};

// --- Helper Function para ejecutar la acción de DB ---
// Recibe la sesión que debe usar (de validación o la real)
const runOperation = async (opDetails, session) => {
    const { collection, action, payload, model, idField } = opDetails;
    
    if (action === 'CREATE') {
        // [MODIFICACIÓN 1: Validación de IDVALORPA en CREATE (ver punto 3)]
        if (collection === 'values' && payload.IDVALORPA) {
            // Un IDVALORPA es un IDVALOR, por lo que buscamos en el mismo modelo Valor
            const parentValue = await Valor.findOne({ IDVALOR: payload.IDVALORPA }).session(session);
            if (!parentValue) {
                throw new Error(`El IDVALORPA '${payload.IDVALORPA}' no existe en la colección de valores.|PARENT_NOT_FOUND|${payload.IDVALOR}`);
            }
        }

        // Validar que la etiqueta padre (IDETIQUETA) exista al crear un valor.
        if (collection === 'values' && payload.IDETIQUETA) {
            const parentLabel = await Etiqueta.findOne({ IDETIQUETA: payload.IDETIQUETA }).session(session);
            if (!parentLabel) {
                throw new Error(`La etiqueta padre con IDETIQUETA '${payload.IDETIQUETA}' no existe.|PARENT_LABEL_NOT_FOUND|${payload.IDVALOR}`);
            }
        }

        const newDoc = new model(payload);
        await newDoc.save({ session });
        return {
            status: 'SUCCESS',
            operation: 'CREATE',
            collection: collection,
            id: newDoc[idField],
        };
    } else if (action === 'UPDATE') {
        const { id, updates } = payload;

        // Si se intenta modificar el campo ID ('IDETIQUETA' o 'IDVALOR'), lanzar un error.
        if ((idField === 'IDETIQUETA' && updates.IDETIQUETA) || (idField === 'IDVALOR' && updates.IDVALOR)) {
            throw new Error(`La modificación del campo ID ('${idField}') no está permitida.|ID_MODIFICATION_NOT_ALLOWED|${id}`);
        }

        // Prevenir la modificación de la etiqueta padre de un valor.
        if (collection === 'values' && updates.IDETIQUETA) {
            throw new Error(`La modificación de la etiqueta padre ('IDETIQUETA') de un valor no está permitida.|PARENT_LABEL_MODIFICATION_NOT_ALLOWED|${id}`);
        }

        // --- INICIO DE LA VALIDACIÓN existente (para IDVALORPA en UPDATE) ---
        if (collection === 'values' && updates.IDVALORPA) {
            
            // 1. Evitar que un valor sea su propio padre
            if (id === updates.IDVALORPA) {
                throw new Error(`Un valor no puede ser su propio padre (IDVALORPA).|INVALID_OPERATION|${id}`);
            }
            // 2. Buscar si el valor padre existe en la base de datos
            const parentValue = await Valor.findOne({ IDVALOR: updates.IDVALORPA }).session(session);
            
            // 3. Si no existe, lanzar un error
            if (!parentValue) {
                throw new Error(`El IDVALORPA '${updates.IDVALORPA}' no existe en la colección de valores.|NOT_FOUND|${id}`);
            }
        }
        // --- FIN DE LA VALIDACIÓN existente ---
        
        if (Object.keys(updates).length === 0) {
             return {
                status: 'SUCCESS',
                operation: 'UPDATE',
                collection: collection,
                id: id,
                message: 'No updatable fields provided or only ID field was provided.'
            };
        }

        const updatedDoc = await model.findOneAndUpdate({ [idField]: id }, updates, { new: true, session });
        if (!updatedDoc) {
            throw new Error(`Documento con ${idField}=${id} no encontrado.|NOT_FOUND|${id}`);
        }
        return {
            status: 'SUCCESS',
            operation: 'UPDATE',
            collection: collection,
            id: id,
        };
    } else if (action === 'DELETE') {
        const { id } = payload;
        const deletedDoc = await model.findOneAndDelete({ [idField]: id }, { session });
        if (!deletedDoc) {
            throw new Error(`Documento con ${idField}=${id} no encontrado.|NOT_FOUND|${id}`);
        }
        return {
            status: 'SUCCESS',
            operation: 'DELETE',
            collection: collection,
            id: id,
        };
    } else {
        throw new Error(`La acción '${action}' no es válida.|INVALID_ACTION`);
    }
};

// --- Función Principal (MongoDB) ---
const executeCrudOperations = async (bitacora, params, body) => {
    let data = DATA();
    const validationResults = []; // Aquí guardaremos los resultados de la FASE 1
    let hasValidationErrors = false;
    let mainSession; // La sesión de la FASE 2

    try {
        data.api = '/CRUD';
        bitacora.process = "Crear, Actualizar y Eliminar etiquetas y valores [MongoDB]";
        data.process = `Crear, Actualizar y Eliminar <<etiqetas y valores>> de ${bitacora.dbServer}`;
        data.method = "POST";
        data.dataReq = body;

        const operations = body.operations;
        if (!operations || !Array.isArray(operations)) {
            data.messageDEV = "El body no contiene un array 'operations' válido.";
            data.messageUSR = "Datos de solicitud no válidos.";
            data.status = 400;
            throw new Error(data.messageDEV);
        }

        // --- FASE 1: VALIDACIÓN (DRY RUN) ---
        // Se crea UNA sesión de validación para todo el lote de operaciones.
        const validationSession = await mongoose.startSession();
        validationSession.startTransaction();

        for (const op of operations) {
            let opDetails; // Para el catch
            
            try {
                // 1. Parsear y validar la operación
                opDetails = parseOperation(op);
                
                // 2. Ejecutarla DENTRO de la única sesión de validación
                const successResult = await runOperation(opDetails, validationSession);
                validationResults.push(successResult);
            } catch (error) {
                // 3. Si falla, registrar el error
                hasValidationErrors = true;
                const { collection, action } = op;
                
                let errorCode = 'OPERATION_FAILED';
                let errorMsg = error.message;
                let payloadId = opDetails?.payload?.id || opDetails?.payload?.IDETIQUETA || opDetails?.payload?.IDVALOR || 'unknown';

                if (error.message.includes('|')) {
                    const parts = error.message.split('|');
                    errorMsg = parts[0];
                    errorCode = parts[1] || 'OPERATION_FAILED';
                    payloadId = parts[2] || payloadId;
                }

                if (error.code === 11000) {
                    errorCode = 'DUPLICATE_KEY';
                    const match = error.message.match(/dup key: { .*?: \"(.*?)\" }/);
                    const dupValue = match ? match[1] : payloadId;
                    errorMsg = `Ya existe un documento con el ID '${dupValue}'.`;
                    payloadId = dupValue;
                }
                
                validationResults.push({
                    status: 'ERROR',
                    operation: action,
                    collection: collection,
                    id: payloadId,
                    error: { code: errorCode, message: errorMsg },
                });
            }
        }
        // Al final del bucle, se aborta la transacción de validación completa.
        if (validationSession.inTransaction()) {
            await validationSession.abortTransaction();
            validationSession.endSession();
        } // --- Fin FASE 1 ---

        // --- REVISIÓN DE VALIDACIÓN ---
        data.dataRes = validationResults; // Ponemos los resultados en data, sea cual sea el caso
        
        if (hasValidationErrors) {
            data.messageUSR = 'Una o más operaciones fallaron. No se guardó ningún cambio.';
            data.messageDEV = 'Validation failed. No commit was attempted.';
            data.status = 400; // Bad Request
            bitacora = AddMSG(bitacora, data, 'FAIL');
            FAIL(bitacora);
            throw new Error(data.messageDEV);
        }

        // --- FASE 2: EJECUCIÓN REAL (SI NO HAY ERRORES) ---
        mainSession = await mongoose.startSession();
        mainSession.startTransaction();

        const commitPromises = operations.map(op => {
            const opDetails = parseOperation(op); // Parseamos de nuevo
            return runOperation(opDetails, mainSession); // Usamos la sesión principal
        });

        await Promise.all(commitPromises); 
        
        await mainSession.commitTransaction(); // ¡Éxito!
        
        data.messageUSR = 'Operaciones CRUD ejecutadas correctamente.';
        data.status = 200; // 200 OK
        bitacora = AddMSG(bitacora, data, 'OK', data.status, true);
        await mainSession.endSession();
        return OK(bitacora);

    } catch (error) {
        // --- CATCH PRINCIPAL ---
        if (mainSession) { // Si el error ocurrió durante la FASE 2
            await mainSession.abortTransaction();
            await mainSession.endSession();
        }

        data.status = data.status || 500;
        data.messageDEV = data.messageDEV || error.message;
        data.messageUSR = data.messageUSR || "Error inesperado al procesar las operaciones.";
        data.dataRes = data.dataRes || validationResults; // Devolver lo que se haya procesado
        
        bitacora = AddMSG(bitacora, data, 'FAIL');
        
        console.log(`<<Message USR>> ${data.messageUSR}`);
        console.log(`<<Message DEV>> ${data.messageDEV}`);

        return FAIL(bitacora); 
    }
};

const getLabelsValues = async (bitacora, params) => {
    let data = DATA();
    try {
        bitacora.process = "Extraer etiquetas y valores [MongoDB]";
        data.process = `Extraer etiquetas y valores <<etiqetas y valores>> de ${bitacora.dbServer}`;
        data.method = "GET";
        data.api = "/GETALL";
        const labelsWithValues = await Etiqueta.aggregate([
            {
                $lookup: {
                    from: 'Valor', // The name of the values collection
                    localField: 'IDETIQUETA',
                    foreignField: 'IDETIQUETA',
                    as: 'valores'
                }
            }
        ]).then((etiqueta) => {
                    if (!etiqueta) {
                      data.process = 'Obtener todo el historial de etiquwta valor.';
                      data.status = 404;
                      data.messageUSR = '<<AVISO> No hay datos de etiquetas y valores.';
                      data.messageDEV = '<<AVISO>> El metodo aggregate() no  relaciono elementos de la coleccion <<Etiquetas>> y <<Valores>>';
                      throw Error(data.messageDEV);
                    };
                    return etiqueta;
                  })
        //FIC: Response settings on success
        data.messageUSR = "<<OK>> La extracción de los ETIQUETAS Y VALORES <<SI>> tuvo éxito.";
        data.dataRes = labelsWithValues;
        bitacora = AddMSG(bitacora, data, "OK", 200, true);
        return OK(bitacora);

    } catch (error) {
        data.status = data.status || error?.code ? error.code : 500;
        data.messageDEV = data.messageDEV || error.message;
        data.messageUSR = data.messageUSR || "<<ERROR>> La extracción de las etiquetas y valores <<NO>> tuvo éxito.";
        data.dataRes = data.dataRes || error;
        bitacora = AddMSG(bitacora, data, "FAIL");
        console.log(`<<Message USR>> ${data.messageUSR}`);
        console.log(`<<Message DEV>> ${data.messageDEV}`);
    return FAIL(bitacora);
    }
};

const getEtiqueta = async (bitacora, params) => {
    let data = DATA();
    try {
        const { IDETIQUETA } = params.paramsQuery;

        if (!IDETIQUETA) {
            data.status = 400;
            data.messageUSR = '<<AVISO>> El parámetro IDETIQUETA es requerido.';
            data.messageDEV = '<<AVISO>> El parámetro IDETIQUETA no fue proporcionado en la consulta.';
            throw new Error(data.messageDEV);
        }

        bitacora.process = "Extraer una etiqueta por ID [MongoDB]";
        data.process = `Extraer una etiqueta por ID de ${bitacora.dbServer}`;
        data.method = "GET";
        data.api = "/getEtiqueta";

        const etiqueta = await Etiqueta.findOne({ IDETIQUETA: IDETIQUETA }).lean();

        if (!etiqueta) {
            data.status = 404;
            data.messageUSR = `<<AVISO>> No se encontró la etiqueta con ID: ${IDETIQUETA}.`;
            data.messageDEV = `<<AVISO>> El método findOne() no encontró resultados para la etiqueta con ID: ${IDETIQUETA}.`;
            throw new Error(data.messageDEV);
        }

        data.messageUSR = "<<OK>> La extracción de la etiqueta <<SI>> tuvo éxito.";
        data.dataRes = etiqueta;
        bitacora = AddMSG(bitacora, data, "OK", 200, true);
        return OK(bitacora);

    } catch (error) {
        data.status = data.status || 500;
        data.messageDEV = data.messageDEV || error.message;
        data.messageUSR = data.messageUSR || "<<ERROR>> La extracción de la etiqueta <<NO>> tuvo éxito.";
        data.dataRes = data.dataRes || error;
        bitacora = AddMSG(bitacora, data, "FAIL");
        console.log(`<<Message USR>> ${data.messageUSR}`);
        console.log(`<<Message DEV>> ${data.messageDEV}`);
        return FAIL(bitacora);
    }
};

const getJerarquiaPorEtiqueta = async (bitacora, params) => {
    let data = DATA();
    try {
        const { IDETIQUETA } = params.paramsQuery;

        if (!IDETIQUETA) {
            data.status = 400;
            data.messageUSR = '<<AVISO>> El parámetro IDETIQUETA es requerido.';
            data.messageDEV = '<<AVISO>> El parámetro IDETIQUETA no fue proporcionado en la consulta.';
            throw new Error(data.messageDEV);
        }

        bitacora.process = "Extraer jerarquía de valores por etiqueta [MongoDB]";
        data.process = `Extraer jerarquía de valores por IDETIQUETA de ${bitacora.dbServer}`;
        data.method = "GET";
        data.api = "/getJerarquia";

        // 1. Definir el Pipeline de Agregación
        const pipeline = [
            {
                // Paso 1: Encontrar todos los documentos "raíz" que coincidan con la etiqueta.
                // Un documento raíz es aquel que no tiene un padre (IDVALORPA es null).
                $match: {
                    IDETIQUETA: IDETIQUETA,
                    IDVALORPA: null 
                }
            },
            {
                // Paso 2: Para CADA raíz encontrada, buscar a TODOS sus descendientes.
                $graphLookup: {
                    from: 'Valor',                 // El nombre real de tu colección de valores
                    startWith: '$IDVALOR',         // Empezar con el IDVALOR del documento raíz
                    connectFromField: 'IDVALOR',   // El campo del padre (el que se conecta "desde")
                    connectToField: 'IDVALORPA',   // El campo del hijo (el que se conecta "hacia")
                    as: 'descendientes',           // Guardar todos los descendientes en un array
                    depthField: 'profundidad'      // Opcional: añade un campo de profundidad
                }
            }
        ];

        // 2. Ejecutar la agregación
        const raicesConDescendientes = await Valor.aggregate(pipeline);

        if (!raicesConDescendientes || raicesConDescendientes.length === 0) {
            data.status = 404;
            data.messageUSR = `<<AVISO>> No se encontraron elementos raíz con la etiqueta: ${IDETIQUETA}.`;
            data.messageDEV = `<<AVISO>> La agregación no encontró documentos raíz para la etiqueta: ${IDETIQUETA}.`;
            throw new Error(data.messageDEV);
        }

        // 3. Procesar los resultados para anidarlos
        const arbolesCompletos = raicesConDescendientes.map(raiz => {
            const descendientes = raiz.descendientes;
            delete raiz.descendientes; // Limpiar el objeto raíz para no duplicar datos
            delete raiz.profundidad;   // Limpiar el objeto raíz

            // Usamos la función auxiliar para construir el árbol
            return construirArbol(raiz, descendientes);
        });

        data.messageUSR = "<<OK>> La extracción de la jerarquía <<SI>> tuvo éxito.";
        data.dataRes = arbolesCompletos;
        bitacora = AddMSG(bitacora, data, "OK", 200, true);
        return OK(bitacora);

    } catch (error) {
        data.status = data.status || 500;
        data.messageDEV = data.messageDEV || error.message;
        data.messageUSR = data.messageUSR || "<<ERROR>> La extracción de la jerarquía <<NO>> tuvo éxito.";
        data.dataRes = data.dataRes || error;
        bitacora = AddMSG(bitacora, data, "FAIL");
        console.log(`<<Message USR>> ${data.messageUSR}`);
        console.log(`<<Message DEV>> ${data.messageDEV}`);
        return FAIL(bitacora);
    }
};

const getValor = async (bitacora, params) => {
    let data = DATA();
    try {
        const { IDVALOR } = params.paramsQuery;

        if (!IDVALOR) {
            data.status = 400;
            data.messageUSR = '<<AVISO>> El parámetro IDVALOR es requerido.';
            data.messageDEV = '<<AVISO>> El parámetro IDVALOR no fue proporcionado en la consulta.';
            throw new Error(data.messageDEV);
        }

        bitacora.process = "Extraer un valor por ID [MongoDB]";
        data.process = `Extraer un valor por ID de ${bitacora.dbServer}`;
        data.method = "GET";
        data.api = "/getValor";

        const valor = await Valor.findOne({ IDVALOR: IDVALOR }).lean();

        if (!valor) {
            data.status = 404;
            data.messageUSR = `<<AVISO>> No se encontró el valor con ID: ${IDVALOR}.`;
            data.messageDEV = `<<AVISO>> El método findOne() no encontró resultados para el valor con ID: ${IDVALOR}.`;
            throw new Error(data.messageDEV);
        }

        data.messageUSR = "<<OK>> La extracción del valor <<SI>> tuvo éxito.";
        data.dataRes = valor;
        bitacora = AddMSG(bitacora, data, "OK", 200, true);
        return OK(bitacora);

    } catch (error) {
        data.status = data.status || 500;
        data.messageDEV = data.messageDEV || error.message;
        data.messageUSR = data.messageUSR || "<<ERROR>> La extracción del valor <<NO>> tuvo éxito.";
        data.dataRes = data.dataRes || error;
        bitacora = AddMSG(bitacora, data, "FAIL");
        console.log(`<<Message USR>> ${data.messageUSR}`);
        console.log(`<<Message DEV>> ${data.messageDEV}`);
        return FAIL(bitacora);
    }
};

//********************************************************** */
//******************* COSMOS DB METHODS ******************* */
//********************************************************** */

// FIC: COSMOS DB - Helper para parsear la operación
const parseOperation_Cosmos = (op, containers) => {
    const { collection, action, payload } = op;
    const { labelsContainer, valuesContainer } = containers;
    let container;
    let idField; // El nombre del campo ID
    let idValue; // El valor del ID para la operación

    if (collection === 'labels') {
        container = labelsContainer;
        idField = 'IDETIQUETA';
        idValue = action === 'CREATE' ? payload.IDETIQUETA : payload.id;
    } else if (collection === 'values') {
        container = valuesContainer;
        idField = 'IDVALOR';
        idValue = action === 'CREATE' ? payload.IDVALOR : payload.id;
    } else {
        throw new Error(`La colección '${collection}' no es válida.|INVALID_COLLECTION`);
    }

    if (!idValue) {
        throw new Error(`No se proporcionó un ID ('${idField}' en payload o 'id' en payload) para la operación ${action}.|MISSING_ID`);
    }

    // Importante: Cosmos DB usa 'id' como el ID de documento único.
    // Asumimos que TUS IDs (IDETIQUETA, IDVALOR) son los 'id' de Cosmos.
    // Si no es así, esta lógica debe cambiar.
    return { collection, action, payload, container, idField, idValue, containers };
};

// FIC: COSMOS DB - Helper para la FASE 1 (Validación)
const validateOperation_Cosmos = async (opDetails) => {
    const { collection, action, payload, container, idField, idValue, containers } = opDetails;
    const { valuesContainer } = containers;

    try {
        if (action === 'CREATE') {
            // 1. Validar duplicados: Intentar leer el ID. Si *no* da 404, ya existe.
            try {
                let data = await container.item(idValue, idValue).read(); // Asumimos idValue como clave de partición
                console.log(data);
                if (data.statusCode !== 404) {
                    throw new Error( `Ya existe un documento con el ID '${idValue}'.|DUPLICATE_KEY|${idValue}`);
                }
                
            } catch (error) {
                if (error.code !== 404) {
                    throw error; // Lanzar el error si no es " Encontrado"
                }
                // Si es 404, está bien, el ID está disponible.
            }

            // 2. Validar IDVALORPA (lógica de Mongoose)
            if (collection === 'values' && payload.IDVALORPA) {
                try {
                    await valuesContainer.item(payload.IDVALORPA, payload.IDVALORPA).read(); // Asumimos ID como partición
                } catch (error) {
                    if (error.code === 404) {
                        throw new Error(`El IDVALORPA '${payload.IDVALORPA}' no existe en la colección de valores.|PARENT_NOT_FOUND|${idValue}`);
                    }
                    throw error; // Otro error de lectura
                }
            }
        } else if (action === 'UPDATE') {
            // 1. Validar que el documento exista
            let existingDoc;
            try {
                const { resource } = await container.item(idValue, idValue).read();
                existingDoc = resource;
            } catch (error) {
                if (error.code === 404) {
                    throw new Error(`Documento con ${idField}=${idValue} no encontrado.|NOT_FOUND|${idValue}`);
                }
                throw error;
            }

            // 2. Validar IDVALORPA (lógica de Mongoose)
            const { updates } = payload;
            if (collection === 'values' && updates.IDVALORPA) {
                if (idValue === updates.IDVALORPA) {
                    throw new Error(`Un valor no puede ser su propio padre (IDVALORPA).|INVALID_OPERATION|${idValue}`);
                }
                try {
                    await valuesContainer.item(updates.IDVALORPA, updates.IDVALORPA).read();
                } catch (error) {
                    if (error.code === 404) {
                        throw new Error(`El IDVALORPA '${updates.IDVALORPA}' no existe en la colección de valores.|NOT_FOUND|${idValue}`);
                    }
                    throw error;
                }
            }
             // Retornar el documento existente para la Fase 2 (optimización)
            return existingDoc;

        } else if (action === 'DELETE') {
            // 1. Validar que el documento exista
            try {
                await container.item(idValue, idValue).read();
            } catch (error) {
                if (error.code === 404) {
                    throw new Error(`Documento con ${idField}=${idValue} no encontrado.|NOT_FOUND|${idValue}`);
                }
                throw error;
            }
        } else {
            throw new Error(`La acción '${action}' no es válida.|INVALID_ACTION`);
        }
    } catch (error) {
        // Re-lanzar el error para que la función principal lo atrape
        throw error;
    }
};

// FIC: COSMOS DB - Helper para la FASE 2 (Ejecución)
const runOperation_Cosmos = async (opDetails, existingDoc) => {
    const { collection, action, payload, container, idField, idValue } = opDetails;

    // Asignar el 'id' de Cosmos DB. Asumimos que es el mismo que tu ID.
    // Esto es crucial. Si 'id' es diferente de 'IDETIQUETA', esto falla.
    const itemPayload = { ...payload };
    if (action === 'CREATE') {
        itemPayload.id = idValue;
    }
    
    if (action === 'CREATE') {
        await container.items.create(itemPayload);
        return {
            status: 'SUCCESS',
            operation: 'CREATE',
            collection: collection,
            id: idValue,
        };
    } else if (action === 'UPDATE') {
        const { id, updates } = payload;

        // Prevenir la modificación del ID primario (lógica de Mongoose)
        if (idField === 'IDETIQUETA' && updates.IDETIQUETA) {
            delete updates.IDETIQUETA;
        } else if (idField === 'IDVALOR' && updates.IDVALOR) {
            delete updates.IDVALOR;
        }
        
        if (Object.keys(updates).length === 0) {
             return {
                status: 'SUCCESS',
                operation: 'UPDATE',
                collection: collection,
                id: id,
                message: 'No updatable fields provided or only ID field was provided.'
            };
        }
        
        // Obtenemos el documento (ya lo leímos en la validación)
        // const { resource: existingDoc } = await container.item(idValue, idValue).read();
        // NOTA: Pasamos el 'existingDoc' de la Fase 1 para evitar una re-lectura.

        // Combinar los cambios (similar a findOneAndUpdate)
        const updatedDoc = { ...existingDoc, ...updates };

        // Reemplazar el documento
        await container.item(idValue, idValue).replace(updatedDoc);
        
        return {
            status: 'SUCCESS',
            operation: 'UPDATE',
            collection: collection,
            id: id,
        };
    } else if (action === 'DELETE') {
        const { id } = payload;
        await container.item(id, id).delete(); // Asumimos id como clave de partición
        return {
            status: 'SUCCESS',
            operation: 'DELETE',
            collection: collection,
            id: id,
        };
    }
};


// --- Función Principal (CosmosDB) ---
const executeCrudOperations_Cosmos = async (bitacora, params, body) => {
    let data = DATA();
    const validationResults = [];
    let hasValidationErrors = false;
    
    // FIC: COSMOS DB - NOTA IMPORTANTE SOBRE TRANSACCIONES
    // A diferencia de Mongoose, Cosmos DB NO puede ejecutar una transacción
    // atómica que abarque múltiples colecciones (contenedores).
    // Esta implementación REPLICA la estructura de dos fases (Validar, Ejecutar)
    // pero la FASE 2 (Ejecución) NO ES ATÓMICA. Si una operación en la
    // Fase 2 falla, las anteriores ya se habrán confirmado.

    try {
        data.api = '/CRUD';
        bitacora.process = "Crear, Actualizar y Eliminar etiquetas y valores [CosmosDB]";
        data.process = `Crear, Actualizar y Eliminar <<etiqetas y valores>> de ${bitacora.dbServer}`;
        data.method = "POST";
        data.dataReq = body;

        const operations = body.operations;
        if (!operations || !Array.isArray(operations)) {
            data.messageDEV = "El body no contiene un array 'operations' válido.";
            data.messageUSR = "Datos de solicitud no válidos.";
            data.status = 400;
            throw new Error(data.messageDEV);
        }

        const containers = await getCosmosContainers();
        const preReadDocs = new Map(); // Para guardar los docs leídos en la Fase 1

        // --- FASE 1: VALIDACIÓN (Simulando el Dry-Run) ---
        // Hacemos todas las lecturas de validación en paralelo
        const validationPromises = operations.map(async (op) => {
            let opDetails;
            try {
                // 1. Parsear la operación
                opDetails = parseOperation_Cosmos(op, containers);

                // 2. Validar (hace lecturas de pre-verificación)
                const existingDoc = await validateOperation_Cosmos(opDetails);
                
                // Si es un UPDATE, guardamos el doc para la Fase 2
                if (opDetails.action === 'UPDATE' && existingDoc) {
                    preReadDocs.set(opDetails.idValue, existingDoc);
                }

                return {
                    status: 'SUCCESS',
                    operation: op.action,
                    collection: op.collection,
                    id: opDetails.idValue,
                };

            } catch (error) {
                // 3. Si falla, registrar el error
                hasValidationErrors = true;
                const { collection, action } = op;
                
                let errorCode = 'OPERATION_FAILED';
                let errorMsg = error.message;
                let payloadId = opDetails?.idValue || 'unknown';

                if (error.message.includes('|')) {
                    const parts = error.message.split('|');
                    errorMsg = parts[0];
                    errorCode = parts[1] || 'OPERATION_FAILED';
                    payloadId = parts[2] || payloadId;
                }
                
                if (error.code === 409) { // 409 Conflict es el "Duplicate Key" de Cosmos
                    errorCode = 'DUPLICATE_KEY';
                    errorMsg = `Ya existe un documento con el ID '${payloadId}'.`;
                }

                return {
                    status: 'ERROR',
                    operation: action,
                    collection: collection,
                    id: payloadId,
                    error: { code: errorCode, message: errorMsg },
                };
            }
        });

        const allValidationResults = await Promise.all(validationPromises);
        validationResults.push(...allValidationResults);
        // --- Fin FASE 1 ---

        // --- REVISIÓN DE VALIDACIÓN ---
        data.dataRes = validationResults;
        
        if (hasValidationErrors) {
            data.messageUSR = 'Una o más operaciones fallaron. No se guardó ningún cambio.';
            data.messageDEV = 'Validation failed. No commit was attempted.';
            data.status = 400; // Bad Request
            bitacora = AddMSG(bitacora, data, 'FAIL');
            FAIL(bitacora);
            throw new Error(data.messageDEV);
        }

        // --- FASE 2: EJECUCIÓN REAL (NO ATÓMICA) ---
        // Si llegamos aquí, todas las validaciones fueron 'SUCCESS'
        
        const commitPromises = operations.map(op => {
            const opDetails = parseOperation_Cosmos(op, containers);
            // Recuperar el doc pre-leído si es un UPDATE
            const existingDoc = preReadDocs.get(opDetails.idValue);
            return runOperation_Cosmos(opDetails, existingDoc);
        });

        await Promise.all(commitPromises); // Si alguna falla aquí, se va al CATCH
        
        data.messageUSR = 'Operaciones CRUD ejecutadas correctamente.';
        data.status = 200; // 200 OK
        bitacora = AddMSG(bitacora, data, 'OK', data.status, true);
        return OK(bitacora);

    } catch (error) {
        // --- CATCH PRINCIPAL ---
        // Captura errores de FASE 0 (ej. 'operations' no es array)
        // o errores de FASE 2 (ej. un race condition)
        
        data.status = data.status || 500;
        data.messageDEV = data.messageDEV || error.message;
        data.messageUSR = data.messageUSR || "Error inesperado al procesar las operaciones.";
        data.dataRes = data.dataRes || validationResults;
        
        bitacora = AddMSG(bitacora, data, 'FAIL');
        
        console.log(`<<Message USR>> ${data.messageUSR}`);
        console.log(`<<Message DEV>> ${data.messageDEV}`);

        return FAIL(bitacora); 
    }
};


// FIC: COSMOS DB - Función GetAll
const getLabelsValues_Cosmos = async (bitacora, params) => {
    let data = DATA();
    try {
        bitacora.process = "Extraer etiquetas y valores [CosmosDB]";
        data.process = `Extraer etiquetas y valores <<etiqetas y valores>> de ${bitacora.dbServer}`;
        data.method = "GET";
        data.api = "/GETALL";

        const { labelsContainer, valuesContainer } = await getCosmosContainers();

        // 1. Obtener todas las etiquetas
        const { resources: labels } = await labelsContainer.items.readAll().fetchAll();
        
        // 2. Obtener todos los valores
        const { resources: allValues } = await valuesContainer.items.readAll().fetchAll();

        // 3. Simular el $lookup en memoria
        // Crear un mapa para agrupar valores por IDETIQUETA
        const valuesMap = new Map();
        for (const value of allValues) {
            const key = value.IDETIQUETA;
            if (!valuesMap.has(key)) {
                valuesMap.set(key, []);
            }
            valuesMap.get(key).push(value);
        }

        // 4. Combinar los resultados
        const labelsWithValues = labels.map(label => {
            const key = label.IDETIQUETA;
            return {
                ...label,
                valores: valuesMap.get(key) || [] // Asignar los valores o un array vacío
            };
        });

        if (labelsWithValues.length === 0) {
            data.process = 'Obtener todo el historial de etiqueta valor.';
            data.status = 404;
            data.messageUSR = '<<AVISO> No hay datos de etiquetas y valores.';
            data.messageDEV = '<<AVISO>> No se encontraron elementos en el contenedor <<Labels>>.';
            throw Error(data.messageDEV);
        }
        
        //FIC: Response settings on success
        data.messageUSR = "<<OK>> La extracción de los ETIQUETAS Y VALORES <<SI>> tuvo éxito.";
        data.dataRes = labelsWithValues;
        bitacora = AddMSG(bitacora, data, "OK", 200, true);
        return OK(bitacora);

    } catch (error) {
        data.status = data.status || error?.code ? error.code : 500;
        data.messageDEV = data.messageDEV || error.message;
        data.messageUSR = data.messageUSR || "<<ERROR>> La extracción de las etiquetas y valores <<NO>> tuvo éxito.";
        data.dataRes = data.dataRes || error;
        bitacora = AddMSG(bitacora, data, "FAIL");
        console.log(`<<Message USR>> ${data.messageUSR}`);
        console.log(`<<Message DEV>> ${data.messageDEV}`);
    return FAIL(bitacora);
    }
};

export default { crudLabelsValues };