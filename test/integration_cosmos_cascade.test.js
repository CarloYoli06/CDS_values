
import request from 'supertest';
import { expect } from 'chai';
import createServer from '../server.js';
import dotenv from 'dotenv';

dotenv.config();

// Simular body para las peticiones
const createPayload = (operations) => ({
    operations
});

describe('Integration Tests - Cosmos DB Cascade Delete', function () {
    this.timeout(20000); // Aumentar timeout para operaciones de DB

    let server;
    let req;
    const timestamp = Date.now();
    const labelId = `L_CASCADE_${timestamp}`;
    const valueId = `V_CASCADE_${timestamp}`;

    // Inicializar la app antes de los tests
    before(async function () {
        const o = {
            port: 3035 // Usar un puerto diferente al de integration.test.js (3034)
        };
        server = await createServer(o);
        req = request(server);
    });

    // Limpieza posterior
    after(async function () {
        // Intentar borrar si quedaron (aunque el test debería borrarlos)
        try {
            await req.post('/api/cat/crudLabelsValues?ProcessType=CRUD&DBServer=CosmosDB').send(createPayload([
                { collection: 'labels', action: 'DELETE', payload: { id: labelId } }
            ]));
        } catch (e) { }

        if (server) {
            server.close();
        }
    });

    it('should cascade delete values when a label is deleted', async function () {
        // 1. Crear Etiqueta
        const createLabelRes = await req
            .post('/api/cat/crudLabelsValues?ProcessType=CRUD&DBServer=CosmosDB')
            .send(createPayload([
                {
                    collection: 'labels',
                    action: 'CREATE',
                    payload: {
                        IDETIQUETA: labelId,
                        DESCRIPCION: 'Label for Cascade Test'
                    }
                }
            ]));
        expect(createLabelRes.status).to.equal(200);

        // 2. Crear Valor hijo
        const createValueRes = await req
            .post('/api/cat/crudLabelsValues?ProcessType=CRUD&DBServer=CosmosDB')
            .send(createPayload([
                {
                    collection: 'values',
                    action: 'CREATE',
                    payload: {
                        IDVALOR: valueId,
                        IDETIQUETA: labelId,
                        VALOR: 'Value for Cascade Test'
                    }
                }
            ]));
        expect(createValueRes.status).to.equal(200);

        // 3. Verificar que ambos existen (Usando POST con ProcessType=getEtiqueta/getValor)
        const getLabelRes = await req
            .post(`/api/cat/crudLabelsValues?ProcessType=getEtiqueta&DBServer=CosmosDB&IDETIQUETA=${labelId}`)
            .send({ operations: [] }); // Enviar body vacío o mínimo
        expect(getLabelRes.status).to.equal(200);

        const getValueRes = await req
            .post(`/api/cat/crudLabelsValues?ProcessType=getValor&DBServer=CosmosDB&IDVALOR=${valueId}`)
            .send({ operations: [] });
        expect(getValueRes.status).to.equal(200);

        // 4. Borrar la Etiqueta
        const deleteLabelRes = await req
            .post('/api/cat/crudLabelsValues?ProcessType=CRUD&DBServer=CosmosDB')
            .send(createPayload([
                {
                    collection: 'labels',
                    action: 'DELETE',
                    payload: { id: labelId }
                }
            ]));
        expect(deleteLabelRes.status).to.equal(200);

        // 5. Verificar que la Etiqueta ya no existe (404)
        const checkLabelRes = await req
            .post(`/api/cat/crudLabelsValues?ProcessType=getEtiqueta&DBServer=CosmosDB&IDETIQUETA=${labelId}`)
            .send({ operations: [] });
        expect(checkLabelRes.status).to.equal(404);

        // 6. CRÍTICO: Verificar que el Valor TAMBIÉN fue borrado (404)
        const checkValueRes = await req
            .post(`/api/cat/crudLabelsValues?ProcessType=getValor&DBServer=CosmosDB&IDVALOR=${valueId}`)
            .send({ operations: [] });
        expect(checkValueRes.status).to.equal(404);
    });
});
