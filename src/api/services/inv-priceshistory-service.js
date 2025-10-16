import { BITACORA, DATA, AddMSG, OK, FAIL } from '../../middlewares/respPWA.handler.js';
import ztpriceshistory from '../models/mongodb/ztpriceshistory.js';

async function GetAllPricesHistory(req) {
    let bitacora = BITACORA();
    let data = DATA();

    try {
        data.api = 'GetAllPricesHistory';
        data.dataReq = req.data;

        const idPrice = parseInt(req.req.query?.IdPrice);
        const initVolume = parseInt(req.req.query?.initVolume);
        const endVolume = parseInt(req.req.query?.endVolume);

        let priceHistory;

        if (idPrice > 0) {
            priceHistory = await ztpriceshistory.findOne({ ID: idPrice }).lean();
        } else if (initVolume >= 0 && endVolume >= 0) {
            priceHistory = await ztpriceshistory.find({
                VOLUME: {
                    $gte: initVolume, $lte: endVolume
                }
            }).lean();
        } else {
            priceHistory = await ztpriceshistory.find().lean();
        }

        data.dataRes = priceHistory;
        data.messageUSR = 'Precios obtenidos correctamente.';
        bitacora = AddMSG(bitacora, data, 'OK', 200);
        req.reply.code = 200;
        return OK(bitacora);

    } catch (error) {
        data.messageDEV = error.toString();
        data.messageUSR = "Error al obtener los precios.";
        bitacora = AddMSG(bitacora, data, 'FAIL', 500);
        FAIL(bitacora);
        return req.error(500, data.messageUSR);
    }
}

async function AddOnePricesHistory(req) {
    let bitacora = BITACORA();
    let data = DATA();

    try {
        data.api = 'AddOnePricesHistory';
        data.dataReq = req.data.prices;

        const newPrices = req.data.prices;

        // Validación: Asegurarse de que newPrices es un array.
        if (!Array.isArray(newPrices)) {
            data.messageDEV = `El formato de entrada es incorrecto. Se esperaba un array en la propiedad 'prices', pero se recibió: ${typeof newPrices}.`;
            data.messageUSR = "El formato de los datos enviados es incorrecto. Se debe enviar un array de precios.";
            bitacora = AddMSG(bitacora, data, 'FAIL', 400); // 400 Bad Request
            FAIL(bitacora);
            return req.error(400, data.messageUSR);
        }

        // Validar si alguno de los IDs ya existe
        const newPriceIds = newPrices.map(p => p.ID);
        const existingPrices = await ztpriceshistory.find({ ID: { $in: newPriceIds } }).lean();

        if (existingPrices.length > 0) {
            const existingIds = existingPrices.map(p => p.ID);
            data.messageDEV = `Intento de insertar IDs duplicados: ${existingIds.join(', ')}`;
            data.messageUSR = `Uno o más precios ya existen con los IDs proporcionados: ${existingIds.join(', ')}.`;
            bitacora = AddMSG(bitacora, data, 'FAIL', 409); // 409 Conflict
            FAIL(bitacora);
            return req.error(409, data.messageUSR);
        }

        const pricesHistory = await ztpriceshistory.insertMany(newPrices, { ordered: true });

        data.dataRes = JSON.parse(JSON.stringify(pricesHistory));
        data.messageUSR = 'Precios añadidos correctamente.';
        bitacora = AddMSG(bitacora, data, 'OK', 201); // 201 Created
        req.reply.code = 201;
        return OK(bitacora);

    } catch (error) {
        data.messageDEV = error.toString();
        data.messageUSR = "Error al añadir los nuevos precios.";
        bitacora = AddMSG(bitacora, data, 'FAIL', 500);
        FAIL(bitacora);
        return req.error(500, data.messageUSR);
    }
}

async function UpdateOnePricesHistory(req) {
    let bitacora = BITACORA();
    let data = DATA();

    try {
        data.api = 'UpdateOnePricesHistory';
        data.dataReq = req.data;
        
        const idPrice = parseInt(req.req.query?.IdPrice);
    
        const newData = req.data.price;

        // Si se intenta cambiar el ID, verificar que el nuevo ID no exista ya
        if (newData.ID && newData.ID !== idPrice) {
            const existingPrice = await ztpriceshistory.findOne({ ID: newData.ID }).lean();
            if (existingPrice) {
                data.messageUSR = `No se puede actualizar al ID ${newData.ID} porque ya existe.`;
                bitacora = AddMSG(bitacora, data, 'FAIL', 409); // 409 Conflict
                FAIL(bitacora);
                return req.error(409, data.messageUSR);
            }
        }

        const updatedPrice = await ztpriceshistory.findOneAndUpdate(
            { ID: idPrice },
            newData,
            { new: true }
        ).lean();

        if (!updatedPrice) {
            data.messageUSR = "No se encontró el precio a actualizar.";
            bitacora = AddMSG(bitacora, data, 'FAIL', 404); // 404 Not Found
            FAIL(bitacora);
            return req.error(404, data.messageUSR);
        } else {
            data.dataRes = updatedPrice;
            data.messageUSR = 'Precio actualizado correctamente.';
            bitacora = AddMSG(bitacora, data, 'OK', 200);
            req.reply.code = 200;
            return OK(bitacora);
        }

    } catch (error) {
        data.messageDEV = error.toString();
        data.messageUSR = "Error al actualizar el precio.";
        bitacora = AddMSG(bitacora, data, 'FAIL', 500);
        FAIL(bitacora);
        return req.error(500, data.messageUSR);
    }
}

async function DeleteOnePricesHistory(req) {
    let bitacora = BITACORA();
    let data = DATA();

    try {
        data.api = 'DeleteOnePricesHistory';
        data.dataReq = req.data;

        const idPrice = parseInt(req.req.query?.IdPrice);

        const deletionResult = await ztpriceshistory.findOneAndDelete(
            { ID: idPrice }
        ).lean();

        if (!deletionResult) {
            data.messageUSR = "No se encontró el precio a eliminar.";
            bitacora = AddMSG(bitacora, data, 'FAIL', 404); // 404 Not Found
            FAIL(bitacora);
            return req.error(404, data.messageUSR);
        } else {
            data.dataRes = deletionResult;
            data.messageUSR = 'Precio eliminado correctamente.';
            bitacora = AddMSG(bitacora, data, 'OK', 200);
            req.reply.code = 200;
            return OK(bitacora);
        }

    } catch (error) {
        data.messageDEV = error.toString();
        data.messageUSR = "Error al eliminar el precio.";
        bitacora = AddMSG(bitacora, data, 'FAIL', 500);
        FAIL(bitacora);
        return req.error(500, data.messageUSR);
    }
}

async function crudPricesHistory(req) {
    const action = req.req.query?.action;
    switch (action) {
        case 'getall':
            return await GetAllPricesHistory(req);
        case 'addone':
            return await AddOnePricesHistory(req);
        case 'updateone':
            return await UpdateOnePricesHistory(req);
        case 'deleteone':
            return await DeleteOnePricesHistory(req);
        default:
            let bitacora = BITACORA();
            let data = DATA();
            data.messageDEV = `Accion no valida: ${action}`;
            data.messageUSR = "Acción no reconocida por el sistema.";
            bitacora = AddMSG(bitacora, data, 'FAIL', 400);
            FAIL(bitacora);
            return req.error(400, data.messageUSR);
    }
}

export default { crudPricesHistory };