namespace det;

/**
 * ## Tipo Estructurado: DetailReg
 * Define la estructura anidada para el historial de registros.
 * Corresponde al objeto dentro del array DETAIL_ROW_REG.
 */
type DetailReg {
    CURRENT : Boolean;
    REGDATE : Timestamp; // El tipo Timestamp maneja fechas y horas.
    REGTIME : Time;
    REGUSER : String;
}

/**
 * ## Tipo Estructurado: DetailRow
 * Estructura que contiene el estado del registro (activo/borrado)
 * y el historial de cambios.
 */
type DetailRow {
    ACTIVED        : Boolean;
    DELETED        : Boolean;
    // Una composición para modelar el array de registros anidados.
    DETAIL_ROW_REG : array of DetailReg;
}