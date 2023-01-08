const fortune = require("../lib/fortune");

exports.home = (req, res) => {
    res.render("home");
};

exports.about = (req, res) => {
    return res.render("about", {
        fortune: fortune.getFortune(),
        pageTestScript: "/libs/qa/tests-about.js",
    });
};
