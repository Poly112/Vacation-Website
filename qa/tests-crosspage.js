const Browser = require("zombie");

let browser;
suite("Cross-Page Tests", () => {
    setup(() => {
        browser = new Browser();
    });
    test(
        "requesting a group rate quote from the hood river tour page " +
            "should populate the referrer field",
        (done) => {
            const referrer = "https://localhost/tours/hood-river";
            browser.visit(referrer, () => {
                browser.clickLink(".requestGroupRate", () => {
                    browser.assert.element(
                        "form input[name=referrer]",
                        referrer
                    );
                    done();
                });
            });
        }
    );
    test(
        "requesting a group rate from the oregon coast tour page should " +
            "populate the referrer field",
        (done) => {
            const referrer = "https://localhost/tours/oregon-coast";
            browser.visit(referrer, () => {
                browser.clickLink(".requestGroupRate", () => {
                    browser.assert.element(
                        "form input[name=referrer]",
                        referrer
                    );
                    done();
                });
            });
        }
    );
    test(
        'visiting the "request group rate" page directly should result ' +
            "in an empty referrer field",
        (done) => {
            browser.visit("https://localhost/tours/request-group-rate", () => {
                browser.assert.element("form input[name=referrer]", "");
                done();
            });
        }
    );
});
