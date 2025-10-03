export default {
    GetAllPricesHistory,
    AddOnePricesHistory,
    UpdateOnePricesHistory,
    DeleteOnePricesHistory
};
import ztpriceshistory from '../models/mongodb/ztpriceshistory.js';

export async function GetAllPricesHistory(req) {
    try {
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
        return priceHistory;
    } catch (e) {
        console.error(e);
    }
}

export async function AddOnePricesHistory(req) {
    try {
        const newPrices = req.req.body.prices;
        let pricesHistory;
        pricesHistory = await ztpriceshistory.insertMany(newPrices, { order: true });
        return (JSON.parse(JSON.stringify(pricesHistory)));
    } catch (error) {
        return error;
    }
}

export async function UpdateOnePricesHistory(req) {
    try {
        const idPrice = req.req.query?.IdPrice;
        const newData = req.req.body.price;

        const updatedPrice = await ztpriceshistory.findOneAndUpdate(
            { ID: idPrice },
            newData,
            { new: true }
        );

        return (JSON.parse(JSON.stringify({ updatedPrice })));
    } catch (error) {
        console.log(error);
        return error;
    }
}

export async function DeleteOnePricesHistory(req) {
    try {
        const idPrice = req.req.query?.IdPrice;

        const deletionResult = await ztpriceshistory.findOneAndDelete(
            { ID: idPrice }
        );

        return (JSON.parse(JSON.stringify({ deletionResult })));
    } catch (error) {
        console.log(error);
        return error;
    }
}