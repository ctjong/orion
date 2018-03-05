module.exports = function(runner, params)
{
    runner.runTest(
        'POST | item-noToken | 401',
        '/api/data/item',
        'post',
        {"name":"item123","date":"20171234"},
        null,
        [401],
        [{"name":"insertError","params":[]}],
        [{"lastinsertedid":"1"}]
    );

    runner.runTest(
        'POST | item-missingField | 400',
        '/api/data/item',
        'post',
        {"name":"item123"},
        params.user1Token,
        [400],
        [{"name":"insertError","params":[]}]
    );

    runner.runTest(
        'POST | item-goodReqItem1 | 200',
        '/api/data/item',
        'post',
        {"name":"item1","date":"20170101"},
        params.user1Token,
        [200],
        [{"name":"insertItem","params":["item1","20170101","1"]}],
        [{"lastinsertedid":"1"}]
    );

    runner.runTest(
        'POST | item-goodReqItem2 | 200',
        '/api/data/item',
        'post',
        {"name":"item2","date":"20170202"},
        params.user1Token,
        [200],
        [{"name":"insertItem","params":["item2","20170202","1"]}],
        [{"lastinsertedid":"1"}]
    );

    runner.runTest(
        'GET | item-findByIdPublic | 401',
        '/api/data/item/public/findbyid/11',
        'get',
        null,
        params.user1Token,
        [401],
        [{"name":"insertError","params":[]}],
        [{"lastinsertedid":"1"}]
    );

    runner.runTest(
        'GET | item-findByIdPrivateNoToken | 401',
        '/api/data/item/private/findbyid/11',
        'get',
        null,
        null,
        [401],
        [{"name":"insertError","params":[]}],
        [{"lastinsertedid":"1"}]
    );

    runner.runTest(
        'GET | item-findByIdPrivateWrongToken | 200',
        '/api/data/item/private/findbyid/11',
        'get',
        null,
        params.user2Token,
        [200],
        [{"name":"countItemByIdAndOwner","params":["11","2"]},{"name":"selectItemByIdAndOwner","params":["11","2"]}],
        [[{"":"0"}], []]
    );

    runner.runTest(
        'GET | item-findByIdPrivateInvalidToken | 401',
        '/api/data/item/private/findbyid/11',
        'get',
        null,
        "Bearer wrongtokenwrongtokenwrongtokenwrongtokenwrongtoken",
        [401],
        [{"name":"insertError","params":[]}],
        [{"lastinsertedid":"1"}]
    );

    runner.runTest(
        'GET | item-findByIdPrivateGoodToken | 200',
        '/api/data/item/private/findbyid/11',
        'get',
        null,
        params.user1Token,
        [200],
        [{"name":"countItemByIdAndOwner","params":["11","1"]},{"name":"selectItemByIdAndOwner","params":["11","1"]}],
        [[{"":"1"}]]
    );

    runner.runTest(
        'GET | item-findByConditionPrivateNoToken | 401',
        '/api/data/item/private/findbycondition/id/0/2/date%3E20170000',
        'get',
        null,
        null,
        [401],
        [{"name":"insertError","params":[]}],
        [{"lastinsertedid":"1"}]
    );

    runner.runTest(
        'GET | item-findByConditionPrivateGoodTokenByDate | 200',
        '/api/data/item/private/findbycondition/id/0/2/date%3E20170000',
        'get',
        null,
        params.user1Token,
        [200],
        [{"name":"countItemByDateAndOwner","params":["20170000","1"]},{"name":"selectItemByDateAndOwner","params":["20170000","1"]}],
        [[{"":"1"}]]
    );

    runner.runTest(
        'GET | item-findByConditionPrivateGoodTokenByName | 200',
        '/api/data/item/private/findbycondition/id/0/2/name~item1',
        'get',
        null,
        params.user1Token,
        [200],
        [{"name":"countItemByNameAndOwner","params":["%item1%","1"]},{"name":"selectItemByNameAndOwner","params":["%item1%","1"]}],
        [[{"":"1"}]]
    );

    runner.runTest(
        'GET | item-findAllPrivateNotoken | 401',
        '/api/data/item/private/findall/id/0/2',
        'get',
        null,
        null,
        [401],
        [{"name":"insertError","params":[]}],
        [{"lastinsertedid":"1"}]
    );

    runner.runTest(
        'GET | item-findAllPrivateGoodToken | 200',
        '/api/data/item/private/findall/createdtime/0/2',
        'get',
        null,
        params.user1Token,
        [200],
        [{"name":"countItemByOwner","params":["1"]},{"name":"selectItemByOwner","params":["1"]}],
        [[{"":"1"}]]
    );

    runner.runTest(
        'PUT | item-wrongToken | 401',
        '/api/data/item/11',
        'put',
        {"name":"item123"},
        params.user2Token,
        [401],
        [{"name":"selectItemById","params":["11"]}],
        [[{"ownerid":"1"}]]
    );

    runner.runTest(
        'PUT | item-goodToken | 200',
        '/api/data/item/11',
        'put',
        {"name":"item123"},
        params.user1Token,
        [200],
        [{"name":"selectItemById","params":["11"]},{"name":"updateItemById","params":["item123","11"]}],
        [[{"ownerid":"1"}]]
    );

    runner.runTest(
        'GET | item-verifyUpdate | 200',
        '/api/data/item/private/findbyid/11',
        'get',
        null,
        params.user1Token,
        [200],
        [{"name":"countItemByIdAndOwner","params":["11","1"]},{"name":"selectItemByIdAndOwner","params":["11","1"]}],
        [[{"":"1"}]]
    );

    runner.runTest(
        'PUT | item-mixedValidFields | 200',
        '/api/data/item/11',
        'put',
        {"name":"new item","name123":"new invalid item"},
        params.user1Token,
        [200],
        [{"name":"selectItemById","params":["11"]},{"name":"updateItemById","params":["new item","11"]}],
        [[{"ownerid":"1"}]]
    );

    runner.runTest(
        'GET | item-verifyUpdate2 | 200',
        '/api/data/item/private/findbyid/11',
        'get',
        null,
        params.user1Token,
        [200],
        [{"name":"countItemByIdAndOwner","params":["11","1"]},{"name":"selectItemByIdAndOwner","params":["11","1"]}],
        [[{"":"1"}]]
    );

    runner.runTest(
        'DEL | item-wrongToken | 401',
        '/api/data/item/11',
        'delete',
        null,
        params.user2Token,
        [401],
        [{"name":"selectItemById","params":["11"]}],
        [[{"ownerid":"1"}]]
    );

    runner.runTest(
        'DEL | item-item1GoodToken | 200',
        '/api/data/item/11',
        'delete',
        null,
        params.user1Token,
        [200],
        [{"name":"selectItemById","params":["11"]},{"name":"deleteItemById","params":["11"]}],
        [[{"ownerid":"1"}]]
    );

    runner.runTest(
        'DEL | item-item2GoodToken | 200',
        '/api/data/item/12',
        'delete',
        null,
        params.user1Token,
        [200],
        [{"name":"selectItemById","params":["12"]},{"name":"deleteItemById","params":["12"]}],
        [[{"ownerid":"1"}]]
    );

    runner.runTest(
        'DEL | item-item2DoubleDel | 400',
        '/api/data/item/12',
        'delete',
        null,
        params.user1Token,
        [400],
        [{"name":"selectItemById","params":["12"]}]
    );

    runner.runTest(
        'GET | item-item1VerifyDelete | 200',
        '/api/data/item/private/findbyid/11',
        'get',
        null,
        params.user1Token,
        [200],
        [{"name":"countItemByIdAndOwner","params":["11","1"]},{"name":"selectItemByIdAndOwner","params":["11","1"]}],
        [[{"":"1"}]]
    );
};