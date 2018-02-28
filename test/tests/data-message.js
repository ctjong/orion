module.exports = function(runner, params)
{
    //TODO: query params

    runner.runTest(
        'POST | message-noToken | 401',
        '/api/data/message',
        'post',
        {"text":"test message","recipientid":"2"},
        null,
        [401],
        [{"name":"insertError","params":[]}]
    );

    runner.runTest(
        'POST | message-missingField | 400',
        '/api/data/message',
        'post',
        {"recipientid":"2"},
        params.user1Token,
        [400],
        [{"name":"selectUserDataById3","params":[]},{"name":"selectUserDataById3","params":[]}]
    );

    runner.runTest(
        'POST | message-user1ToUser2Good | 200',
        '/api/data/message',
        'post',
        {"text":"test message","recipientid":"2"},
        params.user1Token,
        [200],
        [{"name":"selectUserDataById3","params":[]},{"name":"selectUserDataById3","params":[]},{"name":"insertMessage","params":[]}]
    );

    runner.runTest(
        'GET | message-user1GetMsg | 200',
        '/api/data/message/public/findbycondition/id/0/1/ownerid=1&recipientid=2',
        'get',
        {"text":"test message","recipientid":"2"},
        params.user1Token,
        [200],
        [{"name":"countMessageByOwnerAndRecipient","params":[]},{"name":"selectMessageByOwnerAndRecipient","params":[]}]
    );

    runner.runTest(
        'GET | message-user2GetMsg | 200',
        '/api/data/message/public/findbycondition/id/0/1/ownerid=1&recipientid=2',
        'get',
        {"text":"test message","recipientid":"2"},
        params.user2Token,
        [200],
        [{"name":"countMessageByOwnerAndRecipient","params":[]},{"name":"selectMessageByOwnerAndRecipient","params":[]}]
    );

    runner.runTest(
        'GET | message-user3GetMsgForbidden | 200',
        '/api/data/message/public/findbycondition/id/0/1/ownerid=1&recipientid=2',
        'get',
        {"text":"test message","recipientid":"2"},
        params.user3Token,
        [200],
        [{"name":"countMessageByOwnerAndRecipient","params":[]},{"name":"selectMessageByOwnerAndRecipient","params":[]}]
    );

    runner.runTest(
        'PUT | message-user2Flag | 200',
        '/api/data/message/21',
        'put',
        {"flagged":"1"},
        params.user2Token,
        [200],
        [{"name":"selectMessageById","params":[]},{"name":"updateMessageById","params":[]}]
    );

    runner.runTest(
        'PUT | message-user1Unflag | 400',
        '/api/data/message/21',
        'put',
        {"flagged":"0"},
        params.user1Token,
        [400],
        [{"name":"selectMessageById","params":[]}]
    );

    runner.runTest(
        'PUT | message-user1EditMsg | 400',
        '/api/data/message/21',
        'put',
        {"text":"test message edited"},
        params.user1Token,
        [400],
        [{"name":"selectMessageById","params":[]}]
    );

    runner.runTest(
        'PUT | message-user2EditMsg | 400',
        '/api/data/message/21',
        'put',
        {"text":"test message edited"},
        params.user2Token,
        [400],
        [{"name":"selectMessageById","params":[]}]
    );
};