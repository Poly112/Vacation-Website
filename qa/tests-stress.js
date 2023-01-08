const loadTest = require("loadtest");
const expect = require("chai").expect;

suite("Stress tests", function () {
    test("Homepage should handle 100 requests in a second", (done) => {
        const options = {
            url: "https://localhost",
            concurrency: 4,
            maxRequests: 100,
        };
        loadTest.loadTest(options, function (err, result) {
            expect(!err);
            expect(result.totalTimeSeconds < 1);
            done();
        });
    });
});
