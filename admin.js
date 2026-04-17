// Get products and accounts from localStorage (or empty array if none)
let arritems = []
let tempId = "";
let currentEditId = -1;

// Used to track if user is editing an existing product
let editingIndex = -1;

// Expose modal functions globally (needed for onclick= in HTML)
const overlay = document.querySelector(".overlay");

window.closeModal = function () {
  overlay.classList.remove("active");
}

window.openModal = function () {
  overlay.classList.add("active");
}

// Runs when the page is fully loaded
$(document).ready(async function () {

  // Display all products on load
  displayItems();

  // Logout button
  $("#logoutNav").click(async function () {
    if (confirm("Do you want to log out?")) {
      const res = await fetch('logout.php');
      const data = await res.json();

      if (!res.ok) {
        myToast("Logout unsuccessful!", "Danger");
        return;
      }

      return (window.location.href = "index.html");
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

  $(document).on("click", "#cancelNav", function () {
    $("#productDashboard").hide();
    $("#transactionContainer").hide();
    $("#cancelRecordContainer").show();
  });

  // PRODUCT FORM submission (Add new product)
  $("#productForm").submit(function (e) {
    productFormSubmit(e);
  });

  // UPDATE FORM submission (Edit existing product)
  $("#productUpdateForm").submit(function (e) {
    productUpdateFormSubmit(e);
  });

  // SEARCH (filters products while typing)
  $("#searchInput").on("input", function () {
    displayItems();
  });

  // FILTER (based on price category)
  $("#filterSelect").change(function () {
    displayItems();
  });

  // EDIT PRODUCT — fetch data then open modal
  window.editProduct = async function (id) {
    currentEditId = id;
    const req = await fetch(`adminProductdb.php?id=${encodeURIComponent(id)}`, {
      method: "GET"
    });

    if (!req.ok) {
      myToast("Failed to fetch product.", "Danger");
      return;
    }

    const result = await req.json();

    $("#productUpdateName").val(result.name);
    $("#productUpdatePrice").val(result.price);
    $("#categoryUpdateFilter").val(result.category);
    $("#productUpdateQty").val(result.stock);
    $("#productUpdateDescription").val(result.description);
    $("#productUpdateImage").val(result.img);
   $("#images").attr("src", result.img);
    window.openModal();
  }

  // Custom toast notification
  function myToast(message, status) {
    var $x = $("#snackbar");
    $x.html(message);

    if (status === "Danger") {
      $x.css("background-color", "red");
    } else {
      $x.css("background-color", "green");
    }

    $x.addClass("show");

    setTimeout(function () {
      $x.removeClass("show");
    }, 3000);
  }

  function clearBtn() {
    $("#clearStorage").prop(
      "disabled",
      Array.isArray(arritems) && arritems.length !== 0 ? false : true
    );

    $("#clearStorage").css(
      "cursor",
      Array.isArray(arritems) && arritems.length !== 0 ? "pointer" : "not-allowed"
    );
  }

  // DISPLAY PRODUCTS
  async function displayItems() {
    $("#itemContainer").html("");

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
      $.each(arritems, function (index, item) {

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
              <button class="flex-1 py-2 text-xs font-medium rounded-lg bg-amber-100 text-amber-900 hover:bg-amber-200 transition-colors border-none cursor-pointer" type="button" onclick="editProduct(${item.productId})">Edit</button>
              <button class="flex-1 py-2 text-xs font-medium rounded-lg bg-red-100 text-red-800 hover:bg-red-200 transition-colors border-none cursor-pointer" type="button" onclick="deleteProduct(${item.productId}, '${item.name}')">Delete</button>
            </div>
          </div>
        `;

        $("#itemContainer").append(card);
      });
    }

    clearBtn();
  }

  // Close modal when clicking outside
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) {
      window.closeModal();
    }
  });

  // ADD NEW PRODUCT
  async function productFormSubmit(e) {
    e.preventDefault();

    let name = $("#productName").val().trim();
    let price = parseFloat($("#productPrice").val());
    let category = $("#categoryFilter").val();
    let quantity = parseInt($("#productQty").val());
    let description = $("#productDescription").val().trim();
    let imageUrl = $("#productImage").val().trim();

    if (name === "") { myToast("Product Name must not be empty.", "Danger"); return; }
    if (description === "") { myToast("Product Description must not be empty.", "Danger"); return; }
    if (!imageUrl) { myToast("Product must have an image.", "Danger"); return; }
    if (category === "all") { myToast("Please select a category.", "Danger"); return; }
    if (isNaN(price) || isNaN(quantity)) { myToast("Please enter valid numbers for Price and Quantity.", "Danger"); return; }
    if (price <= 0 || quantity <= 0) { myToast("Price and Quantity must be greater than zero.", "Danger"); return; }

    try {
      const res = await fetch('adminProductdb.php', {
        method: 'POST',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, price, category, stock: quantity, img: imageUrl, description })
      });

      if (!res.ok) {
        myToast("Failed to add product.", "Danger");
        return;
      }

      myToast("Product added successfully!", "Success");
      clearItemForm();
      displayItems();
    } catch (err) {
      console.error(err);
      myToast("An error occurred.", "Danger");
    }
  }

  // UPDATE EXISTING PRODUCT
  async function productUpdateFormSubmit(e) {
    e.preventDefault();

    let name = $("#productUpdateName").val().trim();
    let price = parseFloat($("#productUpdatePrice").val());
    let category = $("#categoryUpdateFilter").val();
    let quantity = parseInt($("#productUpdateQty").val());
    let description = $("#productUpdateDescription").val().trim();
    let imageUrl = $("#productUpdateImage").val().trim();

    if (name === "") { myToast("Product Name must not be empty.", "Danger"); return; }
    if (description === "") { myToast("Product Description must not be empty.", "Danger"); return; }
    if (!imageUrl) { myToast("Product must have an image.", "Danger"); return; }
    if (category === "all") { myToast("Please select a category.", "Danger"); return; }
    if (isNaN(price) || isNaN(quantity)) { myToast("Please enter valid numbers for Price and Quantity.", "Danger"); return; }
    if (price <= 0 || quantity <= 0) { myToast("Price and Quantity must be greater than zero.", "Danger"); return; }

    try {
      const res = await fetch(`adminProductdb.php?id=${encodeURIComponent(currentEditId)}`, {
        method: 'PATCH',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, price, category, stock: quantity, img: imageUrl, description })
      });

      if (!res.ok) {
        myToast("Failed to  update product.", "Danger");
        return;
      }

      myToast("Product updated successfully!", "Success");
      window.closeModal();
      displayItems();
    } catch (err) {
      console.error(err);
      myToast("An error occurred.", "Danger");
    }
  }

  // CLEAR ADD FORM
  function clearItemForm() {
    $("#productName").val("");
    $("#productPrice").val("");
    $("#categoryFilter").eq(0).prop("selected", true);
    $("#productQty").val("");
    $("#productDescription").val("");
    $("#productImage").val("");
  }

  // OPEN CLEAR STORAGE MODAL
  $(document).on("click", "#clearStorage", () => {
    $("#myModal").fadeIn();
  });

  // DELETE PRODUCT — show confirmation modal
  window.deleteProduct = function (id, productName) {
    tempId = id;
    $("#itemSelected").html(productName);
    $("#deleteItemModal").fadeIn();
  }

  $(document).on("click", ".close, #deleteItemCancel", () => {
    $("#deleteItemModal").fadeOut();
  });

  $(document).on("click", "#deleteItemConfirm", async () => {
    try {
      const res = await fetch(`adminProductdb.php?id=${tempId}`, {
        method: "DELETE"
      });

      if (!res.ok) {
        myToast("Failed to delete item.", "Danger");
        return;
      }

      displayItems();
      $("#deleteItemModal").fadeOut();
      myToast("Item Successfully Deleted", "Success");
    } catch (error) {
      console.log(error);
    }
  });

  // CLOSE CLEAR MODAL
  $(document).on("click", ".close, #modalCancel", () => {
    $("#myModal").fadeOut();
  });

  // CONFIRM CLEAR ALL
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