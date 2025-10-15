//import model
using {inv as myph} from '../models/inv-inversions';

@impl: 'src/api/controllers/inv-priceshistory-controller.js'
service PricesHistoryRoute @(path:'/api/inv') {
    //instance the entity
    entity priceshistory as projection on myph.priceshistory;
    entity strategies as projection on myph.strategies;
    entity Bitacora as projection on myph.Bitacora;

    //MARL: Ger Some Prices History
    //localhost:3333 /api/priceshistory/getall
    @Core.Description:'get-all-prices-history'
    @path : 'getall'
    function getall()
    returns array of Bitacora;

    @Core.Description: 'add-one-prices-history'
    @path: 'addone'
    action addone(prices:priceshistory) returns Bitacora;

    @Core.Description: 'update-one-prices-history'
    @path: 'updateone'
    action updateone(price:priceshistory) 
    returns Bitacora;

    @Core.Description: 'delete-one-prices-history'
    @path: 'deleteone'
    function deleteone() 
    returns Bitacora;
};
