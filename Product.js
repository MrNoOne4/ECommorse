class Product {
  // Properties (attributes) of the Product
  name;
  price;
  category;
  stock;
  img;
  description;
  productCode;

  // Constructor is called when creating a new Product object
  constructor(name, price, category, stock, img, description, productCode) {
    // Initialize object properties with provided values
    this.name = name;
    this.price = price;
    this.category = category;
    this.stock = stock;
    this.img = img;
    this.description = description;
    this.productCode = productCode;
  }

  // Returns the product name
  getName() {
    return this.name;
  }

  // Returns the product price
  getPrice() {
    return this.price;
  }

  // Reduces the stock by a given quantity
  reduceStock(qty) {
    this.stock -= qty;
  }

  // Returns the product image (URL or path)
  getImg() {
    return this.img;
  }

  // Returns the current stock quantity
  getStock() {
    return this.stock;
  }

  // Returns the product description
  getDescription() {
    return this.description;
  }
}