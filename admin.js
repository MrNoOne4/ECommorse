// Get products and accounts from localStorage (or empty array if none)
let arritems = []
let tempId = "";
// let arrUser = JSON.parse(localStorage.getItem("accounts")) || [];

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

  function hideContainers() {
     $("#transactionContainer").hide();
     $("#cancelRecordContainer").hide();
  }

   hideContainers();

  // NAVIGATION (switch between product and transaction views)
  $("#productNav").click(function () {
    $("#productDashboard").show();
    $("#transactionContainer").hide();
     $("#cancelRecordContainer").hide();

  });

  $("#transactionNav").click(function () {
    $("#productDashboard").hide();
    $("#transactionContainer").show();
    $("#cancelRecordContainer").hide();
  });

  $(document).on("click", "#cancelNav", function() {
    $("#productDashboard").hide();
    $("#transactionContainer").hide();
    $("#cancelRecordContainer").show();
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
  // $(document).on("click", ".editBtn", function () {
  //   let index = $(this).data("index");
  //   let item = arritems[index];

  //   // Fill form fields with product data
  //   $("#productName").val(item.name);
  //   $("#productPrice").val(item.price);
  //   $("#categoryFilter").val(item.category);
  //   $("#productQty").val(item.stock);
  //   $("#productDescription").val(item.description);
  //   $("#productImage").val(item.img);

  //   // Save index to know we're editing
  //   editingIndex = index;
  // });

  // Generate a random product ID
  // function generateProductId(length = 6) {
  //   const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  //   let id = "";

  //   for (let i = 0; i < length; i++) {
  //     const randomIndex = Math.floor(Math.random() * chars.length);
  //     id += chars[randomIndex];
  //   }

  //   return id;
  // }

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
  async function displayItems() {
    $("#itemContainer").html(" ");

    const res = await fetch(`adminProductdb.php?search=${encodeURIComponent($("#searchInput").val())}&price=${encodeURIComponent($("#filterSelect").val())}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      console.error("Failed to fetch products:", res.statusText);
      return;
    }

    arritems = await res.json();
    


    if (Array.isArray(arritems) && arritems.length !== 0) {

      // Reload latest data
      $.each(arritems, function (index, item) {  

        // Create product card
        let card = `
            <div class="bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col hover:border-slate-300 hover:shadow-md transition-all duration-200">
              <img src="${item.img}" alt="${item.name}" class="w-full h-36 object-contain bg-slate-50 p-3">
              <div class="px-4 pt-3">
                <span class="inline-block text-xs font-medium px-2 py-1 rounded-full bg-blue-100 text-blue-800">${item.category ?? 'Product'}</span>
              </div>
              <div class="flex flex-col gap-1 px-4 pt-2 pb-3 flex-1">
                <p class="text-sm font-semibold text-slate-900 m-0">${item.name}</p>
                <p class="text-xs text-slate-500 leading-relaxed line-clamp-2 m-0">${item.description}</p>
                <div class="flex justify-between items-center mt-2">
                  <span class="text-base font-bold text-slate-900">₱${Number(item.price).toLocaleString()}</span>
                  <span class="text-xs px-2 py-1 rounded-full border ${item.stock <= 5 ? 'bg-red-50 text-red-700 border-red-200' : 'bg-slate-100 text-slate-500 border-slate-200'}">Stock: ${item.stock}</span>
                </div>
              </div>
              <div class="flex gap-2 px-4 pb-4">
                <button class="flex-1 py-2 text-xs font-medium rounded-lg bg-amber-100 text-amber-900 hover:bg-amber-200 transition-colors border-none cursor-pointer" type="button" onclick="editProduct(${item})">Edit</button>
                <button class="flex-1 py-2 text-xs font-medium rounded-lg bg-red-100 text-red-800 hover:bg-red-200 transition-colors border-none cursor-pointer" type="button" onclick="deleteProduct(${item.productId}, '${item.name}')">Delete</button>
              </div>
            </div>
            `;
        // Add card to page
        $("#itemContainer").append(card);
      });
    }
    clearBtn();
  }




  // HANDLE FORM SUBMISSION (ADD / EDIT PRODUCT)
  // function productFormSubmit(e) {
  //   e.preventDefault();

  //   // Get input values
  //   let name = $("#productName").val().trim();
  //   let price = parseFloat($("#productPrice").val());
  //   let category = $("#categoryFilter").val();
  //   let quantity = parseInt($("#productQty").val());
  //   let description = $("#productDescription").val().trim();
  //   let imageUrl = $("#productImage").val().trim();

  //   // VALIDATION
  //   if (name === "") {
  //     myToast("Product Name must not be empty.", "Danger");
  //     return;
  //   }

  //   if (description === "") {
  //     myToast("Product Description must not be empty.", "Danger");
  //     return;
  //   }

  //   if (!imageUrl) {
  //     myToast("Product must have an image.", "Danger");
  //     return;
  //   }

  //   if (category === "all") {
  //     myToast("Please select a category for the product.", "Danger");
  //     return;
  //   }

  //   if (isNaN(price) || isNaN(quantity)) {
  //     myToast("Please enter valid numbers for Product Price and Quantity.", "Danger");
  //     return;
  //   }

  //   if (price <= 0 || quantity <= 0) {
  //     myToast("Product Price and Quantity must be greater than zero.", "Danger");
  //     return;
  //   }

  //   // Create new product object
  //   let newItem = new Product(
  //     name,
  //     price,
  //     category,
  //     quantity,
  //     imageUrl,
  //     description,
  //     generateProductId()
  //   );


  //   // ADD or UPDATE
  //   if (editingIndex === -1) {
  //     arritems.push(newItem);
  //     alert("Product added successfully!");
  //   } else {
  //     arritems[editingIndex] = newItem;
  //     alert("Product updated successfully!");
  //     editingIndex = -1;
  //   }

  //   saveItems();
  //   displayItems();
  //   clearItemForm();
  // }

  // SAVE PRODUCTS to localStorage
  // function saveItems() {
  //   localStorage.setItem("products", JSON.stringify(arritems));
  // }

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

  // declaredTransaction();
  // OPEN CLEAR STORAGE MODAL
  $(document).on("click", "#clearStorage", () => {
    $("#myModal").fadeIn();
  });

  window.deleteProduct = function(id, productName) {
    tempId = id;
    $("#itemSelected").html(productName);
    $("#deleteItemModal").fadeIn();
  }

  $(document).on("click", ".close, #deleteItemCancel", () => {
    $("#deleteItemModal").fadeOut();
  })



  $(document).on("click", "#deleteItemConfirm", async () => {
      try {
        const res = await fetch(`adminProductdb.php?id=${tempId}`, {
          method: "DELETE"
        });

        if (!res.ok) {
            console.log("something went wrong");
            return;
        }
        displayItems();
        $("#deleteItemModal").fadeOut();
        myToast("Item Successfully Deleted", "Success");
      } catch (error) { 
        console.log(error);
      }
  })

  // CLOSE MODAL
  $(document).on("click", ".close, #modalCancel", () => {
    
    $("#myModal").fadeOut();
  });

  // CONFIRM CLEAR STORAGE
  $("#modalConfirm").click(async function () {
    $("#myModal").fadeOut();
    const res = await fetch('adminProductdb.php', {
      method: 'DELETE',
    });

    if (!res.ok) {
      console.error("Failed to clear storage:", res.statusText);
      return;
    }
      displayItems();
      myToast("Storage cleared!", "Success");

  });

});