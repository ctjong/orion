module.exports = function(runner, params)
{
    //TODO: query params

    runner.runFileUploadTest(
        'POST | asset-goodToken | 200',
        '/api/data/asset',
        './test/files/test.jpg',
        params.user1Token,
        'image/jpeg',
        [200],
        [{"name":"selectUserDataById3","params":[1]},{"name":"insertAsset","params":[1,'uploadedName']}],
        [[{"id":1}],{"lastinsertedid":"1"}]
    );

    runner.runFileDeleteTest(
        'DELETE | asset-goodToken | 200',
        '/api/data/asset/1',
        params.user1Token,
        [200],
        [{"name":"selectAssetById","params":[]},{"name":"deleteAssetById","params":[]}],
        [[{"filename":"testfilename.jpg"}]]
    );
};