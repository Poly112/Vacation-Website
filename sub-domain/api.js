const express = require("express");
const emailService = require("../lib/email.js")();
var Attraction = require("../models/attraction.js");

const api = express.Router();

// create api routes; these can be defined anywhere
api.get("/attractions", (req, res, next) => {
    Attraction.find({ approved: true }, (err, attractions) => {
        if (err) return next("Internal error.");

        return res.status(200).json({
            data: attractions.map((a) => {
                return {
                    name: a.name,
                    description: a.description,
                    location: a.location,
                };
            }),
        });
    });
});

api.post("/attraction", (req, res, next) => {
    const a = new Attraction({
        name: req.body.name,
        description: req.body.description,
        location: { lat: req.body.lat, lng: req.body.lng },
        history: {
            event: "created",
            email: req.body.email,
            date: new Date(),
        },
        approved: false,
    });
    a.save((err, a) => {
        if (err) return next("Unable to add attraction.");
        return res.status(200).json({ id: a._id });
    });
});

api.get("/attraction/:id", (req, res, next) => {
    Attraction.findById(req.params.id, (err, a) => {
        if (err) {
            return next({ error: err });
        }
        res.status(200).json({
            name: a.name,
            description: a.description,
            location: a.location,
        });
    });
});

////////////////////////////////////////
// Error handlers

api.use((req, res) => {
    return res.status(404).json({ error: "Not found" });
});

api.use((err, req, res, next) => {
    console.log(err);
    emailService.emailError(
        err.error.message,
        undefined,
        err.error.stack,
        `Error occurred at ${new Date()}`
    );

    return res.status(500).json({ ...err });
});

module.exports = api;
