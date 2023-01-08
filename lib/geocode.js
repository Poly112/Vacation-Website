const https = require("http");
module.exports = function (query, cb) {
    const options = {
        hostname: "maps.googleapis.com",
        path:
            "/maps/api/geocode/json?address=" +
            encodeURIComponent(query) +
            "&key=" +
            process.env.API_KEY +
            "&sensor=false",
    };
    https
        .request(options, function (res) {
            let data = "";
            res.on("data", function (chunk) {
                data += chunk;
            });
            res.on("end", function () {
                data = JSON.parse(data);
                if (data.results.length) {
                    cb(null, data.results[0].geometry.location);
                } else {
                    cb("No results found.", null);
                }
            });
        })
        .end();
};
