// models/mongodb/Etiqueta.js

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
 * ## EtiquetaSchema (Modelo Principal)
 * Representa la etiqueta o categoría principal que se guardará en la 
 * colección 'etiquetas'.
 */
const EtiquetaSchema = new mongoose.Schema({
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
        required: true,
        unique: true // Es buena práctica asegurar que sea único
    },
    ETIQUETA: { 
        type: String, 
        required: true 
    },
    INDICE: { 
        type: String 
    },
    COLECCION: { 
        type: String 
    },
    SECCION: { 
        type: String 
    },
    SECUENCIA: { 
        type: Number 
    },
    IMAGEN: { 
        type: String 
    },
    ROUTE: { 
        type: String 
    },
    DESCRIPCION: { 
        type: String 
    },
    // Se anida el objeto de auditoría. No es un array.
    DETAIL_ROW: { 
        type: DetailRowSchema,
        default: () => ({})
    }
}, {
    // timestamps: true añade automáticamente createdAt y updatedAt.
    timestamps: true 
});

// Se crea y exporta el modelo. MongoDB creará una colección llamada 'etiquetas'.
const etiqueta = mongoose.model('Etiqueta', EtiquetaSchema,'Etiqueta');

export default etiqueta;