// models/mongodb/Bitacora.js

import mongoose from 'mongoose';

/**
 * ## DataSchema (Subdocumento)
 * Este esquema representa un paso o un registro individual dentro del proceso
 * general de la bitácora. No se exporta como un modelo propio porque solo
 * existe dentro de un documento de Bitacora.
 */
const DataSchema = new mongoose.Schema({
    success: { 
        type: Boolean, 
        default: false 
    },
    status: { 
        type: Number, 
        default: 0 
    },
    process: { 
        type: String, 
        default: 'No Especificado' 
    },
    principal: { 
        type: Boolean, 
        default: false 
    },
    secuencia: { 
        type: Number, 
        default: 0 
    },
    countDataReq: { 
        type: Number, 
        default: 0 
    },
    countDataRes: { 
        type: Number, 
        default: 0 
    },
    countFile: { 
        type: Number, 
        default: 0 
    },
    messageUSR: { 
        type: String, 
        default: '' 
    },
    messageDEV: { 
        type: String, 
        default: '' 
    },
    method: { 
        type: String, 
        default: 'No Especificado' 
    },
    api: { 
        type: String, 
        default: 'No Especificado' 
    },
    // Se usa Mixed porque dataReq y dataRes pueden ser un objeto, un array o nulo.
    // Mongoose.Schema.Types.Mixed permite almacenar cualquier tipo de dato.
    dataReq: { 
        type: mongoose.Schema.Types.Mixed, 
        default: null 
    },
    dataRes: { 
        type: mongoose.Schema.Types.Mixed, 
        default: null 
    },
    file: { 
        type: mongoose.Schema.Types.Mixed, 
        default: null 
    }
}, { _id: false }); // Se desactiva el _id para los subdocumentos, si no lo necesitas.


/**
 * ## BitacoraSchema (Modelo Principal)
 * Este es el documento principal que se guardará en la colección 'bitacoras'.
 * Contiene los datos generales de la transacción y un array de subdocumentos 'data'
 * que detallan cada paso del proceso.
 */
const BitacoraSchema = new mongoose.Schema({
    success: { 
        type: Boolean, 
        required: true, 
        default: false 
    },
    status: { 
        type: Number, 
        required: true, 
        default: 0 
    },
    process: { 
        type: String 
    },
    messageUSR: { 
        type: String 
    },
    messageDEV: { 
        type: String 
    },
    countData: { 
        type: Number, 
        default: 0 
    },
    countDataReq: { 
        type: Number, 
        default: 0 
    },
    countDataRes: { 
        type: Number, 
        default: 0 
    },
    countMsgUSR: { 
        type: Number, 
        default: 0 
    },
    countMsgDEV: { 
        type: Number, 
        default: 0 
    },
    dbServer: { 
        type: String 
    },
    server: { 
        type: String 
    },
    // Aquí se anida el esquema 'DataSchema' como un array.
    data: [DataSchema],
    loggedUser: { 
        type: String 
    },
    finalRes: { 
        type: Boolean, 
        default: false 
    }
}, {
    // timestamps: true añade automáticamente los campos createdAt y updatedAt.
    // Esto es muy útil para registros de bitácora.
    timestamps: true 
});

// Se crea y exporta el modelo. MongoDB creará una colección llamada 'bitacoras' (en plural y minúsculas).
const Bitacora = mongoose.model('Bitacora', BitacoraSchema);

export default Bitacora;