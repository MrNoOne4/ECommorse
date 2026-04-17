
"use strict";


let products = [];
// Retrieve login status from localStorage (defaults to false if not found)

// Handles cart button click - navigates to cart if logged in, otherwise shows login form
async function cartBtn() {
  let isLogin = await checkUserSessions();
  if (isLogin.loggedIn) {
    navigate(1);
    return;
  }
  showForms();
}

// Sets up click event listeners for navigation menu items
async function navigation() {
  let listItems = document.querySelectorAll("li");


  // Loop through the items using a basic for loop
  for (let i = 0; i < listItems.length; i++) {
    
    listItems[i].addEventListener("click", async function () {
      let isLogin = await checkUserSessions();
      // If user is logged in, hide other pages and show the selected one
      if (isLogin.loggedIn) {
        hidePages(i); // use index from the loop
        // If cart or transaction pages are clicked, render the cart
        if (i === 1 || i === 2) {
          renderCart();
        }
      } else {
        // If not logged in, show login/signup forms
        showForms();
      }
    });
  }
}

// Clears all form inputs in the checkout form and resets dropdown/radio selections
function resetCheckOutForm() {
  const input = document.querySelectorAll("#checkOut > input");
  // Clear all text input values
  for (let i = 0; i < input.length; i++) {
    input[i].value = " ";
  }
  // Reset municipality dropdown to first option (unused variable - TypeScript warning)
  const municipality = (document.getElementById(
    "select-municipality-input-3",
  ).selectedIndex = 0);
  // Reset radio button to unchecked (unused variable - TypeScript warning)
  const radio = (document.querySelector('input[type="radio"]').checked = false);
}

// Initialize navigation on page load
navigation();

// Displays the login and signup forms by removing/adding CSS translation classes
function showForms() {
  document.querySelector("#loginForm").classList.remove("-translate-y-[200%]");
  document.querySelector("#loginForm").classList.add("-translate-y-1/2");
  // Bring all form containers to the front with high z-index
  let formContainers = document.querySelectorAll(".formContainer");

  for (let i = 0; i < formContainers.length; i++) {
    formContainers[i].style.zIndex = "999";
  }
}

// Container elements for product cards and cart table body
const cardContainer = document.querySelector(".cardContainer");
const tbody = document.querySelector(".tbody");

// Retrieve accounts from localStorage or initialize as empty array
let accounts = JSON.parse(localStorage.getItem("account")) || [];

// Hide all pages on initial load
hidePages(0);

// ── Products ──────────────────────────────────────────────────────────────
// Retrieve products from localStorage
async function updateAuthButtons() {
  let isLogin = await checkUserSessions();

  const logoutBtn = document.getElementById("logoutBtn");
  const btn = document.getElementById("showLoginForm");

  logoutBtn.classList.toggle("hidden", !isLogin.loggedIn);
  btn.classList.toggle("hidden", isLogin.loggedIn);
}


async function fetchProducts() {
  try {
    const response = await fetch("Productdb.php", {
      method: "GET",
    });

    if (!response.ok) {
      throw new Error("Network response was not ok");
    }

    const data = await response.json();

    return data;
  } catch (error) {
    console.log(error);
  }
}



// Global function to remove product from cart (accessible via onclick handlers)
window.removeFromCart = (productCode) => {
  // Show confirmation modal
  document.getElementById("thisModals").classList.add("z-[9999]");
  // Set up confirmation callback
  window.confirmDelete = () => {
    document.getElementById("thisModals").classList.remove("z-[9999]");
    removeCart(productCode);
    // Show success notification
    toast(
      " Product successfully deleted. The item has been removed from the list.",
      true,
      "#toastRemove",
    );

    document.getElementById("thisModals").classList.add("z-[-1]");
  };
};

// Retrieves the shopping cart for the current user from localStorage
function getCart() {
  const token = localStorage.getItem("token");
  if (!token) return [];

  const stored = localStorage.getItem(`cart_${token}`);
  if (!stored) return [];

  try {
    return JSON.parse(stored);
  } catch (err) {
    console.warn("Invalid JSON in localStorage for transact_", token);
    return [];
  }
}

// Retrieves today's date from localStorage or creates it if it doesn't exist
function getTodayDate() {
  const date = localStorage.getItem("date");
  if (!date) {
    localStorage.setItem(
      "date",
      JSON.stringify(new Date().toLocaleDateString()),
    );
  }

  return date;
}

// Retrieves all transactions for the current user from localStorage
function getTransaction() {
  const token = localStorage.getItem("token");

  if (!token) return [];

  const stored = localStorage.getItem(`transact_${token}`);
  if (!stored) return [];

  try {
    return JSON.parse(stored);
  } catch (err) {
    console.warn("Invalid JSON in localStorage for transact_", token);
    return [];
  }
}

// Saves transaction data to localStorage for both user and admin views
function saveTransaction(transactionCart) {
  const token = localStorage.getItem("token");
  const getDate = new Date().toLocaleDateString();

  // Get admin transaction log
  const admin = JSON.parse(localStorage.getItem("transaction")) || {};

  const key = `transact_${token}`;
  const existing = JSON.parse(localStorage.getItem(key)) || {};

  // Initialize date arrays if they don't exist
  if (!existing[getDate]) {
    existing[getDate] = [];
  }

  if (!admin[getDate]) {
    admin[getDate] = [];
  }

  // Add transaction items to both user and admin records
  existing[getDate].push(...transactionCart);
  admin[getDate].push(...transactionCart);
  localStorage.setItem(`transact_${token}`, JSON.stringify(existing));

  localStorage.setItem(`transaction`, JSON.stringify(admin));
  console.log(admin);
}

// Saves the shopping cart to localStorage for the current user
function saveCart(cart) {
  const token = localStorage.getItem("token");
  localStorage.setItem(`cart_${token}`, JSON.stringify(cart));
  updateCartCount();
}

// Updates the cart item count display in the header
function updateCartCount() {
  const cart = getCart() || [];
  let total = 0;
  // Sum all product quantities in cart
  for (let i = 0; i < cart.length; i++) {
    total += cart[i].productQuantity;
  }

  document.getElementById("cartCount").textContent = total;
}

// Global function to add a product to cart (called via onclick handlers)
window.addToCart = (index) => {
  let cart = getCart() || [];

  // Enable the order summary button if it was disabled
  const orderSummaryBtn = document.querySelector("#orderSummary");
  orderSummaryBtn.disabled = false;
  orderSummaryBtn.style.cursor = "pointer";

  const product = products[index];

  // Check if product already exists in cart
  let existing = null;
  for (let i = 0; i < cart.length; i++) {
    if (cart[i].productCode === product.productCode) {
      existing = cart[i];
      break;
    }
  }

  // If product exists, increment quantity; otherwise add new item
  if (existing) {
    existing.productQuantity++;
    products[index].stock -= 1;
    localStorage.setItem("products", JSON.stringify(products));
    // displayProducts();
  } else {
    // Add new product to cart
    cart.push({
      productName: product.name,
      productImg: product.img,
      productPrice: product.price,
      productQuantity: 1,
      productCode: product.productCode,
    });

    products[index].stock -= 1;
    localStorage.setItem("products", JSON.stringify(products));
    // displayProducts();
  }

  // Save updated cart and refresh display
  saveCart(cart);

  // Show visual feedback that item was added
  const btns = document.querySelectorAll(".addToCartBtn");
  const btn = btns[index];
  if (btn) {
    const original = btn.innerHTML;
    btn.innerHTML = "✓ Added!";
    btn.style.background = "#16a34a";
    btn.style.cursor = "not-allowed";
    btn.disabled = true;

    // Revert button to original state after 1 second
    setTimeout(() => {
      btn.innerHTML = original;
      btn.style.background = "";
      btn.style.cursor = "default";
      btn.disabled = false;
    }, 1000);
  }
};

async function loadProducts() {
  products = await fetchProducts();
  displayProducts(products);
}


// Removes a product completely from the cart and restores stock
function removeCart(productCode) {
  // Find the product in the products array
  let productIndex = -1;
  for (let i = 0; i < products.length; i++) {
    if (products[i].productCode === productCode) {
      productIndex = i;
      break;
    }
  }

  if (productIndex === -1) return;

  const carts = getCart();

  // Find the product in the cart
  let cartIndex = -1;
  for (let i = 0; i < carts.length; i++) {
    if (carts[i].productCode === productCode) {
      cartIndex = i;
      break;
    }
  }

  if (cartIndex === -1) return;

  // Restore stock quantity
  products[productIndex].stock += carts[cartIndex].productQuantity;

  // Create new cart without the removed item
  const newCart = [];
  for (let i = 0; i < carts.length; i++) {
    if (i !== cartIndex) {
      newCart.push(carts[i]);
    }
  }

  // Update localStorage and refresh display
  localStorage.setItem("products", JSON.stringify(products));
  saveCart(newCart);

  renderCart();
  // displayProducts();
}
async function initializedProfile() {
  const session = await checkUserSessions();

  const profile = document.getElementById("profile");
  const profileInitial = document.getElementById("profileInitial");
  const initialBackground = document.getElementById("initialBackground");
  const initial = document.getElementById("initial");

  if (!profile || !profileInitial || !initialBackground || !initial) {
    console.error("Missing DOM elements");
    return;
  }

  if (!session || !session.loggedIn) {
    profile.classList.remove("block");
    profile.classList.add("hidden");
    return;
  }

  const req = await fetch(`profile.php`, {
    method: "GET",
    credentials: "include"
  });

  const data = await req.json();

  const { backgroundFirst, backgroundSecond, textColor, email } = data.user;

  const firstChar = email[0].toUpperCase();

  initial.innerHTML = firstChar;
  profileInitial.innerHTML = firstChar;

  initial.style.color = textColor;
  initialBackground.style.background = backgroundFirst;
  profileInitial.style.background = backgroundFirst;
  profileInitial.style.color = textColor;

  profile.classList.remove("hidden");
  profile.classList.add("block");
}


// Global function to change product quantity in cart (called via inline onclick)
window.changeQty = (productCode, delta, action) => {
  let cart = getCart() || [];
  let item = null;
  let cartIndex = -1;

  // Find item in cart
  for (let i = 0; i < cart.length; i++) {
    if (cart[i].productCode === productCode) {
      item = cart[i];
      cartIndex = i;
      break;
    }
  }

  if (!item) return;

  // Get fresh products data from localStorage
  products = JSON.parse(localStorage.getItem("products"));
  let productIndex = -1;

  // Find product in products array
  for (let i = 0; i < products.length; i++) {
    if (products[i].productCode === item.productCode) {
      productIndex = i;
      break;
    }
  }

  if (productIndex === -1) return;

  const product = products[productIndex];

  // Decrease quantity (delta is negative)
  if (action === "decrease") {
    item.productQuantity += delta;
    product.stock += 1;
  }

  // Check if product is out of stock
  if (product.stock <= 0) {
    toast(
      " Sorry, this product is currently out of stock",
      false,
      "#toastRemove",
    );
    return;
  }

  // Increase quantity (delta is positive)
  if (action === "increase" && product.stock > 0) {
    item.productQuantity += delta;
    product.stock -= 1;
  }

  // If quantity reaches 0, remove item from cart
  if (item.productQuantity === 0) {
    const newCart = [];
    for (let i = 0; i < cart.length; i++) {
      if (i !== cartIndex) {
        newCart.push(cart[i]);
      }
    }
    cart = newCart;
  }

  // Update localStorage and refresh display
  localStorage.setItem("products", JSON.stringify(products));
  saveCart(cart);
  renderCart();
  // displayProducts();
};



// Renders the shopping cart table and order summary modal
function renderCart() {
  let cart = getCart() || [];
  tbody.innerHTML = "";
  document.getElementById("Subtotal").innerHTML = "";
  document.getElementById("paymentContainer").innerHTML = "";

  // Remove old summary modal if it exists
  const oldSummary = document.getElementById("cartSummary");
  if (oldSummary) oldSummary.remove();

  // Show empty cart message if no items
  if (cart.length === 0) {
    document.querySelector("#orderSummary").disabled = true;
    document.querySelector("#orderSummary").style.cursor = "not-allowed";

    tbody.innerHTML = `
            <tr>
                <td colspan="5" class="px-6 py-12 text-center text-gray-400 text-lg">
                    🛒 Your cart is empty.
                    <a href="#" onclick="navigate(0)" class="text-[#C9A96E] underline ml-1">Continue shopping</a>
                </td>
            </tr>`;
    return;
  }

  let grandTotal = 0;
  // Build table rows for each cart item
  for (let i = 0; i < cart.length; i++) {
    let item = cart[i];
    const lineTotal = item.productPrice * item.productQuantity;
    grandTotal += lineTotal;

    tbody.innerHTML += `<tr class="group border-b border-red-500 hover:bg-amber-50/30 transition-all duration-200">
            <td class="px-5 py-4">
                <div class="flex items-center gap-3">
                    <div class="w-14 h-14 shrink-0 rounded-xl bg-gray-50 border border-gray-100 p-1.5 overflow-hidden">
                        <img
                            src="${item.productImg || "https://via.placeholder.com/80"}"
                            onerror="this.src='https://via.placeholder.com/80'"
                            class="w-full h-full object-contain mix-blend-multiply" />
                    </div>
                    <div class="min-w-0">
                        <p class="text-sm font-semibold text-slate-800 truncate max-w-[180px]">${item.productName}</p>
                        <p class=" text-md font-mono text-slate-400 mt-0.5 tracking-wide">#${item.productCode}</p>
                    </div>
                </div>
            </td>

            <td class="px-5 py-4">
                <span class=" text-md font-semibold uppercase tracking-widest text-slate-400 block mb-0.5">Unit</span>
                <span class="text-sm font-semibold text-slate-700">₱${Number(item.productPrice).toFixed(2)}</span>
            </td>

            <td class="px-5 py-4">
                <span class=" text-md font-semibold uppercase tracking-widest text-slate-400 block mb-1.5">Qty</span>
                <div class="inline-flex items-center rounded-xl border border-gray-200 bg-white shadow-xs overflow-hidden">
                    <button
                        onclick="changeQty('${item.productCode}', -1, 'decrease')"
                        class="w-8 h-8 flex items-center justify-center text-slate-500 hover:bg-red-50 hover:text-red-500 transition-colors cursor-pointer text-base font-bold">−</button>
                    <span class="w-8 h-8 flex items-center justify-center text-sm font-bold text-slate-800 border-x border-gray-200 bg-gray-50">${item.productQuantity}</span>
                    <button
                        onclick="changeQty('${item.productCode}', 1, 'increase')"
                        class="w-8 h-8 flex items-center justify-center text-slate-500 hover:bg-emerald-50 hover:text-emerald-600 transition-colors cursor-pointer text-base font-bold">+</button>
                </div>
            </td>

            <td class="px-5 py-4">
                <span class=" text-md font-semibold uppercase tracking-widest text-slate-400 block mb-0.5">Total</span>
                <span class="text-sm font-bold text-amber-600">₱${lineTotal.toFixed(2)}</span>
            </td>

            <td class="px-5 py-4">
                <button
                    onclick="removeFromCart('${item.productCode}')"
                    class="w-8 h-8 rounded-xl bg-red-50 hover:bg-red-500 border border-red-100 hover:border-transparent text-red-400 hover:text-white flex items-center justify-center transition-all duration-200 cursor-pointer group/btn shadow-xs">
                    <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M18 6L6 18M6 6l12 12"/>
                    </svg>
                </button>
            </td>
        </tr>`;
  }

  // Create and append order summary modal
  const summaryEl = document.createElement("div");
  summaryEl.id = "cartSummary";
  summaryEl.className =
    "flex justify-end px-6 py-8 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-999999 hidden fixed";
  summaryEl.innerHTML = `
        <div class="bg-white rounded-2xl shadow-md p-6 min-w-[280px] border border-gray-100" >
            <span class="flex justify-between flex-col"><h3 class="text-lg font-bold mb-4 text-gray-800">Order Summary
            <button id="closeModal" class="inline-flex items-center justify-center border align-middle select-none font-sans font-medium text-center transition-all duration-300 ease-in disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed data-[shape=pill]:rounded-full data-[width=full]:w-full focus:shadow-none text-sm rounded-md py-2 px-4 shadow-sm hover:shadow-md bg-slate-800 border-slate-800 text-slate-50 hover:bg-slate-700 hover:border-slate-700 ml-10 lg:ml-20 cursor-pointer"> &times; </button>
            </h3><span>
            <div class="flex justify-between text-base mb-2 text-gray-600">
                <span>Subtotal</span>
                <span class="font-semibold text-gray-800">₱${grandTotal.toFixed(2)}</span>
            </div>
            <div class="flex justify-between text-base mb-4 text-gray-600">
                <span>Shipping</span>
                <span class="text-green-600 font-semibold">₱50</span>
            </div>
            <hr class="mb-4 border-gray-200"/>
            <div class="flex justify-between text-xl font-bold mb-5">
                <span>Total</span>
                <span class="text-[#C9A96E]">₱${Number(grandTotal.toFixed(2)) + 50}</span>
            </div>
            <button id="checkOutBtn"
                class="w-full bg-[#C9A96E] hover:bg-yellow-700 text-white font-semibold py-3 rounded-xl transition-colors cursor-pointer text-base">
                Proceed to Checkout →
            </button>
        </div>`;

  // Update subtotal and total payment display
  document.getElementById("Subtotal").innerHTML = grandTotal.toFixed(2);
  document.getElementById("paymentContainer").innerHTML =
    grandTotal.toFixed(2) !== 0
      ? "₱" + (50 + Number(grandTotal.toFixed(2)))
      : "0";

  // Insert summary modal into DOM
  const tableWrapper = document.querySelector(".relative.overflow-x-auto");
  tableWrapper.parentNode.insertBefore(summaryEl, tableWrapper.nextSibling);
}

// Renders transaction history for the current user
function renderTransaction() {
  let transactionCart = getTransaction() || [];
  const date = new Date().toLocaleDateString();
  const dateContainer = document.getElementById("dateContainer");

  const transactionContainer = document.getElementById("transactionContainer");
  transactionContainer.innerHTML = "";
  dateContainer.innerHTML = "";
  
  // Show empty state if no transactions
  if (transactionCart.length === 0) {
    transactionContainer.innerHTML = `

            <h1 class="text-center text-2xl">
              🛒 Your Transaction cart is empty.
              <a href="#" onclick="navigate(0)" class="text-[#C9A96E] underline ml-1">Continue shopping</a>
              </h1>`;
    return;
  }

  // Render transactions grouped by date
  if (
    Array.isArray(transactionCart[date]) &&
    transactionCart[date].length !== 0
  ) {
    Object.keys(transactionCart).forEach((key) => {
      dateContainer.innerHTML += `<strong>${key}</strong`;

      // Render each transaction item
      transactionCart[key].forEach((item, i) => {
        transactionContainer.innerHTML += `
        <div class="flex flex-col sm:flex-row sm:items-center gap-4 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 mb-3">
    
            <div class="flex items-center gap-3 flex-1 min-w-0">
                <div class="w-16 h-16 bg-gray-50 rounded-xl p-2 shrink-0 border border-gray-100">
                    <img src='${item.productImg}' class="w-full h-full object-contain" />
                </div>
                <div class="min-w-0">
                    <h6 class="text-sm font-semibold text-slate-800 truncate">${item.productName}</h6>
                    <p class="text-xs text-slate-400 mt-0.5 font-medium tracking-wide uppercase">Order</p>
                    <p class="text-xs text-slate-500 mt-1 font-mono">#${item.productCode}</p>
                </div>
            </div>

            <div class="hidden sm:block w-px h-10 bg-gray-100 shrink-0"></div>

            <div class="flex items-center gap-5 sm:gap-6 flex-wrap sm:flex-nowrap">
                <div class="flex flex-col gap-0.5 min-w-[52px]">
                    <span class=" text-md font-semibold uppercase tracking-widest text-slate-400">Price</span>
                    <span class="text-sm font-semibold text-slate-800">₱${Number(item.productPrice).toLocaleString()}</span>
                </div>

                <div class="flex flex-col gap-0.5 min-w-[36px]">
                    <span class=" text-md font-semibold uppercase tracking-widest text-slate-400">Qty</span>
                    <span class="text-sm font-semibold text-slate-800">${item.productQuantity}</span>
                </div>

                <div class="flex flex-col gap-0.5">
                    <span class=" text-md font-semibold uppercase tracking-widest text-slate-400">Status</span>
                    <span class="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-full py-1 px-2.5">
                        <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
                        Delivered
                    </span>
                </div>

                <div class="flex flex-col gap-0.5 min-w-[64px]">
                    <span class=" text-md font-semibold uppercase tracking-widest text-slate-400">Total</span>
                    <span class="text-sm font-bold text-amber-600">₱${(item.productPrice * item.productQuantity).toLocaleString()}</span>
                </div>
            </div>

            <div class="hidden sm:block w-px h-10 bg-gray-100 shrink-0"></div>

            <div class="shrink-0 w-full sm:w-auto">
                <button 
                    onclick="requestRefund('${item.productCode}', '${item.productName}', ${i})"
                    class="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 cursor-pointer bg-red-50 hover:bg-red-500 text-red-500 hover:text-white border border-red-100 hover:border-transparent text-xs font-semibold py-2 px-4 rounded-xl transition-all duration-200 group">
                    <svg class="w-3 h-3 transition-transform duration-200 group-hover:-rotate-45" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
                        <path d="M3 3v5h5"/>
                    </svg>
                    Request Refund
                </button>
            </div>

        </div>`;
      });
    });
  }
}

// Initial render of transaction history on page load
renderTransaction();

// ── Search and Filter System ──────────────────────────────────────────────────
// Stores the current search input value
let searchValue = "";

// Stores the currently selected category filter
let categoryValue = "all";

/**
 * Filters products based on search text and category
 */
async function applyFilters() {

  const res = await fetch(`Productdb.php?category=${encodeURIComponent(categoryValue)}&search=${encodeURIComponent(searchValue)}`, {
    method: "GET",
  })

  if (!res.ok) {
    console.error("Failed to fetch products:", res.message);
    return;
  }

  const products = await res.json();
  displayProducts(products);
}

// Listen for typing in the search input
document.getElementById("searchInput").addEventListener("input", (e) => {
  searchValue = e.target.value.toLowerCase();
  applyFilters();
});

// Listen for category dropdown changes
document.getElementById("categoryFilter").addEventListener("change", (e) => {
  categoryValue = e.target.value;
  applyFilters();
});



async function checkUserSessions() {
  const res = await fetch('checkSession.php', {
    credentials: "include"
  })
  const data = await res.json();

  return data;
}



/**
 * Renders product cards to the UI
 */
async function displayProducts(products) {
  // Ensure products array exists and is not empty
  if (Array.isArray(products) && products.length !== 0) {

    // Clear existing product cards
    cardContainer.innerHTML = "";

    // Check login status from localStorage
    

    // Loop through filtered products
    for (let i = 0; i < products.length; i++) {
      let e = products[i];
      let isLogin = await checkUserSessions();
      
      // Generate 5 star icons (static UI rating)
      let stars = "";
      for (let j = 0; j < 5; j++) {
        stars += `<svg class="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
          <path d="M13.849 4.22c-.684-1.626-3.014-1.626-3.698 0L8.397 8.387l-4.552.361c-1.775.14-2.495 2.331-1.142 3.477l3.468 2.937-1.06 4.392c-.413 1.713 1.472 3.067 2.992 2.149L12 19.35l3.897 2.354c1.52.918 3.405-.436 2.992-2.15l-1.06-4.39 3.468-2.938c1.353-1.146.633-3.336-1.142-3.477l-4.552-.36-1.754-4.17Z"/>
        </svg>`;
      }

      // Append product card HTML
      cardContainer.innerHTML += `
        <div class="w-full bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200">

          <!-- Product Image -->
          <img class="rounded-lg mb-4 h-48 w-full object-contain cursor-default hover:scale-105 transition-transform duration-300 ease-in-out"
            src="${e.img || "https://via.placeholder.com/200"}"
            onerror="this.src='https://via.placeholder.com/200'"
            alt="${e.name}" />

          <!-- Rating -->
          <div class="flex items-center gap-2 mb-3">
            <div class="flex">
              ${stars}
            </div>
            <span class="text-xs bg-yellow-50 text-yellow-700 px-2 py-0.5 rounded font-medium">4.8 / 5</span>
          </div>

          <!-- Product Name -->
          <h2 class="text-base font-bold text-gray-800 mb-1 line-clamp-1">${e.name}</h2>

          <!-- Description -->
          <p class="text-xs text-gray-400 mb-1 line-clamp-2">${e.description}</p>

          <!-- Stock -->
          <p class="text-xs text-gray-400 mb-4">Stock: ${e.stock}</p>

          <!-- Price + Add to Cart -->
          <div class="flex items-center justify-between">
            <span class="text-xl font-bold text-gray-900">₱${e.price}</span>

            <!-- Add to cart button -->
            <button
              type="button"
              class="addToCartBtn inline-flex items-center gap-1.5 cursor-pointer bg-black text-white font-medium text-sm px-3 py-2 rounded-lg hover:bg-gray-800 transition-colors"
              onclick="${isLogin.loggedIn ? `addToCart(${i})` : `showForms()`}"
              ${e.stock <= 0 ? "disabled" : ""}
            >
              <!-- Cart Icon -->
              <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M5 4h1.5L9 16m0 0h8m-8 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm8 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm-8.5-3h9.25L19 7H7.312"/>
              </svg>
              Add to cart
            </button>
          </div>
        </div>`;
    }
  }
}

/**
 * Displays a toast notification
 * @param {string} message - Message to show
 * @param {boolean} status - true = success, false = error
 * @param {string} element - CSS selector for toast container
 */
function toast(message, status, element) {
  const toastEl = document.querySelector(element);
  if (toastEl === null) return;

  // Bring toast into view by removing dismiss class
  toastEl.classList.remove("top-[200%]");

  if (status) {
    // Success toast styling
    toastEl.innerHTML = `
      <span class="text-xl">✅</span>
      <span class="font-medium">${message}</span>
    `;
    toastEl.classList.add("top-10", "bg-green-500", "text-white", "z-9999");

    // Hide after 2 seconds
    setTimeout(() => {
      toastEl.classList.remove(
        "top-10",
        "bg-green-500",
        "text-white",
        "z-9999",
      );
    }, 2000);
  } else {
    // Error toast styling
    toastEl.innerHTML = `
      <span class="text-xl">⚠️</span>
      <span class="font-medium">${message}</span>
    `;
    toastEl.classList.add("top-10", "bg-red-500", "text-white", "z-9999");

    // Hide after 2 seconds
    setTimeout(() => {
      toastEl.classList.remove("top-10", "bg-red-500", "text-white", "z-9999");
    }, 2000);
  }
}


// ── Initial Page Setup ────────────────────────────────────────────────────────
// Update authentication UI buttons based on login status
// (async () => {
//   await updateAuthButtons();
// } )();
(async () => {
  await updateAuthButtons();
  await initializedProfile();
})();

loadProducts();
// Update cart count in header
updateCartCount();
// Render the shopping cart table
renderCart();

