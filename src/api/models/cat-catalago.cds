namespace cat;

entity Etiqueta {
    key IDETIQUETA: String;
    IDSOCIEDAD: Integer;
    IDCEDI: Integer;
    ETIQUETA: String;
    INDICE: String;
    COLECCION: String;
    SECCION: String;
    SECUENCIA: Integer;
    IMAGEN: String;
    ROUTE: String;
    DESCRIPTION: String;
}

entity Valor {
    key IDVALOR: String;
    IDETIQUETA: String;
    IDSOCIEDAD: Integer;
    IDCEDI: Integer;
    IDVALORPA: String;
    VALOR: String;
    ALIAS: String;
    SECUENCIA: Integer;
    IDVALORSAP: String;
    DESCRIPCION: String;
    IMAGEN: String;
    ROUTE: String;
}

type CrudOperation {
    collection: String;
    action: String;
    payload: String;
}