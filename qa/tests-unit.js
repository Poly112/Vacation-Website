const fortune = require("../lib/fortune");
const expect = require("chai").expect;

suite("Fortune cookie tests", function () {
    test("getFortune() should return a fortune", function () {
        expect(typeof fortune.getFortune() === "string");
    });
});
