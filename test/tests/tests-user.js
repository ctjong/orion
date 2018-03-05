module.exports = function(runner, params)
{
    runner.runTest(
        'POST | user-newUserInvalidEmail | 400',
        '/api/data/user',
        'post',
        {"username":"testuser","password":"testpassword","confirmPassword":"testpassword","email":"invalidemail","firstName":"firstName","lastName":"lastName"},
        null,
        [400],
        [{"name":"insertError","params":[]}],
        [{"lastinsertedid":"1"}]
    );

    runner.runTest(
        'POST | user-newUserPwdMismatch | 400',
        '/api/data/user',
        'post',
        {"username":"testuser","password":"testpassword","email":"test@test.com","firstName":"firstName","lastName":"lastName"},
        null,
        [400],
        [{"name":"insertError","params":[]}],
        [{"lastinsertedid":"1"}]
    );

    runner.runTest(
        'POST | user-newUserPwdNotMeetReqs | 400',
        '/api/data/user',
        'post',
        {"username":"testuser","password":"test","confirmPassword":"test","email":"test@test.com","firstName":"firstName","lastName":"lastName"},
        null,
        [400],
        [{"name":"insertError","params":[]}],
        [{"lastinsertedid":"1"}]
    );

    runner.runTest(
        'POST | user-newUserGoodReqUser1 | 200',
        '/api/data/user',
        'post',
        {"username":"user1","password":"testpassword","confirmPassword":"testpassword","email":"test@test.com","firstName":"gavin","lastName":"belson"},
        null,
        [200],
        //[username],[password],[email],[firstname],[lastname],[roles],[domain],[createdtime]
        [{"name":"selectUserNameByUserName","params":["user1"]},{"name":"insertUser","params":["user1",params.hashedPassword,"test@test.com","gavin","belson","member","local"]}],
        [[],{"lastinsertedid":"1"}]
    );

    runner.runTest(
        'POST | user-newUserUser1Duplicate | 500',
        '/api/data/user',
        'post',
        {"username":"user1","password":"testpassword","confirmPassword":"testpassword","email":"test@test.com","firstName":"gavin","lastName":"belson"},
        null,
        [500],
        [{"name":"selectUserNameByUserName","params":["user1"]}],
        [[{"username":"user1"}]]
    );

    runner.runTest(
        'POST | user-newUserGoodReqUser2 | 200',
        '/api/data/user',
        'post',
        {"username":"user2","password":"testpassword","confirmPassword":"testpassword","email":"test@test.com","firstName":"peter","lastName":"gregory"},
        null,
        [200],
        [{"name":"selectUserNameByUserName","params":["user2"]},{"name":"insertUser","params":["user2",params.hashedPassword,"test@test.com","peter","gregory","member","local"]}],
        [[],{"lastinsertedid":"1"}]
    );

    runner.runTest(
        'POST | user-newUserGoodReqUser3 | 200',
        '/api/data/user',
        'post',
        {"username":"user3","password":"testpassword","confirmPassword":"testpassword","email":"test@test.com","firstName":"brian","lastName":"griffin"},
        null,
        [200],
        [{"name":"selectUserNameByUserName","params":["user3"]},{"name":"insertUser","params":["user3",params.hashedPassword,"test@test.com","brian","griffin","member","local"]}],
        [[],{"lastinsertedid":"1"}]
    );

    runner.runTest(
        'POST | token-wrongPassword | 400',
        '/api/auth/token',
        'post',
        {"username":"user1","password":"testpassword123"},
        null,
        [400],
        [{"name":"selectUserDataByUserName","params":["user1"]}]
    );

    runner.runTest(
        'POST | token-wrongUserName | 400',
        '/api/auth/token',
        'post',
        {"username":"invaliduser","password":"testpassword"},
        null,
        [400],
        [{"name":"selectUserDataByUserName","params":["invaliduser"]}]
    );

    runner.runTest(
        'POST | token-goodReqUser1 | 200',
        '/api/auth/token',
        'post',
        {"username":"user1","password":"testpassword"},
        null,
        [200],
        [{"name":"selectUserDataByUserName","params":["user1"]}],
        [[{"id":1,"password":params.hashedPassword,"roles":"member","domain":"local","firstname":"test","lastname":"test"}]]
    );

    runner.runTest(
        'POST | token-goodReqUser2 | 200',
        '/api/auth/token',
        'post',
        {"username":"user2","password":"testpassword"},
        null,
        [200],
        [{"name":"selectUserDataByUserName","params":["user2"]}],
        [[{"id":2,"password":params.hashedPassword,"roles":"member","domain":"local","firstname":"test","lastname":"test"}]]
    );

    runner.runTest(
        'POST | token-goodReqUser3 | 200',
        '/api/auth/token',
        'post',
        {"username":"user3","password":"testpassword"},
        null,
        [200],
        [{"name":"selectUserDataByUserName","params":["user3"]}],
        [[{"id":3,"password":params.hashedPassword,"roles":"member","domain":"local","firstname":"test","lastname":"test"}]]
    );

    runner.runTest(
        'GET | user-findAllPrivateUser1 | 200',
        '/api/data/user/private/findall/id/0/1',
        'get',
        {"username":"testuser","password":"testpassword","confirmPassword":"testpassword","email":"test@test.com","firstName":"firstName","lastName":"lastName"},
        params.user1Token,
        [200],
        [{"name":"countUserById","params":["1"]},{"name":"selectUserDataById","params":["1"]}],
        [[{"":"1"}]]
    );

    runner.runTest(
        'GET | user-findByIdPrivateUser1 | 200',
        '/api/data/user/private/findbyid/1',
        'get',
        {"username":"testuser","password":"testpassword","confirmPassword":"testpassword","email":"test@test.com","firstName":"firstName","lastName":"lastName"},
        params.user1Token,
        [200],
        [{"name":"countUserById2","params":["1"]},{"name":"selectUserDataById2","params":["1"]}],
        [[{"":"1"}]]
    );

    runner.runTest(
        'GET | user-findByIdPrivateUser2 | 401',
        '/api/data/user/private/findbyid/2',
        'get',
        {"username":"testuser","password":"testpassword","confirmPassword":"testpassword","email":"test@test.com","firstName":"firstName","lastName":"lastName"},
        params.user1Token,
        [401],
        [{"name":"insertError","params":[]}],
        [{"lastinsertedid":"1"}]
    );

    runner.runTest(
        'PUT | user-user1EditUser2Data | 401',
        '/api/data/user/2',
        'put',
        {"firstName":"eddard","lastName":"stark"},
        params.user1Token,
        [401],
        [{"name":"selectUserDataById3","params":["2"]}],
        [[{"id":2}]]
    );

    runner.runTest(
        'PUT | user-user1EditUser1Data | 200',
        '/api/data/user/1',
        'put',
        {"firstName":"catelyn","lastName":"tully"},
        params.user1Token,
        [200],
        [{"name":"selectUserDataById3","params":["1"]},{"name":"updateUserFullNameById","params":["catelyn","tully","1"]}],
        [[{"id":1,"firstName":"test","lastName":"test","domain":"local","username":"test","roles":"member"}]]
    );

    runner.runTest(
        'GET | user-verifyUser1Update | 200',
        '/api/data/user/private/findbyid/1',
        'get',
        {"username":"testuser","password":"testpassword","confirmPassword":"testpassword","email":"test@test.com","firstName":"firstName","lastName":"lastName"},
        params.user1Token,
        [200],
        [{"name":"countUserById2","params":["1"]},{"name":"selectUserDataById2","params":["1"]}],
        [[{"":"1"}]]
    );

    runner.runTest(
        'DEL | user-user1DelUser1 | 401',
        '/api/data/user/1',
        'delete',
        null,
        params.user1Token,
        [401],
        [{"name":"selectUserDataById3","params":["1"]}],
        [[{"id":1}]]
    );
};