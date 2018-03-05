module.exports = function(runner, params)
{
    runner.runTest(
        'POST | item-noToken | 401',
        '/api/data/item',
        'post',
        {"name":"item123","date":"20171234"},
        null,
        [{"name":"insertError","params":[]}],
        [{"lastinsertedid":"1"}],
        401
    );

    runner.runTest(
        'POST | item-missingField | 400',
        '/api/data/item',
        'post',
        {"name":"item123"},
        params.user1Token,
        [{"name":"insertError","params":[]}],
        null,
        400
    );

    runner.runTest(
        'POST | item-goodReqItem1 | 200',
        '/api/data/item',
        'post',
        {"name":"item1","date":"20170101"},
        params.user1Token,
        [{"name":"insertItem","params":["item1","20170101","1"]}],
        [{"lastinsertedid":"123"}],
        200,
        "123"
    );

    runner.runTest(
        'POST | item-goodReqItem2 | 200',
        '/api/data/item',
        'post',
        {"name":"item2","date":"20170202"},
        params.user1Token,
        [{"name":"insertItem","params":["item2","20170202","1"]}],
        [{"lastinsertedid":"123"}],
        200,
        "123"
    );

    runner.runTest(
        'GET | item-findByIdPublic | 401',
        '/api/data/item/public/findbyid/11',
        'get',
        null,
        params.user1Token,
        [{"name":"insertError","params":[]}],
        [{"lastinsertedid":"1"}],
        401
    );

    runner.runTest(
        'GET | item-findByIdPrivateNoToken | 401',
        '/api/data/item/private/findbyid/11',
        'get',
        null,
        null,
        [{"name":"insertError","params":[]}],
        [{"lastinsertedid":"1"}],
        401
    );

    runner.runTest(
        'GET | item-findByIdPrivateWrongToken | 200',
        '/api/data/item/private/findbyid/11',
        'get',
        null,
        params.user2Token,
        [{"name":"countItemByIdAndOwner","params":["11","2"]},{"name":"selectItemByIdAndOwner","params":["11","2"]}],
        [{"count":"0"}, []],
        200,
        {"count":0}
    );

    runner.runTest(
        'GET | item-findByIdPrivateInvalidToken | 401',
        '/api/data/item/private/findbyid/11',
        'get',
        null,
        "Bearer wrongtokenwrongtokenwrongtokenwrongtokenwrongtoken",
        [{"name":"insertError","params":[]}],
        [{"lastinsertedid":"1"}],
        401
    );

    runner.runTest(
        'GET | item-findByIdPrivateGoodToken | 200',
        '/api/data/item/private/findbyid/11',
        'get',
        null,
        params.user1Token,
        [{"name":"countItemByIdAndOwner","params":["11","1"]},{"name":"selectItemByIdAndOwner","params":["11","1"]}],
        [{"count":"1"},[{"name":"item1","ownerid":"1"}]],
        200,
        {"count":1,"items":[{"name":"item1","ownerid":"1"}]}
    );

    runner.runTest(
        'GET | item-findByConditionPrivateNoToken | 401',
        '/api/data/item/private/findbycondition/id/0/2/date%3E20170000',
        'get',
        null,
        null,
        [{"name":"insertError","params":[]}],
        [{"lastinsertedid":"1"}],
        401
    );

    runner.runTest(
        'GET | item-findByConditionPrivateGoodTokenByDate | 200',
        '/api/data/item/private/findbycondition/id/0/2/date%3E20170000',
        'get',
        null,
        params.user1Token,
        [{"name":"countItemByDateAndOwner","params":["20170000","1"]},{"name":"selectItemByDateAndOwner","params":["20170000","1"]}],
        [{"count":"1"},[{"name":"item1","ownerid":"1"}]],
        200,
        {"count":1,"items":[{"name":"item1","ownerid":"1"}]}
    );

    runner.runTest(
        'GET | item-findByConditionPrivateGoodTokenByName | 200',
        '/api/data/item/private/findbycondition/id/0/2/name~item1',
        'get',
        null,
        params.user1Token,
        [{"name":"countItemByNameAndOwner","params":["%item1%","1"]},{"name":"selectItemByNameAndOwner","params":["%item1%","1"]}],
        [{"count":"1"},[{"name":"item1","ownerid":"1"}]],
        200,
        {"count":1,"items":[{"name":"item1","ownerid":"1"}]}
    );

    runner.runTest(
        'GET | item-findAllPrivateNotoken | 401',
        '/api/data/item/private/findall/id/0/2',
        'get',
        null,
        null,
        [{"name":"insertError","params":[]}],
        [{"lastinsertedid":"1"}],
        401
    );

    runner.runTest(
        'GET | item-findAllPrivateGoodToken | 200',
        '/api/data/item/private/findall/createdtime/0/2',
        'get',
        null,
        params.user1Token,
        [{"name":"countItemByOwner","params":["1"]},{"name":"selectItemByOwner","params":["1"]}],
        [{"count":"1"},[{"name":"item1","ownerid":"1"}]],
        200,
        {"count":1,"items":[{"name":"item1","ownerid":"1"}]}
    );

    runner.runTest(
        'PUT | item-wrongToken | 401',
        '/api/data/item/11',
        'put',
        {"name":"item123"},
        params.user2Token,
        [{"name":"selectItemById","params":["11"]}],
        [[{"ownerid":"1"}]],
        401
    );

    runner.runTest(
        'PUT | item-goodToken | 200',
        '/api/data/item/11',
        'put',
        {"name":"item123"},
        params.user1Token,
        [{"name":"selectItemById","params":["11"]},{"name":"updateItemById","params":["item123","11"]}],
        [[{"ownerid":"1"}]],
        200
    );

    runner.runTest(
        'PUT | item-mixedValidFields | 200',
        '/api/data/item/11',
        'put',
        {"name":"new item","name123":"new invalid item"},
        params.user1Token,
        [{"name":"selectItemById","params":["11"]},{"name":"updateItemById","params":["new item","11"]}],
        [[{"ownerid":"1"}]],
        200
    );

    runner.runTest(
        'DEL | item-wrongToken | 401',
        '/api/data/item/11',
        'delete',
        null,
        params.user2Token,
        [{"name":"selectItemById","params":["11"]}],
        [[{"ownerid":"1"}]],
        401
    );

    runner.runTest(
        'DEL | item-item1GoodToken | 200',
        '/api/data/item/11',
        'delete',
        null,
        params.user1Token,
        [{"name":"selectItemById","params":["11"]},{"name":"deleteItemById","params":["11"]}],
        [[{"ownerid":"1"}]],
        200
    );

    runner.runTest(
        'DEL | item-item2GoodToken | 200',
        '/api/data/item/12',
        'delete',
        null,
        params.user1Token,
        [{"name":"selectItemById","params":["12"]},{"name":"deleteItemById","params":["12"]}],
        [[{"ownerid":"1"}]],
        200
    );

    runner.runTest(
        'DEL | item-item2DoubleDel | 400',
        '/api/data/item/12',
        'delete',
        null,
        params.user1Token,
        [{"name":"selectItemById","params":["12"]}],
        null,
        400
    );
};