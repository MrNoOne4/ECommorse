// Cart class represents a single product inside the shopping cart
class Cart {

  // Constructor runs when a new Cart object is created
  constructor(productName, productId, productImg, productPrice) {

    // Store product details
    this.productName = productName;   // Name of the product
    this.productId = productId;       // Unique ID of the product

    // Default quantity starts at 1 when added to cart
    this.productQuantity = 1;

    this.productImg = productImg;     // Image URL of the product
    this.productPrice = productPrice; // Price per item
  }

  // Return product name
  getName() {
    return this.productName;
  }

  // Return product ID
  getProductId() {
    return this.productId;
  }

  // Return product image
  getImg() {
    return this.productImg;
  }

  // Return product price (per item)
  getPrice() {
    return this.productPrice;
  }

  // Increase quantity when user adds the same product again
  addMore() {
    this.productQuantity++;
  }

  // Calculate total price (price × quantity)
  getTotalPrice() {
    return this.productPrice * this.productQuantity;
  }
}