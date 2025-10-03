//1.-importacion de las librerias
import cds from '@sap/cds';
import servicio from '../services/inv-priceshistory-service.js';

class InvestionsClass extends cds.ApplicationService {
    async init() {
        this.on('getall', async (req) => {
            return servicio.GetAllPricesHistory(req);
        });
        this.on("addone", async (req) => {
            return servicio.AddOnePricesHistory(req);
        });
        this.on("updateone", async (req) => {
            return servicio.UpdateOnePricesHistory(req);
        });
        this.on("deleteone", async (req) => {
            return servicio.DeleteOnePricesHistory(req);
        });
        return await super.init();
    }
}

export default InvestionsClass;