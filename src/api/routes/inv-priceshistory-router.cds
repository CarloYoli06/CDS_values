//import model
using {inv as myph} from '../models/inv-inversions';
using {bit as mybi} from '../models/bit-bitacora';

@impl: 'src/api/controllers/inv-priceshistory-controller.js'
service PricesHistoryRoute @(path:'/api/inv') {
    //instance the entity
    entity priceshistory as projection on myph.priceshistory;
    entity strategies as projection on myph.strategies;
    entity Bitacora as projection on mybi.Bitacora;

    @Core.Description: 'CRUD operations for Prices History'
    @path: 'crudPricesHistory'
    action crudPricesHistory(prices: array of priceshistory, price: priceshistory)
    returns Bitacora;
};