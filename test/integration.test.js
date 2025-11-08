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
  
  it('Crear una etiqueta con todos los parametros y despues cosultarla y borrarla', async () => {
    const newLabelId = `TEST_LABEL_LIFECYCLE_${Date.now()}`;

    // 1. CREATE a new label
    const createResponse = await request
      .post('/api/cat/crudLabelsValues?ProcessType=CRUD&DBServer=MongoDB&LoggedUser=TestUser')
      .send({
        "operations": [{
          "collection": "labels",
          "action": "CREATE",
          "payload": {
            "IDSOCIEDAD": 1,
            "IDCEDI": 1,
            "IDETIQUETA": newLabelId,
            "ETIQUETA": "Test Lifecycle Label",
            "INDICE": "TC-1",
            "COLECCION": "Test",
            "SECCION": "General",
            "SECUENCIA": 10,
            "IMAGEN": "test.jpg",
            "DESCRIPCION": "Descripción completa para la etiqueta de prueba de ciclo de vida."
          }
        }]
      });

    expect(createResponse.status).to.equal(200);
    expect(createResponse.body.success).to.be.true;
    expect(createResponse.body.data[0].dataRes[0].status).to.equal('SUCCESS');
    expect(createResponse.body.data[0].dataRes[0].id).to.equal(newLabelId);

    // 2. READ the label to verify it exists
    const readResponse = await request
      .post(`/api/cat/crudLabelsValues?ProcessType=getEtiqueta&DBServer=MongoDB&LoggedUser=TestUser&IDETIQUETA=${newLabelId}`)
      .send({});

    expect(readResponse.status).to.equal(200);
    expect(readResponse.body.success).to.be.true;
    expect(readResponse.body.data[0].dataRes.IDETIQUETA).to.equal(newLabelId);

    // 3. DELETE the label
    const deleteResponse = await request
      .post('/api/cat/crudLabelsValues?ProcessType=CRUD&DBServer=MongoDB&LoggedUser=TestUser')
      .send({
        "operations": [{
          "collection": "labels",
          "action": "DELETE",
          "payload": {
            "id": newLabelId
          }
        }]
      });

    expect(deleteResponse.status).to.equal(200);
    expect(deleteResponse.body.success).to.be.true;
    expect(deleteResponse.body.data[0].dataRes[0].status).to.equal('SUCCESS');
    expect(deleteResponse.body.data[0].dataRes[0].id).to.equal(newLabelId);

    // 4. READ the label again to verify it does not exist
    const readAfterDeleteResponse = await request
      .post(`/api/cat/crudLabelsValues?ProcessType=getEtiqueta&DBServer=MongoDB&LoggedUser=TestUser&IDETIQUETA=${newLabelId}`)
      .send({});

    // The API should indicate failure when the label is not found
    expect(readAfterDeleteResponse.status).to.equal(404); // Or the specific status code for failure

  });

  it('Crear un valor con todos los parametros y despues consultarlo y borrarlo', async () => {
    const newLabelId = `TEST_LABEL_FOR_VALUE_${Date.now()}`;
    const newValueId = `TEST_VALUE_LIFECYCLE_${Date.now()}`;

    // 1. CREATE a parent label first
    const createLabelResponse = await request
      .post('/api/cat/crudLabelsValues?ProcessType=CRUD&DBServer=MongoDB&LoggedUser=TestUser')
      .send({
        "operations": [{
          "collection": "labels",
          "action": "CREATE",
          "payload": {
            "IDSOCIEDAD": 1, "IDCEDI": 1, "IDETIQUETA": newLabelId, "ETIQUETA": "Label for Value Test",
            "INDICE": "TC-2",
            "COLECCION": "Test",
            "DESCRIPCION": "Etiqueta padre para la prueba de ciclo de vida de un valor."
          }
        }]
      });
    expect(createLabelResponse.status).to.equal(200, 'La etiqueta padre no se pudo crear');

    // 2. CREATE the new value associated with the label
    const createValueResponse = await request
      .post('/api/cat/crudLabelsValues?ProcessType=CRUD&DBServer=MongoDB&LoggedUser=TestUser')
      .send({
        "operations": [{
          "collection": "values",
          "action": "CREATE",
          "payload": {
            "IDSOCIEDAD": 1, "IDCEDI": 1, "IDETIQUETA": newLabelId, "IDVALOR": newValueId, "VALOR": "Test Lifecycle Value",
            "ALIAS": "TLV",
            "IDVALORSAP": "SAP001",
            "SECUENCIA": 20,
            "IMAGEN": "value_test.jpg",
            "ROUTE": "/test/value",
            "DESCRIPCION": "Descripción completa para el valor de prueba de ciclo de vida."
          }
        }]
      });

    expect(createValueResponse.status).to.equal(200);
    expect(createValueResponse.body.success).to.be.true;
    expect(createValueResponse.body.data[0].dataRes[0].status).to.equal('SUCCESS');
    expect(createValueResponse.body.data[0].dataRes[0].id).to.equal(newValueId);

    // 3. READ the value to verify it exists
    const readValueResponse = await request
      .post(`/api/cat/crudLabelsValues?ProcessType=getValor&DBServer=MongoDB&LoggedUser=TestUser&IDVALOR=${newValueId}`)
      .send({});

    expect(readValueResponse.status).to.equal(200);
    expect(readValueResponse.body.success).to.be.true;
    expect(readValueResponse.body.data[0].dataRes.IDVALOR).to.equal(newValueId);

    // 4. DELETE the value
    const deleteValueResponse = await request
      .post('/api/cat/crudLabelsValues?ProcessType=CRUD&DBServer=MongoDB&LoggedUser=TestUser')
      .send({ "operations": [{ "collection": "values", "action": "DELETE", "payload": { "id": newValueId } }] });

    expect(deleteValueResponse.status).to.equal(200);
    expect(deleteValueResponse.body.data[0].dataRes[0].id).to.equal(newValueId);

    // 5. READ the value again to verify it's gone
    const readAfterDeleteResponse = await request
      .post(`/api/cat/crudLabelsValues?ProcessType=getValor&DBServer=MongoDB&LoggedUser=TestUser&IDVALOR=${newValueId}`)
      .send({});
    expect(readAfterDeleteResponse.status).to.equal(404);

    // 6. CLEANUP: Delete the parent label
    const deleteLabelResponse = await request
      .post('/api/cat/crudLabelsValues?ProcessType=CRUD&DBServer=MongoDB&LoggedUser=TestUser')
      .send({ "operations": [{ "collection": "labels", "action": "DELETE", "payload": { "id": newLabelId } }] });
    expect(deleteLabelResponse.status).to.equal(200, 'La etiqueta de limpieza no se pudo eliminar');
  });

  it('No debería permitir la modificación del IDETIQUETA de una etiqueta existente', async () => {
    const originalLabelId = `TEST_LABEL_NO_UPDATE_${Date.now()}`;
    const newAttemptedId = `NEW_ID_ATTEMPT_${Date.now()}`;

    // 1. CREATE the label with the original ID
    await request
      .post('/api/cat/crudLabelsValues?ProcessType=CRUD&DBServer=MongoDB&LoggedUser=TestUser')
      .send({ "operations": [{ "collection": "labels", "action": "CREATE", "payload": { "IDSOCIEDAD": 1, "IDCEDI": 1, "IDETIQUETA": originalLabelId, "ETIQUETA": "No Update Test", "DESCRIPCION": "Original Label for ID modification test" } }] })
      .expect(200);

    // 2. ATTEMPT to update the IDETIQUETA
    const updateResponse = await request
      .post('/api/cat/crudLabelsValues?ProcessType=CRUD&DBServer=MongoDB&LoggedUser=TestUser')
      .send({ "operations": [{ "collection": "labels", "action": "UPDATE", "payload": { "id": originalLabelId, "updates": { "IDETIQUETA": newAttemptedId, "ETIQUETA": "Updated Label Name" } } }] })
      .expect(400);

    // VERIFY the error response
    // expect(updateResponse.body.success).to.be.false;
    expect(updateResponse.body.error.innererror.data[0].dataRes[0].status).to.equal('ERROR');
    expect(updateResponse.body.error.innererror.data[0].dataRes[0].error.code).to.equal('ID_MODIFICATION_NOT_ALLOWED');


    // 3. VERIFY that the original data has not changed
    const readResponse = await request
      .post(`/api/cat/crudLabelsValues?ProcessType=getEtiqueta&DBServer=MongoDB&LoggedUser=TestUser&IDETIQUETA=${originalLabelId}`)
      .send({});
    expect(readResponse.status).to.equal(200);
    expect(readResponse.body.data[0].dataRes.IDETIQUETA).to.equal(originalLabelId);
    expect(readResponse.body.data[0].dataRes.ETIQUETA).to.equal("No Update Test"); // Should NOT have been updated
  
    // 4. VERIFY that no new label was created with the attempted ID
    const readNewIdResponse = await request
      .post(`/api/cat/crudLabelsValues?ProcessType=getEtiqueta&DBServer=MongoDB&LoggedUser=TestUser&IDETIQUETA=${newAttemptedId}`)
      .send({});
    expect(readNewIdResponse.status).to.equal(404);

    // 5. CLEANUP
    await request
      .post('/api/cat/crudLabelsValues?ProcessType=CRUD&DBServer=MongoDB&LoggedUser=TestUser')
      .send({ "operations": [{ "collection": "labels", "action": "DELETE", "payload": { "id": originalLabelId } }] })
      .expect(200);
  });

  it('No debería permitir la modificación del IDVALOR de un valor existente', async () => {
    const labelId = `LABEL_FOR_VAL_NO_UPDATE_${Date.now()}`;
    const originalValueId = `TEST_VALUE_NO_UPDATE_${Date.now()}`;
    const newAttemptedId = `NEW_VALUE_ID_ATTEMPT_${Date.now()}`;

    // 1. SETUP: Create a parent label and the value
    await request.post('/api/cat/crudLabelsValues?ProcessType=CRUD&DBServer=MongoDB&LoggedUser=TestUser').send({
      "operations": [{
        "collection": "labels", "action": "CREATE", "payload": {
          "IDSOCIEDAD": 1, "IDCEDI": 1, "IDETIQUETA": labelId, "ETIQUETA": "Parent For No-Update Test", "DESCRIPCION": "Parent Label"
        }
      }]
    }).expect(200);
    await request.post('/api/cat/crudLabelsValues?ProcessType=CRUD&DBServer=MongoDB&LoggedUser=TestUser').send({
      "operations": [{
        "collection": "values", "action": "CREATE", "payload": {
          "IDSOCIEDAD": 1, "IDCEDI": 1, "IDETIQUETA": labelId, "IDVALOR": originalValueId, "VALOR": "Original Value", "ALIAS": "OV", "DESCRIPCION": "Original Value for No-Update Test"
        }
      }]
    }).expect(200);

    // 2. ATTEMPT to update the IDVALOR
    const updateResponse = await request
      .post('/api/cat/crudLabelsValues?ProcessType=CRUD&DBServer=MongoDB&LoggedUser=TestUser')
      .send({ "operations": [{ "collection": "values", "action": "UPDATE", "payload": { "id": originalValueId, "updates": { "IDVALOR": newAttemptedId, "VALOR": "Updated Value Name" } } }] })
      .expect(400);

    // Verify the error response
    expect(updateResponse.status).to.equal(400);
    // expect(updateResponse.body.successbe.false;
    console.log(updateResponse.body);
    expect(updateResponse.body.error.innererror.data[0].dataRes[0].status).to.equal('ERROR');
    expect(updateResponse.body.error.innererror.data[0].dataRes[0].error.code).to.equal('ID_MODIFICATION_NOT_ALLOWED');


    // 3. VERIFY that the original data has not changed
    const readResponse = await request.post(`/api/cat/crudLabelsValues?ProcessType=getValor&DBServer=MongoDB&LoggedUser=TestUser&IDVALOR=${originalValueId}`).send({});
    expect(readResponse.status).to.equal(200);
    expect(readResponse.body.data[0].dataRes.IDVALOR).to.equal(originalValueId);
    expect(readResponse.body.data[0].dataRes.VALOR).to.equal("Original Value"); // Should NOT have been updated

    // 4. CLEANUP
    await request.post('/api/cat/crudLabelsValues?ProcessType=CRUD&DBServer=MongoDB&LoggedUser=TestUser').send({ "operations": [{ "collection": "values", "action": "DELETE", "payload": { "id": originalValueId } }] }).expect(200);
    await request.post('/api/cat/crudLabelsValues?ProcessType=CRUD&DBServer=MongoDB&LoggedUser=TestUser').send({ "operations": [{ "collection": "labels", "action": "DELETE", "payload": { "id": labelId } }] }).expect(200);
  });

  it('No debería permitir la modificación del IDETIQUETA de un valor existente', async () => {
    const originalLabelId = `ORIGINAL_LABEL_${Date.now()}`;
    const newLabelId = `NEW_LABEL_${Date.now()}`;
    const valueId = `VALUE_MOVE_TEST_${Date.now()}`;

    // 1. SETUP: Create two labels and one value
    await request.post('/api/cat/crudLabelsValues?ProcessType=CRUD&DBServer=MongoDB&LoggedUser=TestUser').send({ "operations": [{ "collection": "labels", "action": "CREATE", "payload": { "IDETIQUETA": originalLabelId, "ETIQUETA": "Original Label" } }] }).expect(200);
    await request.post('/api/cat/crudLabelsValues?ProcessType=CRUD&DBServer=MongoDB&LoggedUser=TestUser').send({ "operations": [{ "collection": "labels", "action": "CREATE", "payload": { "IDETIQUETA": newLabelId, "ETIQUETA": "New Label" } }] }).expect(200);
    await request.post('/api/cat/crudLabelsValues?ProcessType=CRUD&DBServer=MongoDB&LoggedUser=TestUser').send({ "operations": [{ "collection": "values", "action": "CREATE", "payload": { "IDETIQUETA": originalLabelId, "IDVALOR": valueId, "VALOR": "Test Value" } }] }).expect(200);

    // 2. ATTEMPT to update the value's parent label (IDETIQUETA)
    const updateResponse = await request
      .post('/api/cat/crudLabelsValues?ProcessType=CRUD&DBServer=MongoDB&LoggedUser=TestUser')
      .send({ "operations": [{ "collection": "values", "action": "UPDATE", "payload": { "id": valueId, "updates": { "IDETIQUETA": newLabelId, "VALOR": "Value Updated Name" } } }] })
      .expect(400);

    // 3. VERIFY the error response
    // expect(updateResponse.body.success).to.be.false;
    expect(updateResponse.body.error.innererror.data[0].dataRes[0].status).to.equal('ERROR');
    expect(updateResponse.body.error.innererror.data[0].dataRes[0].error.code).to.equal('PARENT_LABEL_MODIFICATION_NOT_ALLOWED');

    // 4. VERIFY that the value has not changed its parent or other fields
    const readResponse = await request.post(`/api/cat/crudLabelsValues?ProcessType=getValor&DBServer=MongoDB&LoggedUser=TestUser&IDVALOR=${valueId}`).send({});
    expect(readResponse.status).to.equal(200);
    expect(readResponse.body.data[0].dataRes.IDETIQUETA).to.equal(originalLabelId); // Should be the original label
    expect(readResponse.body.data[0].dataRes.VALOR).to.equal("Test Value"); // Should NOT have been updated

    // 5. CLEANUP
    await request.post('/api/cat/crudLabelsValues?ProcessType=CRUD&DBServer=MongoDB&LoggedUser=TestUser').send({ "operations": [{ "collection": "values", "action": "DELETE", "payload": { "id": valueId } }] }).expect(200);
    await request.post('/api/cat/crudLabelsValues?ProcessType=CRUD&DBServer=MongoDB&LoggedUser=TestUser').send({ "operations": [{ "collection": "labels", "action": "DELETE", "payload": { "id": originalLabelId } }] }).expect(200);
    await request.post('/api/cat/crudLabelsValues?ProcessType=CRUD&DBServer=MongoDB&LoggedUser=TestUser').send({ "operations": [{ "collection": "labels", "action": "DELETE", "payload": { "id": newLabelId } }] }).expect(200);
  });

  it('Debería crear una etiqueta y un valor para esa etiqueta en la misma transacción', async () => {
    const transacLabelId = `TRANSAC_LABEL_${Date.now()}`;
    const transacValueId = `TRANSAC_VALUE_${Date.now()}`;

    // 1. CREATE a label and its value in a single request
    const createResponse = await request
      .post('/api/cat/crudLabelsValues?ProcessType=CRUD&DBServer=MongoDB&LoggedUser=TestUser')
      .send({
        "operations": [
          {
            "collection": "labels",
            "action": "CREATE",
            "payload": { "IDETIQUETA": transacLabelId, "ETIQUETA": "Transactional Label" }
          },
          {
            "collection": "values",
            "action": "CREATE",
            "payload": { "IDETIQUETA": transacLabelId, "IDVALOR": transacValueId, "VALOR": "Transactional Value" }
          }
        ]
      })
      .expect(200);

    // 2. VERIFY the success of both operations in the response
    expect(createResponse.body.success).to.be.true;
    expect(createResponse.body.data[0].dataRes).to.have.lengthOf(2);
    expect(createResponse.body.data[0].dataRes[0].status).to.equal('SUCCESS');
    expect(createResponse.body.data[0].dataRes[0].id).to.equal(transacLabelId);
    expect(createResponse.body.data[0].dataRes[1].status).to.equal('SUCCESS');
    expect(createResponse.body.data[0].dataRes[1].id).to.equal(transacValueId);

    // 3. VERIFY that both documents were actually created in the DB
    const readLabel = await request.post(`/api/cat/crudLabelsValues?ProcessType=getEtiqueta&DBServer=MongoDB&LoggedUser=TestUser&IDETIQUETA=${transacLabelId}`).send({});
    const readValue = await request.post(`/api/cat/crudLabelsValues?ProcessType=getValor&DBServer=MongoDB&LoggedUser=TestUser&IDVALOR=${transacValueId}`).send({});
    expect(readLabel.status).to.equal(200);
    expect(readValue.status).to.equal(200);
    expect(readValue.body.data[0].dataRes.IDETIQUETA).to.equal(transacLabelId);

    // 4. CLEANUP
    await request.post('/api/cat/crudLabelsValues?ProcessType=CRUD&DBServer=MongoDB&LoggedUser=TestUser').send({ "operations": [{ "collection": "values", "action": "DELETE", "payload": { "id": transacValueId } }, { "collection": "labels", "action": "DELETE", "payload": { "id": transacLabelId } }] }).expect(200);
  });

  it('No debería funcionar si se crea el valor antes que la etiqueta en la misma transacción', async () => {
    const transacLabelId = `REVERSE_LABEL_${Date.now()}`;
    const transacValueId = `REVERSE_VALUE_${Date.now()}`;

    // 1. ATTEMPT to create a value before its label in a single request
    const createResponse = await request
      .post('/api/cat/crudLabelsValues?ProcessType=CRUD&DBServer=MongoDB&LoggedUser=TestUser')
      .send({
        "operations": [
          {
            "collection": "values",
            "action": "CREATE",
            "payload": { "IDETIQUETA": transacLabelId, "IDVALOR": transacValueId, "VALOR": "Reverse Transactional Value" }
          },
          {
            "collection": "labels",
            "action": "CREATE",
            "payload": { "IDETIQUETA": transacLabelId, "ETIQUETA": "Reverse Transactional Label" }
          }
        ]
      })
      .expect(400);

    // 2. VERIFY the failure response for the first operation
    // expect(createResponse.body.success).to.be.false;
    expect(createResponse.body.error.innererror.data[0].dataRes).to.have.lengthOf(2);
    const valueResult = createResponse.body.error.innererror.data[0].dataRes[0];
    expect(valueResult.status).to.equal('ERROR');
    expect(valueResult.id).to.equal(transacValueId);
    expect(valueResult.error.code).to.equal('PARENT_LABEL_NOT_FOUND');

    // 3. VERIFY that neither document was created in the DB due to transaction rollback
    const readLabel = await request.post(`/api/cat/crudLabelsValues?ProcessType=getEtiqueta&DBServer=MongoDB&LoggedUser=TestUser&IDETIQUETA=${transacLabelId}`).send({});
    const readValue = await request.post(`/api/cat/crudLabelsValues?ProcessType=getValor&DBServer=MongoDB&LoggedUser=TestUser&IDVALOR=${transacValueId}`).send({});
    expect(readLabel.status).to.equal(404);
    expect(readValue.status).to.equal(404);
  });
  
});