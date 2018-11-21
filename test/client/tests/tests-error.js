export class ErrorTestSuite
{
    run(runner, params)
    {
        runner.runTest(
            'POST | error-valid | 200',
            '/api/error',
            'post',
            {"msg":"test error"},
            null,
            [{"name":"insertError","params":[]}],
            [{"lastinsertedid":"1"}],
            200
        );

        runner.runTest(
            'GET | null-wrongEntity | 400',
            '/api/data/item2/public/findbyid/10',
            'get',
            null,
            null,
            null,
            null,
            400
        );
    }
}

const errorTestSuite = new ErrorTestSuite();
export { errorTestSuite };