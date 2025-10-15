import { whatTypeVarIs } from '../helpers/variables.js';
import Bitacora from '../api/models/mongodb/bitacora.js';


export const BITACORA = () => {

    const bitacora = {
        success         : false,
        status          : 0,
        process         : '',
        messageUSR      : '',
        messageDEV      : '',
        countData       : 0,
        countDataReq    : 0,
        countDataRes    : 0,
        countMsgUSR     : 0,
        countMsgDEV     : 0,
        dbServer        : '',
        server          : '',
        data            : [],
        loggedUser      : '',
        finalRes        : false
    };

    return bitacora;
};

export const DATA = () => {

    const data = {
        success         : false,
        status          : 0,
        process         : '',
        principal       : false,
        secuencia       : 0,
        countDataReq    : 0,
        countDataRes    : 0,
        countFile       : 0,
        messageUSR      : '',
        messageDEV      : '',
        method          : '',
        api             : '',
        dataReq         : [],
        dataRes         : [],
        file            : []
    };

    return data;
};

export const AddMSG = (bitacora, data, tipo, status = 500, principal = false) => {

    if (tipo === 'OK') {
        data.success = data.success     || true;
        bitacora.success = data.success  || true;
    } else {
        data.success = data.success     || false;
        bitacora.success = data.success  || false;
    }

    data.status     = data.status       || status;
    data.process    = data.process      || 'No Especificado';
    data.principal  = data.principal    || principal;
    data.method     = data.method       || 'No Especificado';
    data.api        = data.api          || 'No Especificado';

    data.secuencia++;

    if (data.messageDEV) {
        bitacora.messageDEV = data.messageDEV;
        bitacora.countMsgDEV++;
    };

    if (data.messageUSR) {
        bitacora.messageUSR = data.messageUSR;
        bitacora.countMsgUSR++;
    };

    if (data.dataReq) {
        //data.countDataReq++;
        //if(data.dataReq.length)
        //     data.countDataReq = data.dataReq.length;
        // else
        //     data.countDataReq = 0;

        if (whatTypeVarIs(data.dataReq)==='isArray')
            data.countDataReq = data.dataReq.length;
        else if (whatTypeVarIs(data.dataReq)==='isObject')
            data.countDataReq = 1;
        else if (whatTypeVarIs(data.dataReq)===null)
            data.countDataReq = 0;

        bitacora.countDataReq++;
    }

    if (data.dataRes) {
        //data.countDataRes++;
        //FIC: if length is not defined, it goes to else 
        //because data is an object and not an array 
        //if(data.dataRes.length)
        //   data.countDataRes = data.dataRes.length;
        //else
        //    data.countDataRes = 1;   
        
        if (whatTypeVarIs(data.dataRes)==='isArray')
            data.countDataRes = data.dataRes.length;
        else if (whatTypeVarIs(data.dataRes)==='isObject')
            data.countDataRes = 1;
        else if (whatTypeVarIs(data.dataRes)===null)
            data.countDataRes = 0;
            
        bitacora.countDataRes++;
    };

    if (data.file) {
        if (whatTypeVarIs(data.file)==='isArray')
            data.countFile = data.file.length;
        else if (whatTypeVarIs(data.file)==='isObject')
            data.countFile = 1;
        else if (whatTypeVarIs(data.file)===null)
            data.countFile = 0;
    };

    bitacora.status = data.status;
    bitacora.data.push(data);
    bitacora.countData++;

    return bitacora;
};

/**
 * Guarda el objeto de bitácora en la base de datos de forma asíncrona.
 * @param {object} bitacoraObject - El objeto de bitácora a guardar.
 */
const saveBitacora = async (bitacoraObject) => {
    try {
        // Se clona el objeto para evitar problemas de mutación
        const logEntry = new Bitacora({ ...bitacoraObject });
        await logEntry.save();
    } catch (error) {
        console.error("Error al guardar la bitácora en MongoDB:", error);
    }
};

export const        OK = (bitacora) => {

    // if (!bitacora.dbServer)
    //     bitacora.dbServer= dbServer = process.env.CONNECTION_TO_HANA;
    saveBitacora(bitacora); // Fire-and-forget: guarda la bitácora sin esperar
    console.log("BITACORA OK:", bitacora);

    return {
        success         : bitacora.success      || true,
        code          : bitacora.status       || 500,
        process         : bitacora.process      || 'No Especificado',
        messageUSR      : bitacora.messageUSR   || 'No Especificado',
        messageDEV      : bitacora.messageDEV   || 'No Especificado',
        countData       : bitacora.countData    || 0,
        countDataReq    : bitacora.countDataReq || 0,
        countDataRes    : bitacora.countDataRes || 0,
        countMsgUSR     : bitacora.countMsgUSR  || 0,
        countMsgDEV     : bitacora.countMsgDEV  || 0,
        dbServer        : bitacora.dbServer     || 'Default',
        server          : bitacora.server       || 'Default',
        data            : bitacora.data         || [],
        session         : bitacora.session      || 'No Especificado',
        loggedUser      : bitacora.loggedUser   || 'No Especificado',
        finalRes        : bitacora.finalRes     || false
    }
};

export const FAIL = (bitacora) => {

    // if (!bitacora.dbServer)
    //     bitacora.dbServer= dbServer = process.env.CONNECTION_TO_HANA;
    saveBitacora(bitacora); // Fire-and-forget: guarda la bitácora sin esperar
    console.log("BITACORA FAIL:", bitacora);

    return {
        success         : bitacora.success      || false,
        code          : bitacora.status       || 500,
        process         : bitacora.process      || 'No Especificado',
        messageUSR      : bitacora.messageUSR   || 'No Especificado',
        messageDEV      : bitacora.messageDEV   || 'No Especificado',
        countData       : bitacora.countData    || 0,
        countDataReq    : bitacora.countDataReq || 0,
        countDataRes    : bitacora.countDataRes || 0,
        countMsgUSR     : bitacora.countMsgUSR  || 0,
        countMsgDEV     : bitacora.countMsgDEV  || 0,
        dbServer        : bitacora.dbServer     || 'Default',
        server          : bitacora.server       || 'Default',
        data            : bitacora.data         || [],
        session         : bitacora.session      || 'No Especificado',
        loggedUser      : bitacora.loggedUser   || 'No Especificado',
        finalRes        : bitacora.finalRes     || false
    }
};

export const TRANSOPTIONS = () => {

    const transactionOptions = {
        readPreference: 'primary',
        //readPreference: 'secondary',
        readConcern: {level: 'local'},
        writeConcern: {w: 'majority'},
        maxCommitTimeMS: 1000
    };

    return transactionOptions;
};