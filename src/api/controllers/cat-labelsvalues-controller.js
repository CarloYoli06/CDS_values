import cds from '@sap/cds';
import servicio from '../services/cat-labelsvalues-service.js';

class LabelsValuesClass extends cds.ApplicationService {
    async init() {
        this.on('crudLabelsValues', async (req) => {
            return servicio.crudLabelsValues(req);
        });
        return await super.init();
    }
}

export default LabelsValuesClass;