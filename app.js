const express = require("express");
const app = express();
const mongoose = require("mongoose");
const Product = require("./models/product");
const User = require("./models/user");
const path = require("path");
require('dotenv').config();
app.use(express.urlencoded({ extended: true })); // for form data
app.use(express.json()); // for JSON requests (optional, but useful)


// const MONGO_URL = "mongodb://127.0.0.1:27017/stock";
const dbUrl = process.env.ATLASDB_URL;

main()
  .then(() => {
    console.log("connected to DB");
  })
  .catch((err) => {
    console.log(err);
  });

async function main() {
  await mongoose.connect(dbUrl);
}

app.get("/", (req, res) => {
    res.send("Hi i am root ");
});

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));

app.get("/main", async(req, res) => {
    const allproducts = await Product.find({});
    const allusers = await User.find({});
    res.render("index.ejs", {allproducts, allusers});
});


app.get("/search-products", async (req, res) => {
    try {
        const query = req.query.q || "";
        if (!query) {
            return res.json([]);
        }

        const products = await Product.find({
            pname: { $regex: query, $options: "i" }
        }).limit(10);

        res.json(products);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error" });
    }
});


app.get("/search-user", async (req, res) => {
    try {
        const query = req.query.q || "";
        if (!query) {
            return res.json([]);
        }

        const users = await User.find({
            partyName: { $regex: query, $options: "i" }
        }).limit(10);

        res.json(users); // send users, not products
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error" });
    }
});


app.get("/product", async (req, res) => {
    try {
        const products = await Product.find({});
        res.render("product.ejs", { products });
    } catch (err) {
        console.error(err);
        res.status(500).send("Error fetching products");
    }
});

// app.post("/products", async (req, res) => {
//   try {
//     const productData = req.body.products[0]; // extract first
//     const product = new Product(productData);
//     await product.save();
//     res.redirect("/main");
//   } catch (err) {
//     console.error(err);
//     res.status(400).send(err.message);
//   }
// });

app.post("/products", async (req, res) => {
    try {
        // req.body.products should be an array of product objects
        const products = req.body.products;

        if (!Array.isArray(products) || products.length === 0) {
            return res.status(400).send("No products provided");
        }

        // Insert all at once
        await Product.insertMany(products);

        res.redirect("/main"); // 👈 Redirect after save
    } catch (err) {
        console.error(err);
        res.status(400).send(err.message);
    }
});


// Edit form
app.get("/products/edit/:id", async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).send("Product not found");
        res.render("editProduct.ejs", { product });
    } catch (err) {
        res.status(500).send("Error loading product");
    }
});

// Update product
app.post("/products/edit/:id", async (req, res) => {
    try {
        await Product.findByIdAndUpdate(req.params.id, req.body);
        res.redirect("/product");
    } catch (err) {
        res.status(500).send("Error updating product");
    }
});

//delete route 
app.post("/products/delete/:id", async (req, res) => {
    try {
        await Product.findByIdAndDelete(req.params.id);
        res.redirect("/product");
    } catch (err) {
        res.status(500).send("Error deleting product");
    }
});

// Show users + form
app.get("/users", async (req, res) => {
    const users = await User.find();
    res.render("user", { users });
});

// Add user
app.post("/users", async (req, res) => {
    try {
        await User.create(req.body);
        res.redirect("/users");
    } catch (err) {
        console.error(err);
        res.send("Error adding user");
    }
});

// Delete user
app.get("/users/delete/:id", async (req, res) => {
    await User.findByIdAndDelete(req.params.id);
    res.redirect("/users");
});

// Edit user page
app.get("/users/edit/:id", async (req, res) => {
    const user = await User.findById(req.params.id);
    res.render("editUser", { user });
});

// Update user
app.post("/users/edit/:id", async (req, res) => {
    try {
        await User.findByIdAndUpdate(req.params.id, req.body);
        res.redirect("/users");
    } catch (err) {
        console.error(err);
        res.status(500).send("Error updating user");
    }
});



app.listen(8080, () => {
  console.log("server is listening to port 8080");
});
