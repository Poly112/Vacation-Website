module.exports = {
    bundles: {
        clientJavaScript: {
            main: {
                file: "/js/ny-travel.min.js",
                location: "head",
                contents: ["/js/contact.js", "/js/cart.js"],
            },
        },
        clientCss: {
            main: {
                file: "/stylesheet/ny-travel.min.css",
                contents: ["/stylesheet/main.css", "/csstylesheet/cart.css"],
            },
        },
    },
};
