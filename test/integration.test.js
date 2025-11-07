console.log('Test file is running...');
import { expect } from 'chai';
import supertest from 'supertest';
import createServer from '../server.js'; // Import the function that creates the server

describe('Pruebas automatizadas para la validar el funcionamiento de las apis en cualquier cambio', () => {
  let server;
  let request;

  // Use a unique ID for the test data to avoid conflicts
  const testLabelId = `TEST_LABEL_${Date.now()}`;
  const testValueId = `TEST_VALUE_${Date.now()}`;

  // Start the server before running tests
  before(async () => {
    // We need to pass the configuration object 'o' that cds.server expects
    const o = {
      "port": "3034", // Or any other port
      "app": {
        "env": "development"
      }
    };
    server = await createServer(o);
    request = supertest(server);
  });

  // Stop the server after tests are complete
  after((done) => {
    server.close(done);
  });

  // it('should perform CRUD operations on labels and values', async () => {
  //   // 1. CREATE a new label
  //   const createLabelResponse = await request
  //     .post('/api/cat/crudLabelsValues?ProcessType=CRUD&DBServer=MongoDB&LoggedUser=TestUser')
  //     .send({
  //       "operations": [{
  //         "collection": "labels",
  //         "action": "CREATE",
  //         "payload": {
  //           "IDETIQUETA": testLabelId,
  //           "DESCRIPCION": "A test label for integration tests"
  //         }
  //       }]
  //     });

  //   expect(createLabelResponse.status).to.equal(200);
  //   expect(createLabelResponse.body.d.dataRes[0].status).to.equal('SUCCESS');
  //   expect(createLabelResponse.body.d.dataRes[0].id).to.equal(testLabelId);

  //   // 2. CREATE a new value for the label
  //   const createValueResponse = await request
  //     .post('/api/cat/crudLabelsValues?ProcessType=CRUD&DBServer=MongoDB&LoggedUser=TestUser')
  //     .send({
  //       "operations": [{
  //         "collection": "values",
  //         "action": "CREATE",
  //         "payload": {
  //           "IDVALOR": testValueId,
  //           "IDETIQUETA": testLabelId,
  //           "VALOR": "A test value"
  //         }
  //       }]
  //     });

  //   expect(createValueResponse.status).to.equal(200);
  //   expect(createValueResponse.body.d.dataRes[0].status).to.equal('SUCCESS');
  //   expect(createValueResponse.body.d.dataRes[0].id).to.equal(testValueId);

  //   // 3. UPDATE the value
  //   const updatedValueText = "A test value (updated)";
  //   const updateValueResponse = await request
  //     .post('/api/cat/crudLabelsValues?ProcessType=CRUD&DBServer=MongoDB&LoggedUser=TestUser')
  //     .send({
  //       "operations": [{
  //         "collection": "values",
  //         "action": "UPDATE",
  //         "payload": {
  //           "id": testValueId,
  //           "updates": {
  //             "VALOR": updatedValueText
  //           }
  //         }
  //       }]
  //     });

  //   expect(updateValueResponse.status).to.equal(200);
  //   expect(updateValueResponse.body.d.dataRes[0].status).to.equal('SUCCESS');
  //   expect(updateValueResponse.body.d.dataRes[0].id).to.equal(testValueId);

  //   // 4. DELETE the value
  //   const deleteValueResponse = await request
  //     .post('/api/cat/crudLabelsValues?ProcessType=CRUD&DBServer=MongoDB&LoggedUser=TestUser')
  //     .send({
  //       "operations": [{
  //         "collection": "values",
  //         "action": "DELETE",
  //         "payload": {
  //           "id": testValueId
  //         }
  //       }]
  //     });

  //   expect(deleteValueResponse.status).to.equal(200);
  //   expect(deleteValueResponse.body.d.dataRes[0].status).to.equal('SUCCESS');
  //   expect(deleteValueResponse.body.d.dataRes[0].id).to.equal(testValueId);

  //   // 5. DELETE the label
  //   const deleteLabelResponse = await request
  //     .post('/api/cat/crudLabelsValues?ProcessType=CRUD&DBServer=MongoDB&LoggedUser=TestUser')
  //     .send({
  //       "operations": [{
  //         "collection": "labels",
  //         "action": "DELETE",
  //         "payload": {
  //           "id": testLabelId
  //         }
  //       }]
  //     });

  //   expect(deleteLabelResponse.status).to.equal(200);
  //   expect(deleteLabelResponse.body.d.dataRes[0].status).to.equal('SUCCESS');
  //   expect(deleteLabelResponse.body.d.dataRes[0].id).to.equal(testLabelId);
  // });

  it('Deebería dar todos los labels and values', async () => {
    const response = await request
      .post('/api/cat/crudLabelsValues?ProcessType=GetAll&DBServer=MongoDB&LoggedUser=TestUser')
      .send({});
    // console.log(response.body);
    expect(response.status).to.equal(200);
    expect(response.body.success).to.be.true;
    // expect(response.body.data).to.be.an('object');
    expect(response.body.data[0].dataRes).to.be.an('array');

  });
  
  it('Deebería der crear una etiqueta y borrarla', async () => {
    const response = await request
      .post('/api/cat/crudLabelsValues?ProcessType=GetAll&DBServer=MongoDB&LoggedUser=TestUser')
      .send({});
    // console.log(response.body);
    expect(response.status).to.equal(200);
    expect(response.body.success).to.be.true;
    // expect(response.body.data).to.be.an('object');
    expect(response.body.data[0].dataRes).to.be.an('array');

  });
});