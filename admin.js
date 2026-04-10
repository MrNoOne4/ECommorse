// Get products and accounts from localStorage (or empty array if none)
let arritems = JSON.parse(localStorage.getItem("products")) || [];
let arrUser = JSON.parse(localStorage.getItem("accounts")) || [];

// Used to track if user is editing an existing product
let editingIndex = -1;

// Runs when the page is fully loaded
$(document).ready(function () {

  // Display all products on load
  displayItems();

  // Logout button
  $("#logoutNav").click(function () {
    if (confirm("Do you want to log out?")) {
      return (window.location.href = "index.html#");
    }
  });

  // NAVIGATION (switch between product and transaction views)
  $("#productNav").click(function () {
    $("#productDashboard").show();
    $("#transactionContainer").hide();
  });

  $("#transactionNav").click(function () {
    $("#productDashboard").hide();
    $("#transactionContainer").show();
  });

  // PRODUCT FORM submission
  $("#productForm").submit(function (e) {
    productFormSubmit(e);
  });

  // SEARCH (filters products while typing)
  $("#searchInput").on("input", function () {
    displayItems();
  });

  // FILTER (based on price category)
  $("#filterSelect").change(function () {
    displayItems();
  });

  // EDIT BUTTON (populate form with selected product)
  $(document).on("click", ".editBtn", function () {
    let index = $(this).data("index");
    let item = arritems[index];

    // Fill form fields with product data
    $("#productName").val(item.name);
    $("#productPrice").val(item.price);
    $("#categoryFilter").val(item.category);
    $("#productQty").val(item.stock);
    $("#productDescription").val(item.description);
    $("#productImage").val(item.img);

    // Save index to know we're editing
    editingIndex = index;
  });

  // Generate a random product ID
  function generateProductId(length = 6) {
    const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
    let id = "";

    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * chars.length);
      id += chars[randomIndex];
    }

    return id;
  }

  // Load products from localStorage
  function loadAllData() {
    return JSON.parse(localStorage.getItem("products")) || [];
  }

  // Custom toast notification
  function myToast(message, status) {
    var $x = $("#snackbar");
    $x.html(message);

    // Change color depending on status
    if (status === "Danger") {
      $x.css("background-color", "red");
    } else {
      $x.css("background-color", "green");
    }

    $x.addClass("show");

    // Hide after 3 seconds
    setTimeout(function () {
      $x.removeClass("show");
    }, 3000);
  }

  // Initialize clear button state
  clearBtn();

  function clearBtn() {
    // Disable button if no products exist
    $("#clearStorage").prop(
      "disabled",
      Array.isArray(arritems) && arritems.length !== 0 ? false : true
    );

    // Change cursor style
    $("#clearStorage").css(
      "cursor",
      Array.isArray(arritems) && arritems.length !== 0
        ? "pointer"
        : "not-allowed"
    );
  }

  // DISPLAY PRODUCTS
  function displayItems() {
    $("#itemContainer").html(" "); // Clear container

    if (Array.isArray(arritems) && arritems.length !== 0) {
      let searchItem = $("#searchInput").val().toLowerCase();
      let filterItem = $("#filterSelect").val();

      // Reload latest data
      arritems = loadAllData();

      $.each(arritems, function (index, item) {

        // SEARCH filter
        if (searchItem && !item.name.toLowerCase().includes(searchItem)) {
          return;
        }

        // PRICE FILTER
        if (filterItem) {
          if (filterItem === "Low" && item.price >= 100) return;
          if (filterItem === "Medium" && (item.price < 100 || item.price > 500)) return;
          if (filterItem === "High" && item.price <= 500) return;
        }

        // Create product card
        let card = `
        <div class="product-card">
            <img src="${item.img}" width="120">
            <h4>${item.name}</h4>
            <p>${item.description}</p>
            <p>Price: ₱${item.price}</p>
            <p>Stock: ${item.stock}</p>
            
            <div class="actions">
                <button class="editBtn" data-index="${index}">Edit</button>
                <button class="deleteBtn" data-index="${index}">Delete</button>
            </div>
        </div>
        `;

        // Add card to page
        $("#itemContainer").append(card);
      });
    }
  }

  // DELETE PRODUCT
  $(document).on("click", ".deleteBtn", function () {
    let index = $(this).data("index");
    let item = arritems[index];

    let products = JSON.parse(localStorage.getItem("products")) || [];
    let tempProduct = [];

    // Keep all products except the deleted one
    for (let i = 0; i < products.length; i++) {
      if (products[i].productCode !== item.productCode) {
        tempProduct.push(products[i]);
      }
    }

    localStorage.setItem("products", JSON.stringify(tempProduct));
    displayItems();
  });

  // HANDLE FORM SUBMISSION (ADD / EDIT PRODUCT)
  function productFormSubmit(e) {
    e.preventDefault();

    // Get input values
    let name = $("#productName").val().trim();
    let price = parseFloat($("#productPrice").val());
    let category = $("#categoryFilter").val();
    let quantity = parseInt($("#productQty").val());
    let description = $("#productDescription").val().trim();
    let imageUrl = $("#productImage").val().trim();

    // VALIDATION
    if (name === "") {
      myToast("Product Name must not be empty.", "Danger");
      return;
    }

    if (description === "") {
      myToast("Product Description must not be empty.", "Danger");
      return;
    }

    if (!imageUrl) {
      myToast("Product must have an image.", "Danger");
      return;
    }

    if (category === "all") {
      myToast("Please select a category for the product.", "Danger");
      return;
    }

    if (isNaN(price) || isNaN(quantity)) {
      myToast("Please enter valid numbers for Product Price and Quantity.", "Danger");
      return;
    }

    if (price <= 0 || quantity <= 0) {
      myToast("Product Price and Quantity must be greater than zero.", "Danger");
      return;
    }

    // Create new product object
    let newItem = new Product(
      name,
      price,
      category,
      quantity,
      imageUrl,
      description,
      generateProductId()
    );

    arritems = loadAllData();

    // ADD or UPDATE
    if (editingIndex === -1) {
      arritems.push(newItem);
      alert("Product added successfully!");
    } else {
      arritems[editingIndex] = newItem;
      alert("Product updated successfully!");
      editingIndex = -1;
    }

    saveItems();
    displayItems();
    clearItemForm();
  }

  // SAVE PRODUCTS to localStorage
  function saveItems() {
    localStorage.setItem("products", JSON.stringify(arritems));
  }

  // CLEAR FORM INPUTS
  function clearItemForm() {
    $("#productName").val("");
    $("#productPrice").val("");
    $("#categoryFilter").eq(0).prop("selected", true);
    $("#productQty").val("");
    $("#productDescription").val("");
    $("#productImage").val("");
  }

  // DISPLAY TRANSACTIONS TABLE
  function declaredTransaction() {
    const tbody = document.getElementById("tbody");
    var trasanction = JSON.parse(localStorage.getItem("transaction"));

    console.log(trasanction);

    // Loop through transactions grouped by date
    Object.keys(trasanction).forEach((date) => {
      trasanction[date].forEach((pro) => {

        // Calculate total sales
        const totalSales = pro.productPrice * pro.productQuantity;

        // Create table row
        const row = `
          <tr class="text-2xl">
            <td>${date}</td>
            <td>${pro.productName}</td>
            <td>${pro.productCode}</td>
            <td>${pro.productQuantity}</td>
            <td>₱${pro.productPrice}</td>
            <td>₱${totalSales}</td>
          </tr>
        `;

        tbody.innerHTML += row;
      });
    });
  }

  declaredTransaction();

  // OPEN CLEAR STORAGE MODAL
  $(document).on("click", "#clearStorage", () => {
    $("#myModal").fadeIn();
  });

  // CLOSE MODAL
  $(document).on("click", ".close, #modalCancel", () => {
    $("#myModal").fadeOut();
  });

  // CONFIRM CLEAR STORAGE
  $("#modalConfirm").click(function () {
    localStorage.setItem("products", JSON.stringify(" "));

    $("#myModal").fadeOut();
    myToast("Storage cleared!", "Success");
    $("#itemContainer").html(" ");
  });

});