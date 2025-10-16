
import mongoose from 'mongoose';
import { BITACORA, DATA, AddMSG, OK, FAIL } from '../../middlewares/respPWA.handler.js';
import Etiqueta from '../models/mongodb/etiqueta.js';
import Valor from '../models/mongodb/valor.js';

const executeCrudOperations = async (req) => {
    let bitacora = BITACORA();
    let data = DATA();
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
        return req.error(500, { message: data.messageUSR, results });
    } finally {
        session.endSession();
    }
};

const getLabelsValues = async (req) => {
    let bitacora = BITACORA();
    let data = DATA();

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
        return req.error(500, data.messageUSR);
    }
};

const crudLabelsValues = async (req) => {
    const type = req.req.query?.TYPE;
    switch (type) {
        case 'CRUD':
            return await executeCrudOperations(req);
        case 'GET':
            return await getLabelsValues(req);
        default:
            let bitacora = BITACORA();
            let data = DATA();
            data.messageDEV = `Tipo no válido: ${type}`;
            data.messageUSR = "Tipo de operación no reconocida.";
            bitacora = AddMSG(bitacora, data, 'FAIL', 400);
            FAIL(bitacora);
            return req.error(400, data.messageUSR);
    }
};

export default { crudLabelsValues };
