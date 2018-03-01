module.exports = function(runner, params)
{
    //TODO: query params

    runner.runUploadTest(
        'POST | asset-goodToken | 200',
        './test/files/test.jpg',
        params.user1Token,
        'image/jpeg',
        [200],
        [{"name":"selectUserDataById3","params":[1]},{"name":"insertAsset","params":[1,'uploadedName']}],
        [[{"id":1}],{"lastinsertedid":"1"}]
    );
};