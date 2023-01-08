const express = require("express");
const expressHandlebars = require("express-handlebars");
const app = express();
require("dotenv").config();
const cartValidation = require("./lib/cartValidation");
const emailService = require("./lib/email.js")();
const https = require("https");
const fs = require("fs");
const vhost = require("vhost");
const fortune = require("./lib/fortune");
const autoViews = {};
const session = require("express-session");
const MongoStore = require("connect-mongo");
const mongoose = require("mongoose");
const credentials = require("./credentials");
const Q = require("q");
const Dealer = require("./models/dealer");
let server;

//////////////////////////////////////////////////
// Using domains

app.use((req, res, next) => {
    // create a domain for this request
    const domain = require("domain").create();
    // handle errors on this domain
    domain.on("error", (err) => {
        console.error("DOMAIN ERROR CAUGHT\n", err.stack);
        try {
            // failsafe shutdown in 5 seconds
            setTimeout(() => {
                console.error("Failsafe shutdown.");
                process.exit(1);
            }, 5000);
            // disconnect from the cluster
            const worker = require("cluster").worker;
            if (worker) worker.disconnect();
            // stop taking new requests
            server.close();
            try {
                // attempt to use Express error route
                next(err);
            } catch (error) {
                // if Express error route failed, try
                // plain Node response
                console.error("Express error mechanism failed.\n", error.stack);
                res.statusCode = 500;
                res.setHeader("content-type", "text/plain");
                res.end("Server error.");
            }
        } catch (error1) {
            console.error("Unable to send 500 response.\n", error1.stack);
        }
    });
    // add the request and response objects to the domain
    domain.add(req);
    domain.add(res);
    // execute the rest of the request chain in the domain
    domain.run(next);
});

///////////////////////////////////////////////////////////

const opts = {
    server: {
        socketOptions: { keepAlive: 1 },
    },
};
switch (app.get("env")) {
    case "development":
        mongoose.connect(process.env.DEV_CONN, () =>
            console.log(`DATABASE CONNECTED ON ${app.get("env")} mode`)
        );
        break;
    case "production":
        mongoose.connect(process.env.PROD_CONN, opts, () =>
            console.log(`DATABASE CONNECTED ON ${app.get("env")} mode`)
        );
        break;

    default:
        throw new Error("Unknown execution environment: " + app.get("env"));
}
///////////////////////////////////////////////////////////

// TODO Disable x-powered-by in all your project for security reasons
app.disable("x-powered-by");

///////////////////////////////////////////////////////////

app.use(require("compression")());
app.use(require("cookie-parser")(process.env.COOKIE_SECRET));
app.use(
    session({
        secret: process.env.COOKIE_SECRET,
        resave: true,
        saveUninitialized: true,

        store: MongoStore.create({ mongoUrl: process.env.DEV_CONN }),
    })
);

// TODO Disabled this to allow post('cart/checkout', fn) to send
app.use(require("csurf")());
app.use((req, res, next) => {
    res.locals._csrfToken = req.csrfToken();
    next();
});

// TODO Change util.pump to
// is.on("error", cb);
// os.on("error", cb);
// os.on("close", cb);
// is.pipe (os);

switch (app.get("env")) {
    case "development":
        // compact, colorful dev logging
        app.use(require("morgan")("dev"));
        break;
    case "production":
        // module 'express-logger' supports daily log rotation
        app.use(
            require("express-logger")({
                path: __dirname + "/log/requests.log",
            })
        );
        break;
}

app.use(function (req, res, next) {
    // if there's a flash message, transfer
    // it to the context, then clear it
    res.locals.flash = req.session.flash;
    delete req.session.flash;
    next();
});
///////////////////////////////////////
app.use(express.urlencoded({ extended: true }));
///////////////////////////////////////////////////

app.enable("trust proxy");

//////////////////////////////////////////////////////
// Setting up the view engine

const hbs = expressHandlebars.create({
    helpers: {
        section: (name, options) => {
            if (!this._sections) this._sections = {};
            this._sections[name] = options.fn(this);
            return null;
        },
        static: (name) => require("./lib/static").map(name),
    },
    extname: ".hbs",
});

app.set("view engine", "hbs");
app.engine("hbs", hbs.engine);

//////////////////////////////////////////////////////
// Static page

app.use("/libs", express.static("public"));
app.use("/libraries", express.static("node_modules"));

////////////////////////////////////////////////////
app.use((req, res, next) => {
    res.locals.showTests =
        app.get("env") !== "production" && req.query.test === "1";
    return next();
});

/////////////////////////////////////////////////

app.use((req, res, next) => {
    if (!res.locals.partials) res.locals.partials = {};
    res.locals.partials.weatherData = (function () {
        // our weather cache
        const c = {
            refreshed: 0,
            refreshing: false,
            updateFrequency: 360000, // 1 hour
            locations: [
                { name: "Portland" },
                { name: "Bend" },
                { name: "Manzanita" },
            ],
        };
        return function () {
            if (!c.refreshing && Date.now() > c.refreshed + c.updateFrequency) {
                c.refreshing = true;
                const promises = [];
                c.locations.forEach(function (loc) {
                    const deferred = Q.defer();
                    const url =
                        "http://api.wunderground.com/api/" +
                        credentials.WeatherUnderground.ApiKey +
                        "/conditions/q/OR/" +
                        loc.name +
                        ".json";
                    http.get(url, function (res) {
                        let body = "";
                        res.on("data", function (chunk) {
                            body += chunk;
                        });
                        res.on("end", function () {
                            body = JSON.parse(body);
                            loc.forecastUrl =
                                body.current_observation.forecast_url;
                            loc.iconUrl = body.current_observation.icon_url;
                            loc.weather = body.current_observation.weather;
                            loc.temp =
                                body.current_observation.temperature_string;
                            deferred.resolve();
                        });
                    });
                    promises.push(deferred);
                });
                Q.all(promises).then(function () {
                    c.refreshing = false;
                    c.refreshed = Date.now();
                });
            }
            return { locations: c.locations };
        };
    })();

    next();
});

app.set("port", process.env.PORT || 443);

////////////////////////////////////////
// Cart Validation
app.use(cartValidation.checkWaivers);
app.use(cartValidation.checkGuestCounts);

////////////////////////////////////////////
// Setting up sub domains and Cors
app.use(vhost("admin.*", require("./sub-domain/admin")));
app.use(require("cors")(), vhost("api.*", require("./sub-domain/api")));

////////////////////////////////////////////////////////
// Authentication Passport js
const auth = require("./lib/auth.js")(app, {
    providers: credentials.authProviders,
    successRedirect: "/account",
    failureRedirect: "/unauthorized",
    baseUrl: "https://localhost",
});
// auth.init() links in Passport middleware:
auth.init();
// now we can specify our auth routes:
auth.registerRoutes();

app.get("/account", (req, res) => {
    if (!req.session.passport.user) return res.redirect(303, "/unauthorized");
    res.render("account");
});
function allow(roles) {
    const user = req.session.passport.user;
    if (user && roles.split(",").indexOf(user.role) !== -1) return next();
    res.redirect(303, "/unauthorized");
}

app.get("/unauthorized", (req, res, next) => {
    console.log("UnAuthorized");
    //passing it to 404
    next();
});

function customerOnly(req, res, next) {
    if (req.user && req.user.role === "customer") return next();
    res.redirect(303, "/unauthorized");
}

function employeeOnly(req, res, next) {
    if (req.user && req.user.role === "employee") return next();
    next("route");
}

// app.get("/account", function (req, res) {
//     res.render("account");
// });
// customer routes
app.get("/account/order-history", customerOnly, function (req, res, next) {
    res.render("account/order-history");
    // next();
});
app.get("/account/email-prefs", customerOnly, function (req, res) {
    res.render("account/email-prefs");
});
// employer routes
app.get("/sales", employeeOnly, function (req, res) {
    res.render("sales");
});

// app.get(
//     "/account",
//     (req, res, next) => allow("customer,employee"),
//     function (req, res) {
//         res.render("account");
//     }
// );

///////////////////////////////////////////////////////////
// Setting Up Twitter

const topTweets = {
    count: 10,
    lastRefreshed: 0,
    refreshInterval: 15 * 60 * 1000,
    tweets: [],
};

const twitter = require("./lib/twitter")({
    consumerKey: process.env.CONSUMER_KEY,
    consumerKey: process.env.CONSUMER_SECRET,
});

function getTopTweets(cb) {
    if (Date.now() < topTweets.lastRefreshed + topTweets.refreshInterval)
        return cb(topTweets.tweets);

    twitter.search("#ny-travel", topTweets.count, (result) => {
        const formattedTweets = [];
        const promises = [];
        const embedOpts = { omit_script: 1 };
        result.statuses.forEach(function (status) {
            const deferred = Q.defer();
            twitter.embed(status.id_str, embedOpts, function (embed) {
                formattedTweets.push(embed.html);
                deferred.resolve();
            });
            promises.push(deferred.promise);
        });
        Q.all(promises).then(function () {
            topTweets.lastRefreshed = Date.now();
            cb((topTweets.tweets = formattedTweets));
        });
    });
}
//////////////////////////////////////////////
// Adding Maps

// Let’s go ahead and create our cache:

const dealerCache = {
    lastRefreshed: 0,
    refreshInterval: 60 * 60 * 1000,
    jsonUrl: "/dealers.json",
    geocodeLimit: 2000,
    geocodeCount: 0,
    geocodeBegin: 0,
};
dealerCache.jsonFile = __dirname + "/public" + dealerCache.jsonUrl;

function geocodeDealer(dealer) {
    const addr = dealer.getAddress(" ");
    if (addr === dealer.geocodedAddress) return; // already geocoded
    if (dealerCache.geocodeCount >= dealerCache.geocodeLimit) {
        // has 24 hours passed since we last started geocoding?
        if (Date.now() > dealerCache.geocodeCount + 24 * 60 * 60 * 1000) {
            dealerCache.geocodeBegin = Date.now();
            dealerCache.geocodeCount = 0;
        } else {
            // we can't geocode this now: we've
            // reached our usage limit
            return;
        }
    }
    geocode(addr, (err, coords) => {
        if (err) return console.log("Geocoding failure for " + addr);
        dealer.lat = coords.lat;
        dealer.lng = coords.lng;
        dealer.save();
    });
}

dealerCache.refresh = function (cb) {
    if (Date.now() > dealerCache.lastRefreshed + dealerCache.refreshInterval) {
        // we need to refresh the cache
        Dealer.find({ active: true }, (err, dealers) => {
            if (err) return console.log("Error fetching dealers: " + err);
            // geocodeDealer will do nothing if coordinates are up-to-date
            dealers.forEach(geocodeDealer);
            // we now write all the dealers out to our cached JSON file
            fs.writeFileSync(dealerCache.jsonFile, JSON.stringify(dealers));
            // all done -- invoke callback
            cb();
        });
    }
};

function refreshDealerCacheForever() {
    dealerCache.refresh(function () {
        // call self after refresh interval
        setTimeout(refreshDealerCacheForever, dealerCache.refreshInterval);
    });
}

// create empty cache if it doesn't exist to prevent 404 errors
if (!fs.existsSync(dealerCache.jsonFile))
    fs.writeFileSync("dealers.json", JSON.stringify([]));
// start refreshing cache
refreshDealerCacheForever();

//////////////////////////////////////////////////////////
// Routes
require("./routes")(app);

///////////////////////////////////////////////////
// Automatically Rendering Views

app.use((req, res, next) => {
    const path = req.path.toLowerCase();
    // check cache; if it's there, render the view
    if (autoViews[path]) return res.render(autoViews[path]);
    // if it's not in the cache, see if there's
    // a .handlebars file that matches
    if (fs.existsSync(`${__dirname}/views${path}.hbs`)) {
        autoViews[path] = path.replace(/^\//, "");
        return res.render(autoViews[path]);
    }
    // no view found; pass on to 404 handler
    next();
});

//////////////////////////////////////////////////////////
// Custom 404 page
app.use((req, res) => {
    res.status(404);
    return res.render("404");
});

/////////////////////////////////////////////////////
// Custom 500 page
app.use((err, req, res, next) => {
    console.log(err.stack);
    emailService.emailError(
        err.message,
        undefined,
        err.stack,
        `Error occurred at ${new Date()}`
    );

    return res.status(500).render("500");
});

function startServer() {
    const options = {
        key: fs.readFileSync(`${__dirname}/ssl/private.key`),
        cert: fs.readFileSync(`${__dirname}/ssl/ny-travel-cert.crt`),
    };
    server = https.createServer(options, app);
    server.listen(app.get("port"), () => {
        console.log(
            `Express started in ${app.get(
                "env"
            )} mode on https://localhost:${app.get(
                "port"
            )}; press Ctrl-C to terminate`
        );
    });
}
if (require.main === module) {
    // application run directly; start app server
    startServer();
} else {
    // application imported as a module via "require": export function
    // to create server
    module.exports = startServer;
}
