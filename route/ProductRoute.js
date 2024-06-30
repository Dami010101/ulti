const express = require("express");
const router = express.Router();
const { getAllProducts, getProductById, createProduct, updateProduct, deleteProduct } = require("../controller/ProductController");

// Route to get all products
router.get("getAllProducts", getAllProducts);

// Route to get a single product by ID
router.get("getProductById:id", getProductById);

// Route to create a new product
router.post("createProduct", createProduct);

// Route to update an existing product
router.put("updateProduct:id", updateProduct);

// Route to delete a product
router.delete("deleteProduct:id", deleteProduct);

module.exports = router;
