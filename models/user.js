const mongoose = require("mongoose");
const userSchema = new mongoose.Schema({
    authId: String,
    name: String,
    email: String,
    role: String,
    created: Date,
});
const User = mongoose.model("User", userSchema);

exports.getUserById = async (id) => User.findById(id);
exports.getUserByAuthId = async (authId) => User.findOne({ authId });
exports.addUser = async (data) => new User(data).save();
