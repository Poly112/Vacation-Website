const express = require("express");
const emailService = require("../lib/email.js")();

const admin = express.Router();

// create admin routes; these can be defined anywhere
admin.get("/", (req, res) => {
    res.render("home");
});

admin.get("/users", (req, res) => {
    res.render("home");
});

////////////////////////////////////////
// Error handlers

admin.use((req, res) => {
    res.status(404);
    return res.render("404");
});

admin.use((err, req, res, next) => {
    console.log(err.stack);
    emailService.emailError(
        err.message,
        undefined,
        err.stack,
        `Error occurred at ${new Date()}`
    );

    return res.status(500).render("500");
});

module.exports = admin;
