const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const productSchema = new mongoose.Schema({
    hsn: { type: String, required: true },
    pname: { type: String, required: true }, // <-- matches your search query
    pack: String,
    batch: String,
    exp: String,
    mrp: Number,
    rate: Number,
    igst: String
}, { timestamps: true });

// listingSchema.post("findOneAndDelete", async(listing) =>{
//   if(listing) {
//     await Review.deleteMany({_id: {$in: listing.reviews}});
//   }
// })

const Product = mongoose.model("Product", productSchema);
module.exports = Product;
