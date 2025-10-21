import PricesHistory from "../models/mongodb/ztpriceshistory.js";
//FIC: Imports fuctions/methods
import { BITACORA, DATA, AddMSG, OK, FAIL } from '../../middlewares/respPWA.handler.js';
// import { x } from "@sap/cds/lib/utils/tar-lib.js";
/* EndPoint: localhost:8080/api/inv/crud?ProcessType='AddMany'&LoggedUser=FIBARRAC&DBServer=MongoDB/AzureCosmos  */

export default async function crudPricesHistory(req) {
  
  let bitacora = BITACORA();
  let data = DATA();
  
  //let ProcessType = req.req.query?.ProcessType;
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

  try {

    switch (ProcessType) {

      case 'GetOne' || 'GetSome' || 'GetAll':
            //FIC: Get One, Some or All Prices History Method
            //------------------------------------------------------           
            bitacora = await GetFiltersPricesHistoryMethod(bitacora, params)
            .then((bitacora) => {
                if (!bitacora.success) {
                    bitacora.finalRes = true;
                    throw bitacora;
                };
                //let countData = bitacora.countData - 1;
                //newInventorieItem = bitacora.data[countData].dataRes;
                return bitacora;
            });
        break;

      // case 'GetOne':
      
      //   break;

      // case 'GetSome':
      
      //   break;

      // case 'GetAll':
      
      //   break;
    
      // case 'AddOne':
        
      //   break;

      case 'AddMany':
            //FIC: Add One or Many Prices History Method
            //------------------------------------------------------           
            bitacora = await AddManyPricesHistoryMethod(bitacora, params, paramString, body)
            .then((bitacora) => {
                if (!bitacora.success) {
                    bitacora.finalRes = true;
                    throw bitacora;
                };
                //let countData = bitacora.countData - 1;
                //newInventorieItem = bitacora.data[countData].dataRes;
                return bitacora;
            });

        break;

        // case 'UpdateOne':
        
        //   break;

        case 'UpdateMany': //UpdateSome
            //FIC: Update One or Many Prices History Method
            //------------------------------------------------------           
            bitacora = await UpdateManyPricesHistoryMethod(bitacora, params, paramString, body)
            .then((bitacora) => {
                if (!bitacora.success) {
                    bitacora.finalRes = true;
                    throw bitacora;
                };
                //let countData = bitacora.countData - 1;
                //newInventorieItem = bitacora.data[countData].dataRes;
                return bitacora;
            });
        break;

        // case 'DeleteOne':
        
        //   break;

        case 'DeleteMany':
            //FIC: Delete (logic/physical) One or Many Prices History Method
            //------------------------------------------------------           
            bitacora = await DeleteManyPricesHistoryMethod(bitacora, params, paramString, body)
            .then((bitacora) => {
                if (!bitacora.success) {
                    bitacora.finalRes = true;
                    throw bitacora;
                };
                //let countData = bitacora.countData - 1;
                //newInventorieItem = bitacora.data[countData].dataRes;
                return bitacora;
            });
        break;


      default:
        break;
    };

    //COMO LOGRARON CUANDO TODO ESTA OK Y ES UN POST RETORNAR NATIVaMENTE
    //EL ESTATUS DEL RESPONSE DEL METODO 201
    //FIC: Return response OK
    return OK(bitacora);


  } catch (errorBita) {
        //FIC: Unhandled error response configuration 
        if(!errorBita?.finalRes) {
            data.status = data.status || 500;
            data.messageDEV = data.messageDEV || errorBita.message;
            data.messageUSR = data.messageUSR || "<<ERROR CATCH>> La extracción de la información de AZURE <<NO>> tuvo exito";
            data.dataRes = data.dataRes || errorBita;
            errorBita = AddMSG(bitacora, data, "FAIL");
        };
        console.log(`<<Message USR>> ${errorBita.messageUSR}`);
        console.log(`<<Message DEV>> ${errorBita.messageDEV}`);

        FAIL(errorBita);
        //FIC: Manejo de errores adicionales si es necesario
        req.error({
            code: 'Internal-Server-Error',
            status: errorBita.status,
            message: errorBita.messageUSR,
            target: errorBita.messageDEV,
            numericSeverity: 1,
            //longtext_url: 'https://example.com/error-details',
            innererror: errorBita
        });
    
        return

    } finally {
      
    }

}
//********************  LOCAL METHODS ********************** */
//********************************************************** */
  
  async function GetFiltersPricesHistoryMethod(bitacora, options = {}) {  
    let { body, paramsQuery, paramString } = options;
    //WithImagesURL = typeof WithImagesURL === 'string' ? WithImagesURL.toLowerCase() === 'true' : false;
    let data = DATA();
    let params = [];
    try {

        bitacora.process = "Extraer Historico de Precios";
        data.process = `Extraer Historico de Precios de la tabla <<ZTPRICESHISTORY>> de ${bitacora.dbServer}`;
        data.method = "GET";
        data.api = "/GetFilters";
  
        //FIC: CASO 1 --> SI LA CONEXION YA VA ESTAR HABIALITADA DESDE SERVER CUANDO SE
        //LEVANTA EL SERVICIO (NPM RUN DEV) ENTONCES SOLO VALIDAR AQUI QUE SI
        //HAYA UNA CONEXION A MONGODB O A AZURECOSMOS HABILITADA SEGUN
        //LA BASE DE DATOS QUE ESTEMOS USANDO EN DBSERVER.
        //FIC: CASO 2 --> POR EL CONTRARIO AQUI ESTABLECER LA CONEXION Y NO OLVIDAR
        //CERRAR LA CONEXION EN ALGUN FINALLY CUANDO YA NO SE NECESITE.

        //FIC: Connecting to MongoDB/AzureCosmos database
        //  const conn = await connectToHanaClient(bitacora.dbServer)
        // .catch((error) => {
        //     data.status = error.code;
        //     data.messageDEV = error.message;
        //     throw error;
        // });

        //FIC: Seccion para definir String Query


        //FIC: Logica del Proceso

    const IdPrice = parseInt(paramsQuery?.IdPrice);
    
    let pricesHistory;

    switch (bitacora.dbServer) {
      case 'MongoDB':
          switch (key) {
            case 'GetOne':
                
                data.process = 'Obtener el historial de precios de un ID.';
                
                if (IdPrice < 0) {
                    
                    data.status = 500;
                    data.messageUSR = '<<AVISO>> No se pudo obtener el valor del <<ID>> del precio.';
                    data.messageDEV = '<<ERROR>> Falta el parametro <<IdPrice>> en el EndPoint.';
                    throw Error(data.messageDEV);
                };

          
                //FIC: OPCION #1 promise propios de los metodos de MongoDB
                //111111111111111111111111111111111111111111111111111111111
                pricesHistory = await PricesHistory.findOne(
                  { ID: IdPrice })
                  .then((price) => {
                    if (!price) {
                      data.status = 404;
                      data.messageUSR = `<<AVISO>> La extracción de <<ID: ${IdPrice}>> de historial de precios <<NO>> Existe.`;
                      data.messageDEV = `<<AVISO>> El metodo findOne() no encontro resultados en la tabla <<ZTPRICESHISTORY>> con el <<ID: ${IdPrice}>>`;
                      throw Error(data.messageDEV);
                    };
                  
                    //FIC: Todo OK
                    return price;
                  
                    })
                  .catch((error) => {
                        throw error
                  });     

              break;
            case 'GetSome':
              
              break;

            case 'GetAll':
                
                //FIC: OPCION #1 promise propios de los metodos de MongoDB
                //11111111111111111111111111111111111111111111111111111111
                pricesHistory = await PricesHistory.find().lean()
                  .then((prices) => {
                    if (!prices) {
                      data.process = 'Obtener todo el historial de precios.';
                      data.status = 404;
                      data.messageUSR = '<<AVISO> No hay historial de precios.';
                      data.messageDEV = '<<AVISO>> El metodo find() no encontro resultados en la tabla <<ZTPRICESHISTORY>>';
                      throw Error(data.messageDEV);
                    };

                    //FIC: Todo OK
                    return prices;
                    
                  })
                  .catch((error) => {
                        throw error
                  });   

              break;
          
            default:
              break;
          }
        
        break;

      case 'AzureCosmos':
        
            //PROMESA Y QUERYS PARA OBTENER LA INFORMACION DE AZURE COSMOS
        
        break;
    
      default:
        break;
    }

    //FIC: Response settings on success
    data.messageUSR = "<<OK>> La extracción de los PRODUCTOS <<SI>> tuvo éxito."; // Esta ya era una cadena válida
    data.dataRes = PriceHistoryPromise;
    bitacora = AddMSG(bitacora, data, "OK", 200, true);

    //FIC: Return response OK
    return OK(bitacora);

  } catch (error) {
        //FIC: Unhandled error response configuration
        data.status = data.status || error?.code ? error.code : 500;
        data.messageDEV = data.messageDEV || error.message;
        data.messageUSR = data.messageUSR || "<<ERROR>> La extracción del historico de precios <<NO>> tuvo éxito.";
        data.dataRes = data.dataRes || error;
        bitacora = AddMSG(bitacora, data, "FAIL"); // No es necesario devolver el resultado de AddMSG a bitacora aquí
        console.log(`<<Message USR>> ${data.messageUSR}`);
        console.log(`<<Message DEV>> ${data.messageDEV}`);

        return FAIL(bitacora);

    } finally {
        //FIC: Close the connection to HANA after the query
        //if (conn) {await conn.disconnect(); console.log('<<OK>> Se finalizo la conexion a <<DB>> Hana Client');}
    };
  
};