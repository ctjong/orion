module.exports = function(orion, chai, runner, name, config, mockConnectionPool)
{
    var orionApp;

    beforeEach(function(done)
    {
        if(!!orionApp)
        {
            done();
            return;
        }

        runner.disableConsole();
        orionApp = new orion(config);
        orionApp.setupApiEndpoints();
        orionApp.getDatabaseAdapter().setConnectionPool(mockConnectionPool);
        orionApp.start(1337, function()
        {
            runner.enableStdout();
            done();
        });
        runner.startNewSession(orionApp, mockConnectionPool, null);
    });

    describe(name, function()
    {
        runner.runTest('POST | error-valid | 200', '/api/error', 'post', {"msg":"test error"}, null, [200], null, null);
        runner.runTest('GET | null-wrongEntity | 400', '/api/data/item2/public/findbyid/10', 'get', null, null, [400], null, null);
        runner.runTest('POST | user-newUserInvalidEmail | 400', '/api/data/user', 'post', {"username":"testuser","password":"testpassword","confirmPassword":"testpassword","email":"invalidemail","firstName":"firstName","lastName":"lastName"}, null, [400], null, null);
        runner.runTest('POST | user-newUserPwdMismatch | 400', '/api/data/user', 'post', {"username":"testuser","password":"testpassword","email":"test@test.com","firstName":"firstName","lastName":"lastName"}, null, [400], null, null);
        runner.runTest('POST | user-newUserPwdNotMeetReqs | 400', '/api/data/user', 'post', {"username":"testuser","password":"test","confirmPassword":"test","email":"test@test.com","firstName":"firstName","lastName":"lastName"}, null, [400], null, null);
        runner.runTest('POST | user-newUserGoodReqUser1 | 200/500', '/api/data/user', 'post', {"username":"user1","password":"testpassword","confirmPassword":"testpassword","email":"test@test.com","firstName":"gavin","lastName":"belson"}, null, [200,500], null, null);
        runner.runTest('POST | user-newUserUser1Duplicate | 500', '/api/data/user', 'post', {"username":"user1","password":"testpassword","confirmPassword":"testpassword","email":"test@test.com","firstName":"gavin","lastName":"belson"}, null, [500], null, null);
        runner.runTest('POST | user-newUserGoodReqUser2 | 200/500', '/api/data/user', 'post', {"username":"user2","password":"testpassword","confirmPassword":"testpassword","email":"test@test.com","firstName":"peter","lastName":"gregory"}, null, [200,500], null, null);
        runner.runTest('POST | user-newUserGoodReqUser3 | 200/500', '/api/data/user', 'post', {"username":"user3","password":"testpassword","confirmPassword":"testpassword","email":"test@test.com","firstName":"brian","lastName":"griffin"}, null, [200,500], null, null);
        runner.runTest('POST | token-wrongPassword | 400', '/api/auth/token', 'post', {"username":"user1","password":"testpassword123"}, null, [400], null, null);
        runner.runTest('POST | token-wrongUserName | 400', '/api/auth/token', 'post', {"username":"invaliduser","password":"testpassword"}, null, [400], null, null);
        runner.runTest('POST | token-goodReqUser1 | 200', '/api/auth/token', 'post', {"username":"user1","password":"testpassword"}, null, [200], null, null);
        runner.runTest('POST | token-goodReqUser2 | 200', '/api/auth/token', 'post', {"username":"user2","password":"testpassword"}, null, [200], null, null);
        runner.runTest('POST | token-goodReqUser3 | 200', '/api/auth/token', 'post', {"username":"user3","password":"testpassword"}, null, [200], null, null);
        runner.runTest('GET | user-findAllPrivateUser1 | 200', '/api/data/user/private/findall/id/0/1', 'get', {"username":"testuser","password":"testpassword","confirmPassword":"testpassword","email":"test@test.com","firstName":"firstName","lastName":"lastName"}, ' authtoken', [200], null, null);
        runner.runTest('GET | user-findByIdPrivateUser1 | 200', '/api/data/user/private/findbyid/{{user1id}}', 'get', {"username":"testuser","password":"testpassword","confirmPassword":"testpassword","email":"test@test.com","firstName":"firstName","lastName":"lastName"}, ' authtoken', [200], null, null);
        runner.runTest('GET | user-findByIdPrivateUser2 | 401', '/api/data/user/private/findbyid/2', 'get', {"username":"testuser","password":"testpassword","confirmPassword":"testpassword","email":"test@test.com","firstName":"firstName","lastName":"lastName"}, ' authtoken', [401], null, null);
        runner.runTest('PUT | user-user1EditUser2Data | 401', '/api/data/user/{{user2id}}', 'put', {"firstName":"eddard","lastName":"stark"}, ' authtoken', [401], null, null);
        runner.runTest('PUT | user-user1EditUser1Data | 200', '/api/data/user/{{user1id}}', 'put', {"firstName":"catelyn","lastName":"tully"}, ' authtoken', [200], null, null);
        runner.runTest('GET | user-verifyUser1Update | 200', '/api/data/user/private/findbyid/{{user1id}}', 'get', {"username":"testuser","password":"testpassword","confirmPassword":"testpassword","email":"test@test.com","firstName":"firstName","lastName":"lastName"}, ' authtoken', [200], null, null);
        runner.runTest('DEL | user-user1DelUser1 | 401', '/api/data/user/{{user1id}}', 'delete', null, ' authtoken', [401], null, null);
        runner.runTest('POST | item-noToken | 401', '/api/data/item', 'post', {"name":"item123","date":"20171234"}, null, [401], null, null);
        runner.runTest('POST | item-missingField | 400', '/api/data/item', 'post', {"name":"item123"}, ' authtoken', [400], null, null);
        runner.runTest('POST | item-goodReqItem1 | 200', '/api/data/item', 'post', {"name":"item1","date":"20170101"}, ' authtoken', [200], null, null);
        runner.runTest('POST | item-goodReqItem2 | 200', '/api/data/item', 'post', {"name":"item2","date":"20170202"}, ' authtoken', [200], null, null);
        runner.runTest('GET | item-findByIdPublic | 401', '/api/data/item/public/findbyid/{{item1id}}', 'get', null, ' authtoken', [401], null, null);
        runner.runTest('GET | item-findByIdPrivateNoToken | 401', '/api/data/item/private/findbyid/{{item1id}}', 'get', null, null, [401], null, null);
        runner.runTest('GET | item-findByIdPrivateWrongToken | 401', '/api/data/item/private/findbyid/{{item1id}}', 'get', null, ' authtoken2', [401], null, null);
        runner.runTest('GET | item-findByIdPrivateInvalidToken | 401', '/api/data/item/private/findbyid/{{item1id}}', 'get', null, ' wrongtokenwrongtokenwrongtokenwrongtokenwrongtoken', [401], null, null);
        runner.runTest('GET | item-findByIdPrivateGoodToken | 200', '/api/data/item/private/findbyid/{{item1id}}', 'get', null, ' authtoken', [200], null, null);
        runner.runTest('GET | item-findByConditionPrivateNoToken | 401', '/api/data/item/private/findbycondition/id/0/2/date%3E20170000', 'get', null, null, [401], null, null);
        runner.runTest('GET | item-findByConditionPrivateGoodTokenByDate | 200', '/api/data/item/private/findbycondition/id/0/2/date%3E20170000', 'get', null, ' authtoken', [200], null, null);
        runner.runTest('GET | item-findByConditionPrivateGoodTokenByName | 200', '/api/data/item/private/findbycondition/id/0/2/name~item1', 'get', null, ' authtoken', [200], null, null);
        runner.runTest('GET | item-findAllPrivateNotoken | 401', '/api/data/item/private/findall/id/0/2', 'get', null, null, [401], null, null);
        runner.runTest('GET | item-findAllPrivateGoodToken | 200', '/api/data/item/private/findall/createdtime/0/2', 'get', null, ' authtoken', [200], null, null);
        runner.runTest('PUT | item-wrongToken | 401', '/api/data/item/{{item1id}}', 'put', {"name":"item123"}, ' authtoken2', [401], null, null);
        runner.runTest('PUT | item-goodToken | 200', '/api/data/item/{{item1id}}', 'put', {"name":"item123"}, ' authtoken', [200], null, null);
        runner.runTest('GET | item-verifyUpdate | 200', '/api/data/item/private/findbyid/{{item1id}}', 'get', null, ' authtoken', [200], null, null);
        runner.runTest('PUT | item-mixedValidFields | 200', '/api/data/item/{{item1id}}', 'put', {"name":"new item","name123":"new invalid item"}, ' authtoken', [200], null, null);
        runner.runTest('GET | item-verifyUpdate2 | 200', '/api/data/item/private/findbyid/{{item1id}}', 'get', null, ' authtoken', [200], null, null);
        runner.runTest('DEL | item-wrongToken | 401', '/api/data/item/{{item1id}}', 'delete', null, ' authtoken2', [401], null, null);
        runner.runTest('DEL | item-item1GoodToken | 200', '/api/data/item/{{item1id}}', 'delete', null, ' authtoken', [200], null, null);
        runner.runTest('DEL | item-item2GoodToken | 200', '/api/data/item/{{item2id}}', 'delete', null, ' authtoken', [200], null, null);
        runner.runTest('DEL | item-item2DoubleDel | 400', '/api/data/item/{{item2id}}', 'delete', null, ' authtoken', [400], null, null);
        runner.runTest('GET | item-item1VerifyDelete | 200', '/api/data/item/private/findbyid/{{item1id}}', 'get', null, ' authtoken', [200], null, null);
        runner.runTest('POST | message-noToken | 401', '/api/data/message', 'post', {"text":"test message","recipientid":"{{user2Id}}"}, null, [401], null, null);
        runner.runTest('POST | message-missingField | 400', '/api/data/message', 'post', {"recipientid":"{{user2id}}"}, ' authtoken', [400], null, null);
        runner.runTest('POST | message-user1ToUser2Good | 200', '/api/data/message', 'post', {"text":"test message","recipientid":"{{user2id}}"}, ' authtoken', [200], null, null);
        runner.runTest('GET | message-user1GetMsg | 200', '/api/data/message/public/findbycondition/id/0/1/ownerid={{user1id}}&recipientid={{user2id}}', 'get', {"text":"test message","recipientid":"{{user2Id}}"}, ' authtoken', [200], null, null);
        runner.runTest('GET | message-user2GetMsg | 200', '/api/data/message/public/findbycondition/id/0/1/ownerid={{user1id}}&recipientid={{user2id}}', 'get', {"text":"test message","recipientid":"{{user2Id}}"}, ' authtoken2', [200], null, null);
        runner.runTest('GET | message-user3GetMsgForbidden | 200', '/api/data/message/public/findbycondition/id/0/1/ownerid={{user1id}}&recipientid={{user2id}}', 'get', {"text":"test message","recipientid":"{{user2Id}}"}, ' authtoken3', [200], null, null);
        runner.runTest('PUT | message-user2Flag | 200', '/api/data/message/{{messageId}}', 'put', {"flagged":"1"}, ' authtoken2', [200], null, null);
        runner.runTest('PUT | message-user1Unflag | 400', '/api/data/message/{{messageId}}', 'put', {"flagged":"0"}, ' authtoken', [400], null, null);
        runner.runTest('PUT | message-user1EditMsg | 400', '/api/data/message/{{messageId}}', 'put', {"text":"test message edited"}, ' authtoken', [400], null, null);
        runner.runTest('PUT | message-user2EditMsg | 400', '/api/data/message/{{messageId}}', 'put', {"text":"test message edited"}, ' authtoken2', [400], null, null);
        runner.runTest('DEL | message-user1DelMsg | 401', '/api/data/message/{{messageId}}', 'delete', null, ' authtoken', [401], null, null);
    });
};