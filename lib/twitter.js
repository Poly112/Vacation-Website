const https = require("https");
const querystring = require("querystring");

module.exports = function (twitterOptions) {
    let accessToken;

    function getAccessToken(cb) {
        if (accessToken) return cb(accessToken);
        const bearerToken = Buffer(
            encodeURIComponent(twitterOptions.consumerKey) +
                ":" +
                encodeURIComponent(twitterOptions.consumerSecret)
        ).toString("base64");
        const options = {
            hostname: "api.twitter.com",
            port: 443,
            method: "POST",
            path: "/oauth2/token?grant_type=client_credentials",
            headers: {
                Authorization: "Basic " + bearerToken,
            },
        };
        https
            .request(options, (res) => {
                let data = "";
                res.on("data", (chunk) => {
                    data += chunk;
                });
                res.on("end", () => {
                    const auth = JSON.parse(data);
                    if (auth.token_type !== "bearer") {
                        console.log("Twitter auth failed.");
                        return;
                    }
                    accessToken = auth.access_token;
                    cb(accessToken);
                });
            })
            .end();
    }

    return {
        search: function (query, count, cb) {
            getAccessToken((accessToken) => {
                const options = {
                    hostname: "api.twitter.com",
                    port: 443,
                    method: "GET",
                    path:
                        "/1.1/search/tweets.json?q=" +
                        encodeURIComponent(query) +
                        "&count=" +
                        (count || 10),
                    headers: {
                        Authorization: "Bearer " + accessToken,
                    },
                };
                https
                    .request(options, function (res) {
                        let data = "";
                        res.on("data", (chunk) => {
                            data += chunk;
                        });
                        res.on("end", () => {
                            cb(JSON.parse(data));
                        });
                    })
                    .end();
            });
        },
        embed: function (statusId, options, cb) {
            if (typeof options === "function") {
                cb = options;
                options = {};
            }
            options.id = statusId;
            getAccessToken((accessToken) => {
                const requestOptions = {
                    hostname: "api.twitter.com",
                    port: 443,
                    method: "GET",
                    path:
                        "/1.1/statuses/oembed.json?" +
                        querystring.stringify(options),
                    headers: {
                        Authorization: "Bearer " + accessToken,
                    },
                };
                https
                    .request(requestOptions, (res) => {
                        var data = "";
                        res.on("data", (chunk) => {
                            data += chunk;
                        });
                        res.on("end", () => {
                            cb(JSON.parse(data));
                        });
                    })
                    .end();
            });
        },
    };
};
