const mongoose = require("mongoose");
const Orders = require("./orders.js");
const customerSchema = new mongoose.Schema({
    firstName: String,
    lastName: String,
    email: String,
    address1: String,
    address2: String,
    city: String,
    state: String,
    zip: String,
    phone: String,
    salesNotes: [
        {
            date: Date,
            salespersonId: Number,
            notes: String,
        },
    ],
});
customerSchema.methods.getOrders = () => {
    return Orders.find({ customerId: this._id });
};
const Customer = mongoose.model("Customer", customerSchema);
modules.export = Customer;
