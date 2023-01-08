const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
    orderNumber: Number,
    date: Date,
    status: String,
});
const Order = mongoose.model("Order", orderSchema);
modules.export = Order;
