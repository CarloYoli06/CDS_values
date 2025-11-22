// FIC: COSMOS DB - Importar el cliente de Cosmos
import mongoose from "mongoose";

import {
  BITACORA,
  DATA,
  AddMSG,
  OK,
  FAIL,
} from "../../middlewares/respPWA.handler.js";
import Etiqueta from "../models/mongodb/etiqueta.js";
import Valor from "../models/mongodb/valor.js";
// import { x } from "@sap/cds/lib/utils/tar-lib.js";

// ¡CAMBIO AQUÍ! Importamos el objeto 'database' directamente
import { cosmosDatabase } from "../../config/conectionToAzureCosmosDB.config.js";

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

    try {
      const lDef = await labelsContainer.read();
      console.log(
        "DEBUG: LABELS PK:",
        JSON.stringify(lDef.resource.partitionKey)
      );
      const vDef = await valuesContainer.read();
      console.log(
        "DEBUG: VALUES PK:",
        JSON.stringify(vDef.resource.partitionKey)
      );
    } catch (e) {
      console.log("DEBUG: Error reading container def", e.message);
    }
  }

  return { labelsContainer, valuesContainer };
}

// ... el resto de tu código de servicio ...

/* EndPoint: localhost:8080/api/inv/crud?ProcessType='GETALL'&LoggedUser=FIBARRAC&DBServer=MongoDB/AzureCosmos  */
export async function crudLabelsValues(req) {
  let bitacora = BITACORA();
  let data = DATA();

  //let ProcessType = req.req.query?.ProcessType;
  let { ProcessType } = req.req.query;
  const { LoggedUser } = req.req.query;
  const { DBServer } = req.req.query;

  //FIC: get query params
  //let params = req.req.query;
  const body = req.req.body;
  const params = {
    //WithImagesURL : req.req.query?.WithImagesURL
    paramsQuery: req.req.query,
    paramString: req.req.query
      ? new URLSearchParams(req.req.query).toString().trim()
      : "",
    body: body,
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
      case "MongoDB":
        switch (ProcessType) {
          case "GetAll":
            //FIC: Get One, Some or All Etiquetas y valores
            //------------------------------------------------------
            bitacora = await getLabelsValues(bitacora, params).then(
              (bitacora) => {
                if (!bitacora.success) {
                  bitacora.finalRes = true;
                  throw bitacora;
                }
                return bitacora;
              }
            );
            break;

          case "getEtiqueta":
            //FIC: Get One Etiqueta by ID
            //------------------------------------------------------
            bitacora = await getEtiqueta(bitacora, params).then((bitacora) => {
              if (!bitacora.success) {
                bitacora.finalRes = true;
                throw bitacora;
              }
              return bitacora;
            });
            break;

          case "getJerarquia":
            //FIC: Get hierarchy tree by IDETIQUETA
            //------------------------------------------------------
            bitacora = await getJerarquiaPorEtiqueta(bitacora, params).then(
              (bitacora) => {
                if (!bitacora.success) {
                  bitacora.finalRes = true;
                  throw bitacora;
                }
                return bitacora;
              }
            );
            break;

          case "getValor":
            //FIC: Get One Valor by ID
            //------------------------------------------------------
            bitacora = await getValor(bitacora, params).then((bitacora) => {
              if (!bitacora.success) {
                bitacora.finalRes = true;
                throw bitacora;
              }
              return bitacora;
            });
            break;

          case "CRUD":
            //FIC: Add, update and delete etiquetas y Method
            //------------------------------------------------------
            bitacora = await executeCrudOperations(bitacora, params, body).then(
              (bitacora) => {
                if (!bitacora.success) {
                  bitacora.finalRes = true;
                  throw bitacora;
                }
                return bitacora;
              }
            );

            break;

          default:
            const mongoError = new Error(
              `ProcessType '${ProcessType}' no válido para MongoDB`
            );
            mongoError.status = 400;
            throw mongoError;
        }
        break;
      case "CosmosDB":
        // FIC: COSMOS DB - Inicio de la lógica de Cosmos
        switch (ProcessType) {
          case "GetAll":
            //------------------------------------------------------
            bitacora = await getLabelsValues_Cosmos(bitacora, params).then(
              (bitacora) => {
                if (!bitacora.success) {
                  bitacora.finalRes = true;
                  throw bitacora;
                }
                return bitacora;
              }
            );
            break;
          case "getEtiqueta":
            bitacora = await getEtiqueta_Cosmos(bitacora, params).then(
              (bitacora) => {
                if (!bitacora.success) {
                  bitacora.finalRes = true;
                  throw bitacora;
                }
                return bitacora;
              }
            );
            break;
          case "getJerarquia":
            bitacora = await getJerarquiaPorEtiqueta_Cosmos(
              bitacora,
              params
            ).then((bitacora) => {
              if (!bitacora.success) {
                bitacora.finalRes = true;
                throw bitacora;
              }
              return bitacora;
            });
            break;
          case "getValor":
            bitacora = await getValor_Cosmos(bitacora, params).then(
              (bitacora) => {
                if (!bitacora.success) {
                  bitacora.finalRes = true;
                  throw bitacora;
                }
                return bitacora;
              }
            );
            break;
          case "CRUD":
            //------------------------------------------------------
            bitacora = await executeCrudOperations_Cosmos(
              bitacora,
              params,
              body
            ).then((bitacora) => {
              if (!bitacora.success) {
                bitacora.finalRes = true;
                throw bitacora;
              }
              return bitacora;
            });
            break;
          default:
            const cosmosError = new Error(
              `ProcessType '${ProcessType}' no válido para CosmosDB`
            );
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
    const finalBitacora = errorBita.finalRes
      ? errorBita
      : (() => {
        data.status = errorBita.status || 500;
        data.messageDEV = errorBita.message || "Error no controlado";
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
      if (padre && hijo) {
        // Doble chequeo de seguridad
        padre.hijos.push(hijo);
      }
    }
  }

  // Devolvemos solo el nodo raíz, que ahora contiene todo el árbol anidado
  return nodoRaiz;
};
// --- Helper Function para parsear y validar la operación ---
// La usaremos en ambas fases para no repetir código
const parseOperation = (op) => {
  const { collection, action, payload } = op;
  let model;
  let idField;

  if (collection === "labels") {
    model = Etiqueta;
    idField = "IDETIQUETA";
  } else if (collection === "values") {
    model = Valor;
    idField = "IDVALOR";
  } else {
    throw new Error(
      `La colección '${collection}' no es válida.|INVALID_COLLECTION`
    );
  }

  return { collection, action, payload, model, idField };
};

// --- Helper Function para ejecutar la acción de DB ---
// Recibe la sesión que debe usar (de validación o la real) y un cache de documentos creados
const runOperation = async (opDetails, session, createdDocsCache = null) => {
  const { collection, action, payload, model, idField } = opDetails;

  if (action === "CREATE") {
    // [MODIFICACIÓN: Validación de IDVALORPA en CREATE]
    if (collection === "values" && payload.IDVALORPA) {
      // 1. PRIMERO: Evitar que un valor sea su propio padre
      if (payload.IDVALOR === payload.IDVALORPA) {
        throw new Error(
          `Un valor no puede ser su propio padre (IDVALORPA).|INVALID_OPERATION|${payload.IDVALOR}`
        );
      }

      // 2. SEGUNDO: Verificar que el padre existe (primero en cache, luego en BD)
      let parentValue = null;

      // Buscar en el cache de documentos creados en esta transacción
      if (
        createdDocsCache &&
        createdDocsCache.has(`values:${payload.IDVALORPA}`)
      ) {
        parentValue = createdDocsCache.get(`values:${payload.IDVALORPA}`);
      } else {
        // Si no está en cache, buscar en la base de datos
        parentValue = await Valor.findOne({
          IDVALOR: payload.IDVALORPA,
        }).session(session);
      }

      if (!parentValue) {
        throw new Error(
          `El IDVALORPA '${payload.IDVALORPA}' no existe en la colección de valores.|PARENT_NOT_FOUND|${payload.IDVALOR}`
        );
      }
    }

    // Validar que la etiqueta padre (IDETIQUETA) exista al crear un valor.
    if (collection === "values" && payload.IDETIQUETA) {
      let parentLabel = null;

      // Buscar en el cache de documentos creados en esta transacción
      if (
        createdDocsCache &&
        createdDocsCache.has(`labels:${payload.IDETIQUETA}`)
      ) {
        parentLabel = createdDocsCache.get(`labels:${payload.IDETIQUETA}`);
      } else {
        // Si no está en cache, buscar en la base de datos
        parentLabel = await Etiqueta.findOne({
          IDETIQUETA: payload.IDETIQUETA,
        }).session(session);
      }

      if (!parentLabel) {
        throw new Error(
          `La etiqueta padre con IDETIQUETA '${payload.IDETIQUETA}' no existe.|PARENT_LABEL_NOT_FOUND|${payload.IDVALOR}`
        );
      }
    }

    const newDoc = new model(payload);
    await newDoc.save({ session });

    // Guardar en cache si está disponible
    if (createdDocsCache) {
      createdDocsCache.set(`${collection}:${newDoc[idField]}`, newDoc);
    }

    return {
      status: "SUCCESS",
      operation: "CREATE",
      collection: collection,
      id: newDoc[idField],
    };
  } else if (action === "UPDATE") {
    const { id, updates } = payload;

    // [MODIFICADO] Se permite la modificación de IDETIQUETA e IDVALOR.
    // Anteriormente se bloqueaba aquí.

    // Prevenir la modificación de la etiqueta padre de un valor.
    // NOTA: Si se cambia el IDETIQUETA de una etiqueta, se actualizarán sus hijos automáticamente (ver abajo).
    // Pero cambiar manualmente el IDETIQUETA de un valor (moverlo de etiqueta) sigue restringido si se desea,
    // aunque el requerimiento actual se enfoca en renombrar claves.
    // Si 'updates.IDETIQUETA' viene en el payload de un VALOR, asumimos que se quiere mover.
    // El código original bloqueaba esto:
    if (collection === "values" && updates.IDETIQUETA) {
      // Si se desea permitir mover valores de etiqueta, comentar esta línea.
      // Por seguridad y consistencia con el requerimiento "modificar el idEtiqueta... en las etiquetas",
      // mantendremos esta restricción para 'values' a menos que se pida explícitamente moverlos.
      // Sin embargo, el usuario dijo "hacer todos los cambios necesarios en los hijos de etiquetas".
      // Eso se refiere al UPDATE en LABELS.
      throw new Error(
        `La modificación de la etiqueta padre ('IDETIQUETA') de un valor no está permitida directamente.|PARENT_LABEL_MODIFICATION_NOT_ALLOWED|${id}`
      );
    }

    // --- INICIO DE LA VALIDACIÓN (ORDEN CORREGIDO) ---
    if (collection === "values" && updates.IDVALORPA) {
      // 1. PRIMERO: Evitar que un valor sea su propio padre
      if (id === updates.IDVALORPA) {
        throw new Error(
          `Un valor no puede ser su propio padre (IDVALORPA).|INVALID_OPERATION|${id}`
        );
      }

      // 2. SEGUNDO: Buscar si el valor padre existe en la base de datos
      const parentValue = await Valor.findOne({
        IDVALOR: updates.IDVALORPA,
      }).session(session);
      if (!parentValue) {
        throw new Error(
          `El IDVALORPA '${updates.IDVALORPA}' no existe en la colección de valores.|PARENT_NOT_FOUND|${id}`
        );
      }
    }
    // --- FIN DE LA VALIDACIÓN ---

    // [NUEVO] Validación explícita: Verificar que el nuevo ID no exista ya.
    if (updates[idField] && updates[idField] !== id) {
      const existingDoc = await model
        .findOne({ [idField]: updates[idField] })
        .session(session);
      if (existingDoc) {
        throw new Error(
          `El nuevo ID '${updates[idField]}' ya existe en la colección '${collection}'.|DUPLICATE_ID|${id}`
        );
      }
    }

    if (Object.keys(updates).length === 0) {
      return {
        status: "SUCCESS",
        operation: "UPDATE",
        collection: collection,
        id: id,
        message: "No updatable fields provided or only ID field was provided.",
      };
    }

    const updatedDoc = await model.findOneAndUpdate(
      { [idField]: id },
      updates,
      { new: true, session }
    );
    if (!updatedDoc) {
      throw new Error(
        `Documento con ${idField}=${id} no encontrado.|NOT_FOUND|${id}`
      );
    }

    // --- ACTUALIZACIONES EN CASCADA ---

    // 1. Si se actualizó IDETIQUETA en la colección 'labels', actualizar todos los valores asociados.
    if (
      collection === "labels" &&
      updates.IDETIQUETA &&
      updates.IDETIQUETA !== id
    ) {
      await Valor.updateMany(
        { IDETIQUETA: id }, // Buscar por el ID antiguo
        { $set: { IDETIQUETA: updates.IDETIQUETA } },
        { session }
      );
    }

    // 2. Si se actualizó IDVALOR en la colección 'values', actualizar todos los hijos (IDVALORPA).
    if (collection === "values" && updates.IDVALOR && updates.IDVALOR !== id) {
      await Valor.updateMany(
        { IDVALORPA: id }, // Buscar hijos que apunten al ID antiguo
        { $set: { IDVALORPA: updates.IDVALOR } },
        { session }
      );
    }

    return {
      status: "SUCCESS",
      operation: "UPDATE",
      collection: collection,
      id: updates[idField] || id, // Retornar el nuevo ID si cambió
    };
  } else if (action === "DELETE") {
    const { id } = payload;
    const deletedDoc = await model.findOneAndDelete(
      { [idField]: id },
      { session }
    );
    if (!deletedDoc) {
      throw new Error(
        `Documento con ${idField}=${id} no encontrado.|NOT_FOUND|${id}`
      );
    }

    // --- CASCADE DELETE FOR LABELS ---
    // Si se borra una etiqueta, borrar todos sus valores asociados
    if (collection === "labels") {
      await Valor.deleteMany({ IDETIQUETA: id }, { session });
    }

    return {
      status: "SUCCESS",
      operation: "DELETE",
      collection: collection,
      id: id,
    };
  } else {
    throw new Error(`La acción '${action}' no es válida.|INVALID_ACTION`);
  }
};

// --- Función Principal (MongoDB) - CORREGIDA ---
const executeCrudOperations = async (bitacora, params, body) => {
  let data = DATA();
  const validationResults = [];
  let hasValidationErrors = false;
  let validationSession = null;
  let mainSession = null;

  try {
    data.api = "/CRUD";
    bitacora.process =
      "Crear, Actualizar y Eliminar etiquetas y valores [MongoDB]";
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
    validationSession = await mongoose.startSession();
    validationSession.startTransaction();

    // Cache para documentos creados en la Fase 1
    const validationCache = new Map();

    for (const op of operations) {
      let opDetails;

      try {
        // 1. Parsear y validar la operación
        opDetails = parseOperation(op);

        // 2. Ejecutarla DENTRO de la sesión de validación CON CACHE
        const successResult = await runOperation(
          opDetails,
          validationSession,
          validationCache
        );
        validationResults.push(successResult);
      } catch (error) {
        // 3. Si falla, registrar el error
        hasValidationErrors = true;
        const { collection, action } = op;

        let errorCode = "OPERATION_FAILED";
        let errorMsg = error.message;
        let payloadId =
          opDetails?.payload?.id ||
          opDetails?.payload?.IDETIQUETA ||
          opDetails?.payload?.IDVALOR ||
          "unknown";

        if (error.message.includes("|")) {
          const parts = error.message.split("|");
          errorMsg = parts[0];
          errorCode = parts[1] || "OPERATION_FAILED";
          payloadId = parts[2] || payloadId;
        }

        if (error.code === 11000) {
          errorCode = "DUPLICATE_KEY";
          const match = error.message.match(/dup key: { .*?: \"(.*?)\" }/);
          const dupValue = match ? match[1] : payloadId;
          errorMsg = `Ya existe un documento con el ID '${dupValue}'.`;
          payloadId = dupValue;
        }

        validationResults.push({
          status: "ERROR",
          operation: action,
          collection: collection,
          id: payloadId,
          error: { code: errorCode, message: errorMsg },
        });
      }
    }

    // IMPORTANTE: Abortar y cerrar la sesión de validación
    await validationSession.abortTransaction();
    validationSession.endSession();
    validationSession = null; // Limpiar la referencia

    // --- REVISIÓN DE VALIDACIÓN ---
    data.dataRes = validationResults;

    if (hasValidationErrors) {
      data.messageUSR =
        "Una o más operaciones fallaron. No se guardó ningún cambio.";
      data.messageDEV = "Validation failed. No commit was attempted.";
      data.status = 400;
      bitacora = AddMSG(bitacora, data, "FAIL");
      FAIL(bitacora);
      throw new Error(data.messageDEV);
    }

    // --- FASE 2: EJECUCIÓN REAL (SI NO HAY ERRORES) ---
    mainSession = await mongoose.startSession();
    mainSession.startTransaction();

    // Cache para documentos creados en la Fase 2
    const executionCache = new Map();

    // Ejecutar las operaciones secuencialmente para mantener el orden
    const finalResults = [];
    for (const op of operations) {
      const opDetails = parseOperation(op);
      const result = await runOperation(opDetails, mainSession, executionCache);
      finalResults.push(result);
    }

    await mainSession.commitTransaction();
    mainSession.endSession();
    mainSession = null;

    data.dataRes = finalResults;
    data.messageUSR = "Operaciones CRUD ejecutadas correctamente.";
    data.status = 200;
    bitacora = AddMSG(bitacora, data, "OK", data.status, true);
    return OK(bitacora);
  } catch (error) {
    // --- LIMPIEZA DE SESIONES EN CASO DE ERROR ---
    if (validationSession) {
      try {
        if (validationSession.inTransaction()) {
          await validationSession.abortTransaction();
        }
        validationSession.endSession();
      } catch (cleanupError) {
        console.error(
          "Error al limpiar validationSession:",
          cleanupError.message
        );
      }
    }

    if (mainSession) {
      try {
        if (mainSession.inTransaction()) {
          await mainSession.abortTransaction();
        }
        mainSession.endSession();
      } catch (cleanupError) {
        console.error("Error al limpiar mainSession:", cleanupError.message);
      }
    }

    data.status = data.status || 500;
    data.messageDEV = data.messageDEV || error.message;
    data.messageUSR =
      data.messageUSR || "Error inesperado al procesar las operaciones.";
    data.dataRes = data.dataRes || validationResults;

    bitacora = AddMSG(bitacora, data, "FAIL");

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
          from: "Valor", // The name of the values collection
          localField: "IDETIQUETA",
          foreignField: "IDETIQUETA",
          as: "valores",
        },
      },
    ]).then((etiqueta) => {
      if (!etiqueta) {
        data.process = "Obtener todo el historial de etiquwta valor.";
        data.status = 404;
        data.messageUSR = "<<AVISO> No hay datos de etiquetas y valores.";
        data.messageDEV =
          "<<AVISO>> El metodo aggregate() no  relaciono elementos de la coleccion <<Etiquetas>> y <<Valores>>";
        throw Error(data.messageDEV);
      }
      return etiqueta;
    });
    //FIC: Response settings on success
    data.messageUSR =
      "<<OK>> La extracción de los ETIQUETAS Y VALORES <<SI>> tuvo éxito.";
    data.dataRes = labelsWithValues;
    bitacora = AddMSG(bitacora, data, "OK", 200, true);
    return OK(bitacora);
  } catch (error) {
    data.status = data.status || error?.code ? error.code : 500;
    data.messageDEV = data.messageDEV || error.message;
    data.messageUSR =
      data.messageUSR ||
      "<<ERROR>> La extracción de las etiquetas y valores <<NO>> tuvo éxito.";
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
      data.messageUSR = "<<AVISO>> El parámetro IDETIQUETA es requerido.";
      data.messageDEV =
        "<<AVISO>> El parámetro IDETIQUETA no fue proporcionado en la consulta.";
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
    data.messageUSR =
      data.messageUSR ||
      "<<ERROR>> La extracción de la etiqueta <<NO>> tuvo éxito.";
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
      data.messageUSR = "<<AVISO>> El parámetro IDETIQUETA es requerido.";
      data.messageDEV =
        "<<AVISO>> El parámetro IDETIQUETA no fue proporcionado en la consulta.";
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
          IDVALORPA: null,
        },
      },
      {
        // Paso 2: Para CADA raíz encontrada, buscar a TODOS sus descendientes.
        $graphLookup: {
          from: "Valor", // El nombre real de tu colección de valores
          startWith: "$IDVALOR", // Empezar con el IDVALOR del documento raíz
          connectFromField: "IDVALOR", // El campo del padre (el que se conecta "desde")
          connectToField: "IDVALORPA", // El campo del hijo (el que se conecta "hacia")
          as: "descendientes", // Guardar todos los descendientes en un array
          depthField: "profundidad", // Opcional: añade un campo de profundidad
        },
      },
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
    const arbolesCompletos = raicesConDescendientes.map((raiz) => {
      const descendientes = raiz.descendientes;
      delete raiz.descendientes; // Limpiar el objeto raíz para no duplicar datos
      delete raiz.profundidad; // Limpiar el objeto raíz

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
    data.messageUSR =
      data.messageUSR ||
      "<<ERROR>> La extracción de la jerarquía <<NO>> tuvo éxito.";
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
      data.messageUSR = "<<AVISO>> El parámetro IDVALOR es requerido.";
      data.messageDEV =
        "<<AVISO>> El parámetro IDVALOR no fue proporcionado en la consulta.";
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
    data.messageUSR =
      data.messageUSR || "<<ERROR>> La extracción del valor <<NO>> tuvo éxito.";
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
const parseOperation_Cosmos = (op) => {
  const { collection, action, payload } = op;
  let containerName; // Solo el nombre, obtendremos el contenedor después
  let idField; // El nombre del campo ID
  let idValue; // El valor del ID para la operación

  if (collection === "labels") {
    containerName = cosmosLabelsContainerId;
    idField = "IDETIQUETA";
    idValue = action === "CREATE" ? payload.IDETIQUETA : payload.id;
  } else if (collection === "values") {
    containerName = cosmosValuesContainerId;
    idField = "IDVALOR";
    idValue = action === "CREATE" ? payload.IDVALOR : payload.id;
  } else {
    throw new Error(
      `La colección '${collection}' no es válida.|INVALID_COLLECTION`
    );
  }

  if (!idValue) {
    throw new Error(
      `No se proporcionó un ID ('${idField}' en payload o 'id' en payload) para la operación ${action}.|MISSING_ID`
    );
  }

  // Importante: Cosmos DB usa 'id' como el ID de documento único.
  // Asumimos que TUS IDs (IDETIQUETA, IDVALOR) son los 'id' de Cosmos.
  return { collection, action, payload, containerName, idField, idValue };
};

// --- Función Principal (CosmosDB) ---
const executeCrudOperations_Cosmos = async (bitacora, params, body) => {
  let data = DATA();
  const validationResults = [];
  let hasValidationErrors = false;

  // Mapa para simular el estado de la DB durante la validación
  const tempDbState = { labels: new Map(), values: new Map() };
  // Mapa para guardar los documentos leídos para la FASE 2 (optimización)
  const preReadDocs = new Map();

  try {
    data.api = "/CRUD";
    bitacora.process =
      "Crear, Actualizar y Eliminar etiquetas y valores [CosmosDB]";
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

    const { labelsContainer, valuesContainer } = await getCosmosContainers();
    const containers = {
      [cosmosLabelsContainerId]: labelsContainer,
      [cosmosValuesContainerId]: valuesContainer,
    };

    // Usamos un for...of para asegurar el orden, simulando una transacción
    for (const op of operations) {
      let opDetails;
      try {
        // Parsear la operación
        opDetails = parseOperation_Cosmos(op);
        const { idValue, collection } = opDetails;

        // Validar (hace lecturas de pre-verificación contra el estado real y simulado)
        const existingDoc = await validateOperation_Cosmos(
          opDetails,
          containers,
          tempDbState
        );

        // Simular la operación en el estado temporal si la validación pasa
        if (op.action === "CREATE") {
          // Guardamos el payload completo, más el 'id' de cosmos
          tempDbState[collection].set(idValue, { ...op.payload, id: idValue });
        } else if (op.action === "UPDATE") {
          // Guardamos el doc original (pre-lectura) para la Fase 2
          preReadDocs.set(idValue, existingDoc);
          // Aplicamos los cambios al estado simulado
          const updatedSimulatedDoc = { ...existingDoc, ...op.payload.updates };
          tempDbState[collection].set(idValue, updatedSimulatedDoc);
        } else if (op.action === "DELETE") {
          // Marcamos como borrado en el estado simulado
          tempDbState[collection].set(idValue, { _DELETED_: true });
        }

        validationResults.push({
          status: "SUCCESS",
          operation: op.action,
          collection: op.collection,
          id: idValue,
        });
      } catch (error) {
        // Si falla, registrar el error
        hasValidationErrors = true;
        const { collection, action } = op;

        let errorCode = "OPERATION_FAILED";
        let errorMsg = error.message;
        let payloadId =
          opDetails?.idValue || opDetails?.payload?.id || "unknown";

        if (error.message.includes("|")) {
          const parts = error.message.split("|");
          errorMsg = parts[0];
          errorCode = parts[1] || "OPERATION_FAILED";
          payloadId = parts[2] || payloadId;
        }

        if (error.code === 409) {
          // 409 Conflict es el "Duplicate Key" de Cosmos
          errorCode = "DUPLICATE_KEY";
          errorMsg = `Ya existe un documento con el ID '${payloadId}'.`;
        }

        validationResults.push({
          status: "ERROR",
          operation: action,
          collection: collection,
          id: payloadId,
          error: { code: errorCode, message: errorMsg },
        });
      }
    }
    // --- Fin FASE 1 ---

    // --- REVISIÓN DE VALIDACIÓN ---
    data.dataRes = validationResults;

    if (hasValidationErrors) {
      data.messageUSR =
        "Una o más operaciones fallaron. No se guardó ningún cambio.";
      data.messageDEV = "Validation failed. No commit was attempted.";
      data.status = 400; // Bad Request
      bitacora = AddMSG(bitacora, data, "FAIL");
      FAIL(bitacora);
      throw bitacora; // Lanzamos la bitácora
    }

    // --- FASE 2: EJECUCIÓN REAL (NO ATÓMICA) ---
    // Si llegamos aquí, todas las validaciones fueron 'SUCCESS'

    const commitPromises = operations.map((op) => {
      const opDetails = parseOperation_Cosmos(op);
      // Recuperar el doc pre-leído si es un UPDATE
      const existingDoc = preReadDocs.get(opDetails.idValue);
      return runOperation_Cosmos(opDetails, containers, existingDoc);
    });

    await Promise.all(commitPromises); // Si alguna falla aquí, se va al CATCH

    data.messageUSR = "Operaciones CRUD ejecutadas correctamente.";
    data.status = 200; // 200 OK
    bitacora = AddMSG(bitacora, data, "OK", data.status, true);
    return OK(bitacora);
  } catch (error) {
    // --- CATCH PRINCIPAL ---

    // Si el error ya es una bitácora (lanzado desde el FAIL(bitacora)), no lo envolvemos de nuevo.
    if (error.finalRes) {
      return FAIL(error);
    }

    // Si el error contiene un código conocido (e.g. DUPLICATE_ID), ajustar el status
    if (
      error.message &&
      (error.message.includes("|DUPLICATE_ID|") ||
        error.message.includes("|DUPLICATE_KEY|"))
    ) {
      data.status = 400;
      // FIC: Patch validationResults to include the error so the client (and test) sees it in dataRes
      if (validationResults.length > 0) {
        validationResults[0].status = "ERROR";
        validationResults[0].error = {
          code: "DUPLICATE_ID",
          message: error.message,
        };
      }
    }

    data.status = data.status || 500;
    data.messageDEV = data.messageDEV || error.message;
    data.messageUSR =
      data.messageUSR || "Error inesperado al procesar las operaciones.";
    data.dataRes = data.dataRes || validationResults;

    bitacora = AddMSG(bitacora, data, "FAIL");

    console.log(`<<Message USR>> ${data.messageUSR}`);
    console.log(`<<Message DEV>> ${data.messageDEV}`);

    return FAIL(bitacora);
  }
};

// FIC: COSMOS DB - Helper para la FASE 1 (Validación)
const validateOperation_Cosmos = async (opDetails, containers, tempDbState) => {
  const { collection, action, payload, containerName, idField, idValue } =
    opDetails;
  const {
    [cosmosLabelsContainerId]: labelsContainer,
    [cosmosValuesContainerId]: valuesContainer,
  } = containers;
  const container = containers[containerName];

  // Función auxiliar para leer un item (de la DB real o del estado simulado)
  const readItem = async (coll, id) => {
    if (tempDbState[coll].has(id)) {
      const simulatedItem = tempDbState[coll].get(id);
      // Si está marcado como borrado en la simulación, actuar como 404
      if (simulatedItem._DELETED_) return null;
      return simulatedItem;
    }
    try {
      const { resource } = await containers[
        coll === "labels" ? cosmosLabelsContainerId : cosmosValuesContainerId
      ]
        .item(id, id)
        .read();
      return resource || null;
    } catch (error) {
      if (error.code === 404) return null;
      throw error; // Otro error de lectura
    }
  };

  try {
    if (action === "CREATE") {
      // Validar duplicados (en estado simulado O en DB real)
      const existingItem = await readItem(collection, idValue);
      if (existingItem) {
        throw new Error(
          `Ya existe un documento con el ID '${idValue}'.|DUPLICATE_KEY|${idValue}`
        );
      }

      if (collection === "values") {
        // Validar auto-parentesco
        if (payload.IDVALORPA && payload.IDVALOR === payload.IDVALORPA) {
          throw new Error(
            `Un valor no puede ser su propio padre (IDVALORPA).|INVALID_OPERATION|${idValue}`
          );
        }

        // Validar etiqueta padre
        if (payload.IDETIQUETA) {
          const parentLabel = await readItem("labels", payload.IDETIQUETA);
          if (!parentLabel) {
            throw new Error(
              `La etiqueta padre con IDETIQUETA '${payload.IDETIQUETA}' no existe.|PARENT_LABEL_NOT_FOUND|${idValue}`
            );
          }
        }

        // Validar valor padre (IDVALORPA)
        if (payload.IDVALORPA) {
          const parentValue = await readItem("values", payload.IDVALORPA);
          if (!parentValue) {
            throw new Error(
              `El IDVALORPA '${payload.IDVALORPA}' no existe en la colección de valores.|PARENT_NOT_FOUND|${idValue}`
            );
          }
        }
      }
    } else if (action === "UPDATE") {
      const { id, updates } = payload;

      // Validar que el documento exista (en estado simulado O en DB real)
      const existingDoc = await readItem(collection, idValue);
      if (!existingDoc) {
        throw new Error(
          `Documento con ${idField}=${idValue} no encontrado.|NOT_FOUND|${idValue}`
        );
      }

      // Validar modificación de ID
      // if (
      //   (idField === "IDETIQUETA" && updates.IDETIQUETA) ||
      //   (idField === "IDVALOR" && updates.IDVALOR)
      // ) {
      //   throw new Error(
      //     `La modificación del campo ID ('${idField}') no está permitida.|ID_MODIFICATION_NOT_ALLOWED|${id}`
      //   );
      // }

      if (collection === "values") {
        // Validar modificación de etiqueta padre
        // if (updates.IDETIQUETA) {
        //   throw new Error(
        //     `La modificación de la etiqueta padre ('IDETIQUETA') de un valor no está permitida.|PARENT_LABEL_MODIFICATION_NOT_ALLOWED|${id}`
        //   );
        // }

        // Si IDVALORPA es explícitamente null, está bien (desconectar)
        if (
          Object.prototype.hasOwnProperty.call(updates, "IDVALORPA") &&
          updates.IDVALORPA !== null
        ) {
          // Evitar auto-parentesco
          if (idValue === updates.IDVALORPA) {
            throw new Error(
              `Un valor no puede ser su propio padre (IDVALORPA).|INVALID_OPERATION|${idValue}`
            );
          }
          // Validar que el nuevo padre exista
          const parentValue = await readItem("values", updates.IDVALORPA);
          if (!parentValue) {
            throw new Error(
              `El IDVALORPA '${updates.IDVALORPA}' no existe en la colección de valores.|PARENT_NOT_FOUND|${idValue}`
            );
          }
        }
      }
      // Retornar el documento real existente
      // Leemos de la DB real, no del estado simulado, para el 'replace'
      try {
        const { resource } = await container.item(idValue, idValue).read();
        return resource;
      } catch (error) {
        throw new Error(
          `Documento con ${idField}=${idValue} no encontrado en DB real para update.|NOT_FOUND|${idValue}`
        );
      }
    } else if (action === "DELETE") {
      // Validar que el documento exista
      const existingDoc = await readItem(collection, idValue);
      if (!existingDoc) {
        throw new Error(
          `Documento con ${idField}=${idValue} no encontrado.|NOT_FOUND|${idValue}`
        );
      }
    } else {
      throw new Error(`La acción '${action}' no es válida.|INVALID_ACTION`);
    }
  } catch (error) {
    // Re-lanzar el error para que la función principal lo atrape
    throw error;
  }
};

const runOperation_Cosmos = async (opDetails, containers, existingDoc) => {
  const { collection, action, payload, containerName, idField, idValue } =
    opDetails;
  const container = containers[containerName];

  // Asignar el 'id' de Cosmos DB.
  const itemPayload = { ...payload };
  if (action === "CREATE") {
    itemPayload.id = idValue;
  }

  if (action === "CREATE") {
    await container.items.create(itemPayload);
    return {
      status: "SUCCESS",
      operation: "CREATE",
      collection: collection,
      id: idValue,
    };
  } else if (action === "UPDATE") {
    const { id, updates } = payload;

    if (Object.keys(updates).length === 0) {
      return {
        status: "SUCCESS",
        operation: "UPDATE",
        collection: collection,
        id: id,
        message: "No updatable fields provided.",
      };
    }

    if (!existingDoc) {
      throw new Error(
        `Error interno: El documento ${id} para UPDATE no fue pre-leído.`
      );
    }

    // Combinar los cambios
    const updatedDoc = { ...existingDoc, ...updates };

    // Si IDVALORPA es explícitamente null, debemos eliminar el campo
    if (
      Object.prototype.hasOwnProperty.call(updates, "IDVALORPA") &&
      updates.IDVALORPA === null
    ) {
      delete updatedDoc.IDVALORPA;
    }

    // Reemplazar el documento
    // await container.item(idValue, idValue).replace(updatedDoc);

    // FIC: Manejo de cambio de ID (IDETIQUETA o IDVALOR)
    // Si el ID cambia, Cosmos DB requiere crear un nuevo documento y borrar el anterior.
    const newId = updates[idField];
    const idChanged = newId && newId !== idValue;

    if (idChanged) {
      try {
        // 1. Crear el nuevo documento con el nuevo ID
        const newDoc = { ...updatedDoc, id: newId, [idField]: newId };
        await container.items.create(newDoc);
      } catch (error) {
        if (error.code === 409) {
          throw new Error(
            `El nuevo ID '${newId}' ya existe en la colección '${collection}'.|DUPLICATE_ID|${id}`
          );
        }
        throw error;
      }

      // 2. Borrar el documento anterior
      await container.item(idValue, idValue).delete();

      // 3. CASCADE UPDATES
      // Si cambiamos IDETIQUETA en 'labels', actualizar todos los valores hijos
      if (collection === "labels" && idField === "IDETIQUETA") {
        const valuesContainer = containers[cosmosValuesContainerId];
        const querySpec = {
          query: "SELECT * FROM c WHERE c.IDETIQUETA = @oldId",
          parameters: [{ name: "@oldId", value: idValue }],
        };
        const { resources: childValues } = await valuesContainer.items
          .query(querySpec)
          .fetchAll();

        for (const val of childValues) {
          const updatedVal = { ...val, IDETIQUETA: newId };
          await valuesContainer.item(val.id, val.id).replace(updatedVal);
        }
      }

      // Si cambiamos IDVALOR en 'values', actualizar todos los hijos (IDVALORPA)
      if (collection === "values" && idField === "IDVALOR") {
        const valuesContainer = containers[cosmosValuesContainerId];
        const querySpec = {
          query: "SELECT * FROM c WHERE c.IDVALORPA = @oldId",
          parameters: [{ name: "@oldId", value: idValue }],
        };
        const { resources: childValues } = await valuesContainer.items
          .query(querySpec)
          .fetchAll();

        for (const val of childValues) {
          const updatedVal = { ...val, IDVALORPA: newId };
          await valuesContainer.item(val.id, val.id).replace(updatedVal);
        }
      }

      return {
        status: "SUCCESS",
        operation: "UPDATE",
        collection: collection,
        id: newId, // Retornamos el nuevo ID
      };
    } else {
      // Si no cambia el ID, solo reemplazamos (update normal)
      await container.item(idValue, idValue).replace(updatedDoc);

      return {
        status: "SUCCESS",
        operation: "UPDATE",
        collection: collection,
        id: id,
      };
    }
  } else if (action === "DELETE") {
    const { id } = payload;

    // FIC: Cascade Delete - Si borramos una etiqueta, borrar sus valores hijos
    if (collection === "labels") {
      const valuesContainer = containers[cosmosValuesContainerId];
      // Buscar valores que tengan esta etiqueta como padre
      const querySpec = {
        query: "SELECT * FROM c WHERE c.IDETIQUETA = @idEtiqueta",
        parameters: [{ name: "@idEtiqueta", value: id }],
      };

      try {
        const { resources: childValues } = await valuesContainer.items
          .query(querySpec)
          .fetchAll();

        // Borrar cada valor encontrado
        for (const val of childValues) {
          // IDVALOR es el id del documento
          await valuesContainer.item(val.id, val.id).delete();
        }
      } catch (error) {
        console.error(
          `Error durante borrado en cascada para etiqueta ${id}:`,
          error
        );
      }
    }

    await container.item(id, id).delete(); // Asumimos id como clave de partición
    return {
      status: "SUCCESS",
      operation: "DELETE",
      collection: collection,
      id: id,
    };
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
    const { resources: labels } = await labelsContainer.items
      .readAll()
      .fetchAll();

    // 2. Obtener todos los valores
    const { resources: allValues } = await valuesContainer.items
      .readAll()
      .fetchAll();

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
    const labelsWithValues = labels.map((label) => {
      const key = label.IDETIQUETA;
      return {
        ...label,
        valores: valuesMap.get(key) || [], // Asignar los valores o un array vacío
      };
    });

    if (labelsWithValues.length === 0) {
      data.process = "Obtener todo el historial de etiqueta valor.";
      data.status = 404;
      data.messageUSR = "<<AVISO> No hay datos de etiquetas y valores.";
      data.messageDEV =
        "<<AVISO>> No se encontraron elementos en el contenedor <<Labels>>.";
      throw Error(data.messageDEV);
    }

    //FIC: Response settings on success
    data.messageUSR =
      "<<OK>> La extracción de los ETIQUETAS Y VALORES <<SI>> tuvo éxito.";
    data.dataRes = labelsWithValues;
    bitacora = AddMSG(bitacora, data, "OK", 200, true);
    return OK(bitacora);
  } catch (error) {
    data.status = data.status || error?.code ? error.code : 500;
    data.messageDEV = data.messageDEV || error.message;
    data.messageUSR =
      data.messageUSR ||
      "<<ERROR>> La extracción de las etiquetas y valores <<NO>> tuvo éxito.";
    data.dataRes = data.dataRes || error;
    bitacora = AddMSG(bitacora, data, "FAIL");
    console.log(`<<Message USR>> ${data.messageUSR}`);
    console.log(`<<Message DEV>> ${data.messageDEV}`);
    return FAIL(bitacora);
  }
};

const getEtiqueta_Cosmos = async (bitacora, params) => {
  let data = DATA();
  try {
    const { IDETIQUETA } = params.paramsQuery;

    if (!IDETIQUETA) {
      data.status = 400;
      data.messageUSR = "<<AVISO>> El parámetro IDETIQUETA es requerido.";
      data.messageDEV =
        "<<AVISO>> El parámetro IDETIQUETA no fue proporcionado en la consulta.";
      throw new Error(data.messageDEV);
    }

    bitacora.process = "Extraer una etiqueta por ID [CosmosDB]";
    data.process = `Extraer una etiqueta por ID de ${bitacora.dbServer}`;
    data.method = "GET";
    data.api = "/getEtiqueta";

    const { labelsContainer } = await getCosmosContainers();

    try {
      const { resource: etiqueta } = await labelsContainer
        .item(IDETIQUETA, IDETIQUETA)
        .read();

      if (!etiqueta) {
        data.status = 404;
        data.messageUSR = `<<AVISO>> No se encontró la etiqueta con ID: ${IDETIQUETA}.`;
        data.messageDEV = `<<AVISO>> El método item.read() no encontró resultados para la etiqueta con ID: ${IDETIQUETA}.`;
        throw new Error(data.messageDEV);
      }

      data.messageUSR =
        "<<OK>> La extracción de la etiqueta <<SI>> tuvo éxito.";
      data.dataRes = etiqueta;
      bitacora = AddMSG(bitacora, data, "OK", 200, true);
      return OK(bitacora);
    } catch (error) {
      if (error.code === 404) {
        data.status = 404;
        data.messageUSR = `<<AVISO>> No se encontró la etiqueta con ID: ${IDETIQUETA}.`;
        data.messageDEV = `<<AVISO>> El método item.read() no encontró resultados para la etiqueta con ID: ${IDETIQUETA}.`;
        throw new Error(data.messageDEV);
      }
      throw error; // Otro error de DB
    }
  } catch (error) {
    data.status = data.status || 500;
    data.messageDEV = data.messageDEV || error.message;
    data.messageUSR =
      data.messageUSR ||
      "<<ERROR>> La extracción de la etiqueta <<NO>> tuvo éxito.";
    data.dataRes = data.dataRes || error;
    bitacora = AddMSG(bitacora, data, "FAIL");
    console.log(`<<Message USR>> ${data.messageUSR}`);
    console.log(`<<Message DEV>> ${data.messageDEV}`);
    return FAIL(bitacora);
  }
};

const getJerarquiaPorEtiqueta_Cosmos = async (bitacora, params) => {
  let data = DATA();
  try {
    const { IDETIQUETA } = params.paramsQuery;

    if (!IDETIQUETA) {
      data.status = 400;
      data.messageUSR = "<<AVISO>> El parámetro IDETIQUETA es requerido.";
      data.messageDEV =
        "<<AVISO>> El parámetro IDETIQUETA no fue proporcionado en la consulta.";
      throw new Error(data.messageDEV);
    }

    bitacora.process = "Extraer jerarquía de valores por etiqueta [CosmosDB]";
    data.process = `Extraer jerarquía de valores por IDETIQUETA de ${bitacora.dbServer}`;
    data.method = "GET";
    data.api = "/getJerarquia";

    const { valuesContainer } = await getCosmosContainers();

    // Consultar todos los valores para esa etiqueta
    const querySpec = {
      query: "SELECT * FROM c WHERE c.IDETIQUETA = @idEtiqueta",
      parameters: [{ name: "@idEtiqueta", value: IDETIQUETA }],
    };
    const { resources: allValues } = await valuesContainer.items
      .query(querySpec)
      .fetchAll();

    if (!allValues || allValues.length === 0) {
      data.status = 404;
      data.messageUSR = `<<AVISO>> No se encontraron elementos con la etiqueta: ${IDETIQUETA}.`;
      data.messageDEV = `<<AVISO>> La consulta no encontró documentos para la etiqueta: ${IDETIQUETA}.`;
      throw new Error(data.messageDEV);
    }

    // Construir el árbol en memoria
    const mapa = new Map();
    for (const item of allValues) {
      mapa.set(item.IDVALOR, { ...item, hijos: [] });
    }

    const arbolesCompletos = [];
    for (const item of allValues) {
      const nodo = mapa.get(item.IDVALOR);
      if (item.IDVALORPA && mapa.has(item.IDVALORPA)) {
        // Es un hijo, encontrar su padre en el mapa y agregarlo
        mapa.get(item.IDVALORPA).hijos.push(nodo);
      } else if (!item.IDVALORPA) {
        // Es un nodo raíz
        arbolesCompletos.push(nodo);
      }
    }

    if (arbolesCompletos.length === 0 && allValues.length > 0) {
      data.status = 404;
      data.messageUSR = `<<AVISO>> No se encontraron elementos raíz con la etiqueta: ${IDETIQUETA}.`;
      data.messageDEV = `<<AVISO>> Se encontraron valores, pero ninguno es raíz (IDVALORPA es null).`;
      throw new Error(data.messageDEV);
    }

    data.messageUSR = "<<OK>> La extracción de la jerarquía <<SI>> tuvo éxito.";
    data.dataRes = arbolesCompletos;
    bitacora = AddMSG(bitacora, data, "OK", 200, true);
    return OK(bitacora);
  } catch (error) {
    data.status = data.status || 500;
    data.messageDEV = data.messageDEV || error.message;
    data.messageUSR =
      data.messageUSR ||
      "<<ERROR>> La extracción de la jerarquía <<NO>> tuvo éxito.";
    data.dataRes = data.dataRes || error;
    bitacora = AddMSG(bitacora, data, "FAIL");
    console.log(`<<Message USR>> ${data.messageUSR}`);
    console.log(`<<Message DEV>> ${data.messageDEV}`);
    return FAIL(bitacora);
  }
};

const getValor_Cosmos = async (bitacora, params) => {
  let data = DATA();
  try {
    const { IDVALOR } = params.paramsQuery;

    if (!IDVALOR) {
      data.status = 400;
      data.messageUSR = "<<AVISO>> El parámetro IDVALOR es requerido.";
      data.messageDEV =
        "<<AVISO>> El parámetro IDVALOR no fue proporcionado en la consulta.";
      throw new Error(data.messageDEV);
    }

    bitacora.process = "Extraer un valor por ID [CosmosDB]";
    data.process = `Extraer un valor por ID de ${bitacora.dbServer}`;
    data.method = "GET";
    data.api = "/getValor";

    const { valuesContainer } = await getCosmosContainers();

    try {
      const { resource: valor } = await valuesContainer
        .item(IDVALOR, IDVALOR)
        .read();

      if (!valor) {
        data.status = 404;
        data.messageUSR = `<<AVISO>> No se encontró el valor con ID: ${IDVALOR}.`;
        data.messageDEV = `<<AVISO>> El método item.read() no encontró resultados para el valor con ID: ${IDVALOR}.`;
        throw new Error(data.messageDEV);
      }

      data.messageUSR = "<<OK>> La extracción del valor <<SI>> tuvo éxito.";
      data.dataRes = valor;
      bitacora = AddMSG(bitacora, data, "OK", 200, true);
      return OK(bitacora);
    } catch (error) {
      if (error.code === 404) {
        data.status = 404;
        data.messageUSR = `<<AVISO>> No se encontró el valor con ID: ${IDVALOR}.`;
        data.messageDEV = `<<AVISO>> El método item.read() no encontró resultados para el valor con ID: ${IDVALOR}.`;
        throw new Error(data.messageDEV);
      }
      throw error; // Otro error de DB
    }
  } catch (error) {
    data.status = data.status || 500;
    data.messageDEV = data.messageDEV || error.message;
    data.messageUSR =
      data.messageUSR || "<<ERROR>> La extracción del valor <<NO>> tuvo éxito.";
    data.dataRes = data.dataRes || error;
    bitacora = AddMSG(bitacora, data, "FAIL");
    console.log(`<<Message USR>> ${data.messageUSR}`);
    console.log(`<<Message DEV>> ${data.messageDEV}`);
    return FAIL(bitacora);
  }
};

export default { crudLabelsValues };
