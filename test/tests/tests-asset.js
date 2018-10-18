module.exports = (runner, params) =>
{
    runner.runFileUploadTest(
        'POST | asset-noToken | 200',
        '/api/data/asset',
        './test/files/test.jpg',
        null,
        'image/jpeg',
        [],
        [],
        401
    );

    runner.runFileUploadTest(
        'POST | asset-goodToken | 200',
        '/api/data/asset',
        './test/files/test.jpg',
        params.user1Token,
        'image/jpeg',
        [{"name":"selectUserDataById3","params":[1]},{"name":"insertAsset","params":[1,'uploadedName']}],
        [[{"id":1}],{"lastinsertedid":"1"}],
        200
    );

    runner.runFileDeleteTest(
        'DELETE | asset-goodToken | 200',
        '/api/data/asset/12',
        params.user1Token,
        [{"name":"selectAssetById","params":[12]},{"name":"deleteAssetById","params":[12]}],
        [[{"id":"12","ownerid":"1","filename":"testfilename.jpg"}]],
        200
    );
};