module.exports = function(runner, params)
{
    // TODO: expected query strings and parameters

    runner.runTest(
        'POST | message-noToken | 401',
        '/api/data/message',
        'post',
        {"text":"test message","recipientid":"2"},
        null,
        [401],
        null
    );

    runner.runTest(
        'POST | message-missingField | 400',
        '/api/data/message',
        'post',
        {"recipientid":"2"},
        params.user1Token,
        [400],
        null
    );

    runner.runTest(
        'POST | message-user1ToUser2Good | 200',
        '/api/data/message',
        'post',
        {"text":"test message","recipientid":"2"},
        params.user1Token,
        [200],
        null
    );

    runner.runTest(
        'GET | message-user1GetMsg | 200',
        '/api/data/message/public/findbycondition/id/0/1/ownerid=1&recipientid=2',
        'get',
        {"text":"test message","recipientid":"2"},
        params.user1Token,
        [200],
        null
    );

    runner.runTest(
        'GET | message-user2GetMsg | 200',
        '/api/data/message/public/findbycondition/id/0/1/ownerid=1&recipientid=2',
        'get',
        {"text":"test message","recipientid":"2"},
        params.user2Token,
        [200],
        null
    );

    runner.runTest(
        'GET | message-user3GetMsgForbidden | 200',
        '/api/data/message/public/findbycondition/id/0/1/ownerid=1&recipientid=2',
        'get',
        {"text":"test message","recipientid":"2"},
        params.user3Token,
        [200],
        null
    );

    runner.runTest(
        'PUT | message-user2Flag | 200',
        '/api/data/message/21',
        'put',
        {"flagged":"1"},
        params.user2Token,
        [200],
        null
    );

    runner.runTest(
        'PUT | message-user1Unflag | 400',
        '/api/data/message/21',
        'put',
        {"flagged":"0"},
        params.user1Token,
        [400],
        null
    );

    runner.runTest(
        'PUT | message-user1EditMsg | 400',
        '/api/data/message/21',
        'put',
        {"text":"test message edited"},
        params.user1Token,
        [400],
        null
    );

    runner.runTest(
        'PUT | message-user2EditMsg | 400',
        '/api/data/message/21',
        'put',
        {"text":"test message edited"},
        params.user2Token,
        [400],
        null
    );

    runner.runTest(
        'DEL | message-user1DelMsg | 401',
        '/api/data/message/21',
        'delete',
        null,
        params.user1Token,
        [401],
        null
    );
};