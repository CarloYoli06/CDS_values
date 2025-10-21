
import mongoose from 'mongoose';
import { BITACORA, DATA, AddMSG, OK, FAIL } from '../../middlewares/respPWA.handler.js';
import Etiqueta from '../models/mongodb/etiqueta.js';
import Valor from '../models/mongodb/valor.js';
// import { x } from "@sap/cds/lib/utils/tar-lib.js";
/* EndPoint: localhost:8080/api/inv/crud?ProcessType='GETALL'&LoggedUser=FIBARRAC&DBServer=MongoDB/AzureCosmos  */
const crudLabelsValues = async (req) => {
  let bitacora = BITACORA();
  let data = DATA();
  

  let {ProcessType} = req.req.query;
  const {LoggedUser} = req.req.query;
  const {DBServer} = req.req.query;

  //FIC: get query params
  //let params = req.req.query;
   const params = {
        //WithImagesURL : req.req.query?.WithImagesURL
        paramsQuery : req.req.query,
        paramString : req.req.query ? new URLSearchParams(req.req.query).toString().trim() : '',
        body : req.req.body
    };
  //FIC: get params of the service and convert in string
  //let paramString = req.req.query ? new URLSearchParams(req.req.query).toString().trim() : '';
  //FIC: get body 
  //const body = req.req.body;

  //FIC: start fill some properties of the bitacora
  bitacora.loggedUser = LoggedUser;
  bitacora.processType = ProcessType;
  bitacora.dbServer = DBServer;


    switch (ProcessType) {
        case 'CRUD':
            return await executeCrudOperations(req);
        case 'GETALL':
            return await getLabelsValues(req);
        break;
        case 'GETID':
            return await getLabelsValues(req);
        default:
            data.messageDEV = `Tipo no válido: ${processType}`;
            data.messageUSR = "Tipo de operación no reconocida.";
            bitacora = AddMSG(bitacora, data, 'FAIL', 400);
            FAIL(bitacora);
            return req.error(400, data.messageUSR);
    }
};


const executeCrudOperations = async (req) => {
    let bitacora = BITACORA();
    let data = DATA();
    const {LoggedUser} = req.req.query;
    const {DBServer} = req.req.query;
    data.loggedUser = LoggedUser;
    data.dbServer = DBServer;
    const session = await mongoose.startSession();
    session.startTransaction();
    const results = [];

    try {
        data.api = 'crudLabelsValues';
        const operations = req.data.operations;

        for (const op of operations) {
            const { collection, action } = op;
            const payload = JSON.parse(op.payload);
            let model;
            let idField;

            if (collection === 'labels') {
                model = Etiqueta;
                idField = 'IDETIQUETA';
            } else if (collection === 'values') {
                model = Valor;
                idField = 'IDVALOR';
            } else {
                results.push({
                    status: 'ERROR',
                    operation: action,
                    collection: collection,
                    id: payload.id,
                    error: {
                        code: 'INVALID_COLLECTION',
                        message: `La colección '${collection}' no es válida.`,
                    },
                });
                continue;
            }

            try {
                if (action === 'CREATE') {
                    const newDoc = new model(payload);
                    await newDoc.save({ session });
                    results.push({
                        status: 'SUCCESS',
                        operation: 'CREATE',
                        collection: collection,
                        id: newDoc[idField],
                    });
                } else if (action === 'UPDATE') {
                    const { id, updates } = payload;
                    const updatedDoc = await model.findOneAndUpdate({ [idField]: id }, updates, { new: true, session });
                    if (updatedDoc) {
                        results.push({
                            status: 'SUCCESS',
                            operation: 'UPDATE',
                            collection: collection,
                            id: id,
                        });
                    } else {
                        throw new Error(`Documento con ${idField}=${id} no encontrado.`);
                    }
                } else if (action === 'DELETE') {
                    const { id } = payload;
                    const deletedDoc = await model.findOneAndDelete({ [idField]: id }, { session });
                    if (deletedDoc) {
                        results.push({
                            status: 'SUCCESS',
                            operation: 'DELETE',
                            collection: collection,
                            id: id,
                        });
                    } else {
                        throw new Error(`Documento con ${idField}=${id} no encontrado.`);
                    }
                }
            } catch (error) {
                results.push({
                    status: 'ERROR',
                    operation: action,
                    collection: collection,
                    id: payload.id,
                    error: {
                        code: 'OPERATION_FAILED',
                        message: error.message,
                    },
                });
            }
        }

        const hasErrors = results.some(res => res.status === 'ERROR');
        if (hasErrors) {
            throw new Error('Una o más operaciones fallaron. Revise los resultados para más detalles.');
        }

        await session.commitTransaction();
        data.dataRes = results;
        data.messageUSR = 'Operaciones CRUD ejecutadas correctamente.';
        bitacora = AddMSG(bitacora, data, 'OK', 200);
        req.reply.code = 200;
        return OK(bitacora);

    } catch (error) {
        await session.abortTransaction();
        data.messageDEV = error.toString();
        data.messageUSR = "Error al ejecutar las operaciones CRUD.";
        bitacora = AddMSG(bitacora, data, 'FAIL', 500);
        FAIL(bitacora);
        // Return the partial results along with the error
        return req.error(500, bitacora);
    } finally {
        session.endSession();
    }
};

const getLabelsValues = async (req) => {
    let bitacora = BITACORA();
    let data = DATA();
    const {LoggedUser} = req.req.query;
    const {DBServer} = req.req.query;
    data.loggedUser = LoggedUser;
    data.dbServer = DBServer;


    try {
        data.api = 'getLabelsValues';
        
        const labelsWithValues = await Etiqueta.aggregate([
            {
                $lookup: {
                    from: 'Valor', // The name of the values collection
                    localField: 'IDETIQUETA',
                    foreignField: 'IDETIQUETA',
                    as: 'valores'
                }
            }
        ]);

        data.dataRes = labelsWithValues;
        data.messageUSR = 'Etiquetas y valores obtenidos correctamente.';
        bitacora = AddMSG(bitacora, data, 'OK', 200);
        req.reply.code = 200;
        return OK(bitacora);

    } catch (error) {
        data.messageDEV = error.toString();
        data.messageUSR = "Error al obtener las etiquetas y valores.";
        bitacora = AddMSG(bitacora, data, 'FAIL', 500);
        FAIL(bitacora);
        return req.error(500, data);
    }
};



export default { crudLabelsValues };
