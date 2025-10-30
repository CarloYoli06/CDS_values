
import mongoose from 'mongoose';
import { BITACORA, DATA, AddMSG, OK, FAIL } from '../../middlewares/respPWA.handler.js';
import Etiqueta from '../models/mongodb/etiqueta.js';
import Valor from '../models/mongodb/valor.js';
// import { x } from "@sap/cds/lib/utils/tar-lib.js";
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
                    //let countData = bitacora.countData - 1;
                    //newInventorieItem = bitacora.data[countData].dataRes;
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
                    //let countData = bitacora.countData - 1;
                    //newInventorieItem = bitacora.data[countData].dataRes;
                    return bitacora;
                });
    
            break;
    
          default:
            break;
        };
        break;
      case 'CosmosDB':
        console.log('CosmosDB');
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
        //FIC: Unhandled error response configuration 
        if(!errorBita?.finalRes) {
            data.status = data.status || 500;
            data.messageDEV = data.messageDEV || errorBita.message;
            data.messageUSR = data.messageUSR || `<<ERROR CATCH>> La extracción de la información de ${bitacora.dbServer} <<NO>> tuvo exito`;
            data.dataRes = data.dataRes || errorBita;
            errorBita = AddMSG(bitacora, data, "FAIL");
        };
        console.log(`<<Message USR>> ${errorBita.messageUSR}`);
        console.log(`<<Message DEV>> ${errorBita.messageDEV}`);

        FAIL(errorBita);
        //FIC: Manejo de errores adicionales si es necesario
        req.error({
            code: 'Internal-Server-Error',
            status: errorBita.status,
            message: errorBita.messageUSR,
            target: errorBita.messageDEV,
            numericSeverity: 1,
            //longtext_url: 'https://example.com/error-details',
            innererror: errorBita
        });
    
        return

    } finally {
      
    }

}



//********************  LOCAL METHODS ********************** */
//********************************************************** */
// --- Helper Function para parsear y validar la operación ---
// La usaremos en ambas fases para no repetir código
const parseOperation = (op) => {
    const { collection, action,  payload} = op;
    let model;
    let idField;

    // try {
    //     payload = JSON.parse(op.payload);
    // } catch (e) {
    //     throw new Error(`El payload no es un JSON válido.|INVALID_PAYLOAD|${op.payload}`);
    // }

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

        // [MODIFICACIÓN 2: Prevenir la modificación del ID primario (Punto 2)]
        // Eliminar el campo clave (IDETIQUETA o IDVALOR) del objeto de actualizaciones.
        if (idField === 'IDETIQUETA' && updates.IDETIQUETA) {
            delete updates.IDETIQUETA;
        } else if (idField === 'IDVALOR' && updates.IDVALOR) {
            delete updates.IDVALOR;
        }
        // [FIN MODIFICACIÓN 2]

        // --- INICIO DE LA VALIDACIÓN existente (para IDVALORPA en UPDATE) ---
        // Validar que IDVALORPA exista si se está actualizando un 'valor'
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
        
        // Comprobar si realmente hay actualizaciones restantes (después de eliminar el ID)
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

// --- Función Principal ---
const executeCrudOperations = async (bitacora, params, body) => {
    let data = DATA();
    const validationResults = []; // Aquí guardaremos los resultados de la FASE 1
    let hasValidationErrors = false;
    let mainSession; // La sesión de la FASE 2

    try {
        data.api = '/CRUD';
        bitacora.process = "Crear, Actualizar y Eliminar etiquetas y valores";
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
        for (const op of operations) {
            const validationSession = await mongoose.startSession();
            validationSession.startTransaction();
            
            let opDetails; // Para el catch
            
            try {
                // 1. Parsear y validar la operación
                opDetails = parseOperation(op);
                
                // 2. Ejecutarla en la sesión de validación
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
            } finally {
                // 4. SIEMPRE abortar la sesión de validación
                await validationSession.abortTransaction();
                validationSession.endSession();
            }
        } // --- Fin FASE 1 ---

        // --- REVISIÓN DE VALIDACIÓN ---
        data.dataRes = validationResults; // Ponemos los resultados en data, sea cual sea el caso
        
        if (hasValidationErrors) {
            // Si hubo errores, devolvemos el reporte 400. NADA se guardó.
            data.messageUSR = 'Una o más operaciones fallaron. No se guardó ningún cambio.';
            data.messageDEV = 'Validation failed. No commit was attempted.';
            data.status = 400; // Bad Request
            bitacora = AddMSG(bitacora, data, 'FAIL');
            FAIL(bitacora);
            throw Error(data.messageDEV);
            return 
        }

        // --- FASE 2: EJECUCIÓN REAL (SI NO HAY ERRORES) ---
        // Si llegamos aquí, todas las validaciones fueron 'SUCCESS'
        mainSession = await mongoose.startSession();
        mainSession.startTransaction();

        // Ejecutamos todas las operaciones de nuevo, esta vez para el commit real
        // Usamos Promise.all para ejecutarlas en paralelo dentro de la transacción
        const commitPromises = operations.map(op => {
            const opDetails = parseOperation(op); // Parseamos de nuevo
            return runOperation(opDetails, mainSession); // Usamos la sesión principal
        });

        await Promise.all(commitPromises); // Si alguna falla aquí, se va al CATCH principal
        
        await mainSession.commitTransaction(); // ¡Éxito!
        
        data.messageUSR = 'Operaciones CRUD ejecutadas correctamente.';
        data.status = 200; // 200 OK
        bitacora = AddMSG(bitacora, data, 'OK', data.status, true);
        await mainSession.endSession();
        return OK(bitacora);

    } catch (error) {
        // --- CATCH PRINCIPAL ---
        // Captura errores de FASE 0 (ej. 'operations' no es array)
        // o errores de FASE 2 (ej. un race condition que pasó la validación)
        
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
    // No hay 'finally' aquí porque las sesiones se manejan dentro de los bloques
};

const getLabelsValues = async (bitacora, params) => {
    // let { body, paramsQuery, paramString } = options;
        //WithImagesURL = typeof WithImagesURL === 'string' ? WithImagesURL.toLowerCase() === 'true' : false;
    let data = DATA();
    // let params = [];
    try {
        bitacora.process = "Extraer etiquetas y valores";
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

                    //FIC: Todo OK
                    return etiqueta;
                    
                  })
        //FIC: Response settings on success
        data.messageUSR = "<<OK>> La extracción de los ETIQUETAS Y VALORES <<SI>> tuvo éxito."; // Esta ya era una cadena válida
        data.dataRes = labelsWithValues;
        bitacora = AddMSG(bitacora, data, "OK", 200, true);
        return OK(bitacora);

    } catch (error) {
        data.status = data.status || error?.code ? error.code : 500;
        data.messageDEV = data.messageDEV || error.message;
        data.messageUSR = data.messageUSR || "<<ERROR>> La extracción de las etiquetas y valores <<NO>> tuvo éxito.";
        data.dataRes = data.dataRes || error;
        bitacora = AddMSG(bitacora, data, "FAIL"); // No es necesario devolver el resultado de AddMSG a bitacora aquí
        console.log(`<<Message USR>> ${data.messageUSR}`);
        console.log(`<<Message DEV>> ${data.messageDEV}`);
    return FAIL(bitacora);
    }
};



export default { crudLabelsValues };
