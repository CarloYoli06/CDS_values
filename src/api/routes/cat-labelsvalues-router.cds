using {cat as mycat} from '../models/cat-catalago.cds';
using {bit as mybi} from '../models/bit-bitacora.cds';

@impl: 'src/api/controllers/cat-labelsvalues-controller.js'
service LabelsValuesRoute @(path:'/api/cat') {
    entity Etiqueta as projection on mycat.Etiqueta;
    entity Valor as projection on mycat.Valor;
    entity Bitacora as projection on mybi.Bitacora;

    @Core.Description: 'CRUD operations for Labels and Values'
    @path: 'crudLabelsValues'
    action crudLabelsValues(operations: array of mycat.CrudOperation)
    returns Bitacora;
};