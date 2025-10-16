namespace bit;

entity Bitacora {
    key ID           : UUID; // Es una buena práctica añadir una clave primaria
    success          : Boolean;
    status           : Integer;
    process          : String;
    messageUSR       : String(255);
    messageDEV       : LargeString;
    countData        : Integer;
    countDataReq     : Integer;
    countDataRes     : Integer;
    countMsgUSR      : Integer;
    countMsgDEV      : Integer;
    dbServer         : String;
    server           : String;
    // Relación de composición: los detalles (data) forman parte de la bitácora
    // y no pueden existir sin ella.
    data             : many DataDetail;
    session          : String;
    loggedUser       : String;
    finalRes         : Boolean;
}

/**
 * ## Tipo Estructurado: DataDetail
 * Define la estructura de cada objeto dentro del array 'data'.
 * No es una entidad porque no necesita existir por sí misma.
 */
type DataDetail {
    success      : Boolean;
    code       : Integer;
    process      : String;
    principal    : Boolean;
    secuencia    : Integer;
    countDataReq : Integer;
    countDataRes : Integer;
    countFile    : Integer;
    messageUSR   : String(255);
    messageDEV   : LargeString;
    method       : String;
    api          : String;
    // Para campos con JSON dinámico, un tipo String es la opción más flexible.
    dataReq      : String default '{}';
    // Se anida la estructura del resultado específico.
    dataRes      : String default '{}';
    file         : String default '[]';
}

