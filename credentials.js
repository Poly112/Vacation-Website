require("dotenv").config();
module.exports = {
    authProviders: {
        facebook: {
            development: {
                appId: process.env.FACEBOOK_APP_ID,
                appSecret: process.env.FACEBOOK_APP_SECRET,
            },
        },
    },
};
