namespace cat;

type VALOR2 {
    IDVALOR: String;
    IDETIQUETA: String;
    IDSOCIEDAD: Integer;
    IDCEDI: Integer;
    IDVALORPA: String;
    VALOR: String;
    ALIAS: String;
    SECUENCIA: Integer;
    IDVALORSAP: String;
    DESCRIPTION: String;
    DESCRIPCION: String;
    IMAGEN: String;
    ROUTE: String;
    ETIQUETA: String;
    INDICE: String;
    COLECCION: String;
    SECCION: String;
    id: String;

}

type Valor {
    IDVALOR: String;
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
    ETIQUETA: String;
    INDICE: String;
    COLECCION: String;
    SECCION: String;
    id: String;
    updates:  VALOR2;

}

type CrudOperation {
    collection: String;
    action: String;
    payload: Valor;
}