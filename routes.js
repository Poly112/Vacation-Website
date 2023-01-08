const main = require("./handlers/main");
const vacation = require("./handlers/vacation");
const tours = require("./handlers/tours");
const newsletter = require("./handlers/newsletter");
const secret = require("./handlers/secret");

module.exports = (app) => {
    app.get("/", main.home);
    app.get("/about", main.about);

    app.get("/contest/vacation-photo", vacation.vacationPhoto);

    app.post(
        "/contest/vacation-photo/:year/:month",
        vacation.vacationPhotoPost
    );

    app.get("/vacations", vacation.vacation);

    app.get("/set-currency/:currency", vacation.setCurrency);

    app.get("/notify-me-when-in-season", vacation.notifyMe);

    app.post("/notify-me-when-in-season", vacation.notifyMePost);

    app.post("/process", newsletter.process);

    app.get("/tours/hood-river", tours.hoodRiver);

    app.get("/tours/request-group-rate", tours.requestGroup);

    app.get("/tours/oregon-coast", tours.oregonCoast);

    app.post("/cart/checkout", vacation.checkout);

    app.get("/newsletter", newsletter.newsletter);

    app.post("/newsletter", newsletter.signUpForNewsletter);

    app.post("/contest/vacation-photo/:year/:month", vacation.contestPhotoPost);

    app.get("/secret", secret.authorize, secret.secret);
    app.get("/sub-rosa", secret.authorize, secret.subRosa);

    app.get("/staff/:name", secret.staff);

    app.get("/page-with-specials", secret.specials, secret.pageWithSpecial);
};
