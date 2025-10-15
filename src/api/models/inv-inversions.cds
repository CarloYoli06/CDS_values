namespace inv;

entity priceshistory{
    key ID:     Integer;
        DATE:   DateTime;
        OPEN:   Decimal;
        HIGH:   Decimal;
        LOW:    Decimal;
        CLOSE:  Decimal;
        VOLUME: Decimal;
   
};

entity strategies{
    key ID          :Integer; 
        NAME        : String;
        DESCRIPTION : String;
        TIME        : Time;
        RISK        : Double;
};


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
    dataRes      : PriceHistory;
    file         : String default '[]';
}

/**
 * ## Tipo Estructurado: PriceHistory
 * Define la estructura del objeto 'dataRes', que contiene los datos
 * del precio histórico. Se usan tipos de datos precisos como Decimal.
 */
type PriceHistory {
    _id    : String;
    id     : Integer;
    date   : Timestamp;
    open   : Decimal(12, 5);
    high   : Decimal(12, 5);
    low    : Decimal(12, 5);
    close  : Decimal(12, 5);
    volume : Integer;
}