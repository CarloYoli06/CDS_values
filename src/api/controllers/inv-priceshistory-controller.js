//1.-importacion de las librerias
import cds from '@sap/cds';
import servicio from '../services/inv-priceshistory-service.js';

class InvestionsClass extends cds.ApplicationService {
    async init() {
        this.on('crudPricesHistory', async (req) => {
            return servicio.crudPricesHistory(req);
        });
        return await super.init();
    }
}

export default InvestionsClass;