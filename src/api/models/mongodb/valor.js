// models/mongodb/Valor.js

import mongoose from 'mongoose';

/**
 * ## DetailRegSchema (Subdocumento)
 * Define la estructura para el historial de cambios de un registro.
 */
const DetailRegSchema = new mongoose.Schema({
    CURRENT: { 
        type: Boolean, 
        default: true 
    },
    REGDATE: { 
        type: Date, 
        default: Date.now 
    },
    REGTIME: { 
        type: String 
    },
    REGUSER: { 
        type: String 
    }
}, { _id: false });

/**
 * ## DetailRowSchema (Subdocumento)
 * Define el objeto que contiene el estado y el historial de auditoría.
 */
const DetailRowSchema = new mongoose.Schema({
    ACTIVED: { 
        type: Boolean, 
        default: true 
    },
    DELETED: { 
        type: Boolean, 
        default: false 
    },
    DETAIL_ROW_REG: [DetailRegSchema] // Un array de registros de historial
}, { _id: false });

/**
 * ## ValorSchema (Modelo Principal)
 * Representa un valor específico de una etiqueta (ej. 'Rojo' para la etiqueta 'Color')
 * que se guardará en la colección 'valores'.
 */
const ValorSchema = new mongoose.Schema({
    IDSOCIEDAD: { 
        type: Number, 
        required: true 
    },
    IDCEDI: { 
        type: Number, 
        required: true 
    },
    IDETIQUETA: { 
        type: String, 
        required: true 
    },
    IDVALOR: { 
        type: String, 
        required: true 
    },
    IDVALORPA: { 
        type: String, 
        default: null 
    },
    VALOR: { 
        type: String, 
        required: true 
    },
    ALIAS: { 
        type: String 
    },
    SECUENCIA: { 
        type: Number 
    },
    IDVALORSAP: { 
        type: String 
    },
    DESCRIPCION: { 
        type: String 
    },
    IMAGEN: { 
        type: String 
    },
    ROUTE: { 
        type: String 
    },
    // Se anida el objeto de auditoría, reutilizando la misma estructura.
    DETAIL_ROW: { 
        type: DetailRowSchema,
        default: () => ({})
    }
}, {
    // timestamps: true añade automáticamente createdAt y updatedAt.
    timestamps: true 
});

// Se crea y exporta el modelo. MongoDB creará una colección llamada 'valores'.
const valor = mongoose.model('Valor', ValorSchema,'Valor');

export default valor;