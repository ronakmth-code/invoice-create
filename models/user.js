const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    partyName: { type: String, required: true },
    address: { type: String, required: true },
    gstin: { type: String, required: true },
    mobile: { type: String, required: true },
    panno: { type: String, required: true },
    email: { type: String }
});

module.exports = mongoose.model("User", userSchema);
