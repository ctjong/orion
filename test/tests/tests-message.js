module.exports = function(runner, params)
{
    runner.runTest(
        'POST | message-noToken | 401',
        '/api/data/message',
        'post',
        {"text":"test message","recipientid":"2"},
        null,
        [{"name":"insertError","params":[]}],
        [{"lastinsertedid":"1"}],
        401
    );

    runner.runTest(
        'POST | message-missingField | 400',
        '/api/data/message',
        'post',
        {"recipientid":"2"},
        params.user1Token,
        [{"name":"selectUserDataById3","params":["2"]}],
        null,
        400
    );

    runner.runTest(
        'POST | message-user1ToUser2Good | 200',
        '/api/data/message',
        'post',
        {"text":"test message","recipientid":"2"},
        params.user1Token,
        [{"name":"selectUserDataById3","params":["2"]},{"name":"insertMessage","params":[]}],
        [[],[],{"lastinsertedid":"1"}],
        200
    );

    runner.runTest(
        'GET | message-user1GetMsg | 200',
        '/api/data/message/public/findbycondition/id/0/1/ownerid=1&recipientid=2',
        'get',
        {"text":"test message","recipientid":"2"},
        params.user1Token,
        [{"name":"countMessageByOwnerAndRecipient","params":["1","2","1","1"]},{"name":"selectMessageByOwnerAndRecipient","params":["1","2","1","1"]}],
        [[{"":"1"}]],
        200
    );

    runner.runTest(
        'GET | message-user2GetMsg | 200',
        '/api/data/message/public/findbycondition/id/0/1/ownerid=1&recipientid=2',
        'get',
        {"text":"test message","recipientid":"2"},
        params.user2Token,
        [{"name":"countMessageByOwnerAndRecipient","params":["1","2","2","2"]},{"name":"selectMessageByOwnerAndRecipient","params":["1","2","2","2"]}],
        [[{"":"1"}]],
        200
    );

    runner.runTest(
        'GET | message-user3GetMsgForbidden | 200',
        '/api/data/message/public/findbycondition/id/0/1/ownerid=1&recipientid=2',
        'get',
        {"text":"test message","recipientid":"2"},
        params.user3Token,
        [{"name":"countMessageByOwnerAndRecipient","params":["1","2","3","3"]},{"name":"selectMessageByOwnerAndRecipient","params":["1","2","3","3"]}],
        [[{"":"1"}]],
        200
    );

    runner.runTest(
        'PUT | message-user2Flag | 200',
        '/api/data/message/21',
        'put',
        {"flagged":"1"},
        params.user2Token,
        [{"name":"selectMessageById","params":["21"]},{"name":"updateMessageById","params":["1","21"]}],
        [[{"ownerid":"1","recipientid":"2"}]],
        200
    );

    runner.runTest(
        'PUT | message-user1Unflag | 400',
        '/api/data/message/21',
        'put',
        {"flagged":"0"},
        params.user1Token,
        [{"name":"selectMessageById","params":["21"]}],
        [[{"ownerid":"1","recipientid":"2"}]],
        400
    );

    runner.runTest(
        'PUT | message-user1EditMsg | 400',
        '/api/data/message/21',
        'put',
        {"text":"test message edited"},
        params.user1Token,
        [{"name":"selectMessageById","params":["21"]}],
        [[{"ownerid":"1","recipientid":"2"}]],
        400
    );

    runner.runTest(
        'PUT | message-user2EditMsg | 400',
        '/api/data/message/21',
        'put',
        {"text":"test message edited"},
        params.user2Token,
        [{"name":"selectMessageById","params":["21"]}],
        [[{"ownerid":"1","recipientid":"2"}]],
        400
    );
};