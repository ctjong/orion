module.exports = function(runner, params)
{
    // TODO: expected query strings and parameters

    runner.runTest(
        'POST | user-newUserInvalidEmail | 400',
        '/api/data/user',
        'post',
        {"username":"testuser","password":"testpassword","confirmPassword":"testpassword","email":"invalidemail","firstName":"firstName","lastName":"lastName"},
        null,
        [400],
        null
    );

    runner.runTest(
        'POST | user-newUserPwdMismatch | 400',
        '/api/data/user',
        'post',
        {"username":"testuser","password":"testpassword","email":"test@test.com","firstName":"firstName","lastName":"lastName"},
        null,
        [400],
        null
    );

    runner.runTest(
        'POST | user-newUserPwdNotMeetReqs | 400',
        '/api/data/user',
        'post',
        {"username":"testuser","password":"test","confirmPassword":"test","email":"test@test.com","firstName":"firstName","lastName":"lastName"},
        null,
        [400],
        null
    );

    runner.runTest(
        'POST | user-newUserGoodReqUser1 | 200/500',
        '/api/data/user',
        'post',
        {"username":"user1","password":"testpassword","confirmPassword":"testpassword","email":"test@test.com","firstName":"gavin","lastName":"belson"},
        null,
        [200,500],
        null
    );

    runner.runTest(
        'POST | user-newUserUser1Duplicate | 500',
        '/api/data/user',
        'post',
        {"username":"user1","password":"testpassword","confirmPassword":"testpassword","email":"test@test.com","firstName":"gavin","lastName":"belson"},
        null,
        [500],
        null
    );

    runner.runTest(
        'POST | user-newUserGoodReqUser2 | 200/500',
        '/api/data/user',
        'post',
        {"username":"user2","password":"testpassword","confirmPassword":"testpassword","email":"test@test.com","firstName":"peter","lastName":"gregory"},
        null,
        [200,500],
        null
    );

    runner.runTest(
        'POST | user-newUserGoodReqUser3 | 200/500',
        '/api/data/user',
        'post',
        {"username":"user3","password":"testpassword","confirmPassword":"testpassword","email":"test@test.com","firstName":"brian","lastName":"griffin"},
        null,
        [200,500],
        null
    );

    runner.runTest(
        'POST | token-wrongPassword | 400',
        '/api/auth/token',
        'post',
        {"username":"user1","password":"testpassword123"},
        null,
        [400],
        null
    );

    runner.runTest(
        'POST | token-wrongUserName | 400',
        '/api/auth/token',
        'post',
        {"username":"invaliduser","password":"testpassword"},
        null,
        [400],
        null
    );

    runner.runTest(
        'POST | token-goodReqUser1 | 200',
        '/api/auth/token',
        'post',
        {"username":"user1","password":"testpassword"},
        null,
        [200],
        null
    );

    runner.runTest(
        'POST | token-goodReqUser2 | 200',
        '/api/auth/token',
        'post',
        {"username":"user2","password":"testpassword"},
        null,
        [200],
        null
    );

    runner.runTest(
        'POST | token-goodReqUser3 | 200',
        '/api/auth/token',
        'post',
        {"username":"user3","password":"testpassword"},
        null,
        [200],
        null
    );

    runner.runTest(
        'GET | user-findAllPrivateUser1 | 200',
        '/api/data/user/private/findall/id/0/1',
        'get',
        {"username":"testuser","password":"testpassword","confirmPassword":"testpassword","email":"test@test.com","firstName":"firstName","lastName":"lastName"},
        params.user1Token,
        [200],
        null
    );

    runner.runTest(
        'GET | user-findByIdPrivateUser1 | 200',
        '/api/data/user/private/findbyid/1',
        'get',
        {"username":"testuser","password":"testpassword","confirmPassword":"testpassword","email":"test@test.com","firstName":"firstName","lastName":"lastName"},
        params.user1Token,
        [200],
        null
    );

    runner.runTest(
        'GET | user-findByIdPrivateUser2 | 401',
        '/api/data/user/private/findbyid/2',
        'get',
        {"username":"testuser","password":"testpassword","confirmPassword":"testpassword","email":"test@test.com","firstName":"firstName","lastName":"lastName"},
        params.user1Token,
        [401],
        null
    );

    runner.runTest(
        'PUT | user-user1EditUser2Data | 401',
        '/api/data/user/2',
        'put',
        {"firstName":"eddard","lastName":"stark"},
        params.user1Token,
        [401],
        null
    );

    runner.runTest(
        'PUT | user-user1EditUser1Data | 200',
        '/api/data/user/1',
        'put',
        {"firstName":"catelyn","lastName":"tully"},
        params.user1Token,
        [200],
        null
    );

    runner.runTest(
        'GET | user-verifyUser1Update | 200',
        '/api/data/user/private/findbyid/1',
        'get',
        {"username":"testuser","password":"testpassword","confirmPassword":"testpassword","email":"test@test.com","firstName":"firstName","lastName":"lastName"},
        params.user1Token,
        [200],
        null
    );

    runner.runTest(
        'DEL | user-user1DelUser1 | 401',
        '/api/data/user/1',
        'delete',
        null,
        params.user1Token,
        [401],
        null
    );
};