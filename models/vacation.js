const mongoose = require("mongoose");

const vacationSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    slug: String,
    category: String,
    sku: String,
    description: String,
    priceInCents: Number,
    tags: [String],
    inSeason: Boolean,
    available: Boolean,
    requiresWaiver: Boolean,
    maximumGuests: Number,
    notes: String,
    packagesSold: Number,
    createdAt: {
        type: Date,
        immutable: true,
        default: () => Date.now(),
    },
    updatedAt: {
        type: Date,
        default: () => Date.now(),
    },
});
vacationSchema.methods.getDisplayPrice = function () {
    return "$" + (parseInt(this.priceInCents) / 100).toFixed(2);
};
const Vacation = mongoose.model("Vacation", vacationSchema);
module.exports = Vacation;
