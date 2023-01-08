const formidable = require("formidable");
const Vacation = require("../models/vacation");
const VacationInSeasonListener = require("../models/vacationInSeasonListener.js");

exports.vacationPhoto = (req, res) => {
    const now = new Date();
    res.render("contest/vacation-photo", {
        year: now.getFullYear(),
        month: now.getMonth() + 1,
    });
};

exports.vacationPhotoPost = (req, res) => {
    const form = new formidable.IncomingForm();
    form.parse(req, (err, fields, files) => {
        if (err) return res.redirect(303, "/error");
        console.log("received fields:");
        console.log(fields);
        console.log("received files:");
        console.log(files);
        res.redirect(303, "/thank-you");
    });
};

exports.vacation = (req, res) => {
    Vacation.find({ available: true }, (err, vacations) => {
        const currency = req.session.currency || "USD";
        const context = {
            currency: currency,
            vacations: vacations.map((vacation) => {
                return {
                    sku: vacation.sku,
                    name: vacation.name,
                    description: vacation.description,
                    inSeason: vacation.inSeason,
                    price: convertFromUSD(
                        vacation.priceInCents / 100,
                        currency
                    ),
                    qty: vacation.qty,
                };
            }),
        };
        switch (currency) {
            case "USD":
                context.currencyUSD = "selected";
                break;
            case "GBP":
                context.currencyGBP = "selected";
                break;
            case "BTC":
                context.currencyBTC = "selected";
                break;
        }
        res.render("vacations", context);
    });
};

exports.setCurrency = (req, res) => {
    req.session.currency = req.params.currency;
    return res.redirect(303, "/vacations");
};

function convertFromUSD(value, currency) {
    switch (currency) {
        case "USD":
            return value * 1;
        case "GBP":
            return value * 0.6;
        case "BTC":
            return value * 0.0023707918444761;
        default:
            return NaN;
    }
}

exports.notifyMe = (req, res) => {
    res.render("notify-me-when-in-season", { sku: req.query.sku });
};

exports.notifyMePost = (req, res) => {
    VacationInSeasonListener.update(
        { email: req.body.email },
        { $push: { skus: req.body.sku } },
        { upsert: true },
        (err) => {
            if (err) {
                console.error(err.stack);
                req.session.flash = {
                    type: "danger",
                    intro: "Ooops!",
                    message: "There was an error processing your request.",
                };
                return res.redirect(303, "/vacations");
            }
            req.session.flash = {
                type: "success",
                intro: "Thank you!",
                message:
                    "You will be notified when this vacation is in season.",
            };
            return res.redirect(303, "/vacations");
        }
    );
};

exports.checkout = (req, res, next) => {
    let cart = req.session.cart;
    if (!cart) {
        cart = { email: "polycarpnwaeke@gmail.com" };
    }
    const name = req.body.name || "",
        email = req.body.email || "",
        // input validation
        VALID_EMAIL_REGEX = /.*?@.*?\.com/;

    if (!email.match(VALID_EMAIL_REGEX))
        return next(new Error("Invalid email address."));
    // assign a random cart ID; normally we would use a database ID here
    cart.number = Math.random()
        .toString()
        .replace(/^0\.0*/, "");
    cart.billing = {
        name: name,
        email: email,
    };
    res.render(
        "email/cart-thank-you",
        { layout: null, cart: cart },
        (err, html) => {
            if (err) console.log("error in email template");
            else {
                emailService.send(
                    cart.email,
                    "Thank you for booking your trip with New York Travel",
                    html
                );
            }
        }
    );
    res.render("cart-thank-you", { cart: cart });
};

exports.contestPhotoPost = (req, res) => {
    const form = new formidable.IncomingForm();
    form.parse(req, (err, fields, files) => {
        if (err) {
            res.session.flash = {
                type: "danger",
                intro: "Oops!",
                message:
                    "There was an error processing your submission. " +
                    "Please try again.",
            };
            return res.redirect(303, "/contest/vacation-photo");
        }
        const photo = files.photo;
        const dir = vacationPhotoDir + "/" + Date.now();
        const path = dir + "/" + photo.name;
        fs.mkdirSync(dir);
        fs.renameSync(photo.path, dir + "/" + photo.name);
        saveContestEntry(
            "vacation-photo",
            fields.email,
            req.params.year,
            req.params.month,
            path
        );
        req.session.flash = {
            type: "success",
            intro: "Good luck!",
            message: "You have been entered into the contest.",
        };
        return res.redirect(303, "/contest/vacation-photo/entries");
    });
};
