const Customer = require("../model/customer.js");
const _ = require("underscore");

// convenience function for joining fields
function smartJoin(arr, separator) {
    if (!separator) separator = " ";
    return arr
        .filter((elt) => {
            return (
                elt !== undefined &&
                elt !== null &&
                elt.toString().trim() !== ""
            );
        })
        .join(separator);
}

// get a customer view model
module.exports = function getCustomerViewModel(customerId) {
    const customer = Customer.findById(customerId);
    if (!customer)
        return { error: "Unknown customer ID: " + req.params.customerId };
    const orders = customer.getOrders().map((order) => {
        return {
            orderNumber: order.orderNumber,
            date: order.date,
            status: order.status,
            url: "/orders/" + order.orderNumber,
        };
    });
    const vm = _.omit(customer, "salesNotes");
    return _.extend(vm, {
        name: smartJoin([vm.firstName, vm.lastName]),
        fullAddress: smartJoin(
            [
                customer.address1,
                customer.address2,
                customer.city + ", " + customer.state + " " + customer.zip,
            ],
            "<br>"
        ),
        orders: customer.getOrders().map((order) => {
            return {
                orderNumber: order.orderNumber,
                date: order.date,
                status: order.status,
                url: "/orders/" + order.orderNumber,
            };
        }),
    });
};
