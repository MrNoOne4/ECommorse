"use strict";

let products = [];

async function cartBtn() {
  let isLogin = await checkUserSessions();
  if (isLogin.loggedIn) {
    navigate(1);
    return;
  }
  showForms();
}

async function navigation() {
  let listItems = document.querySelectorAll("li");
  for (let i = 0; i < listItems.length; i++) {
    listItems[i].addEventListener("click", async function () {
      let isLogin = await checkUserSessions();
      if (isLogin.loggedIn) {
        hidePages(i);
        if (i === 1 || i === 2) {
          renderCart();
        }
      } else {
        showForms();
      }
    });
  }
}

function resetCheckOutForm() {
  const input = document.querySelectorAll("#checkOut > input");
  for (let i = 0; i < input.length; i++) {
    input[i].value = " ";
  }
  document.getElementById("select-municipality-input-3").selectedIndex = 0;
  document.querySelector('input[type="radio"]').checked = false;
}

navigation();

function showForms() {
  document.querySelector("#loginForm").classList.remove("-translate-y-[200%]");
  document.querySelector("#loginForm").classList.add("-translate-y-1/2");
  let formContainers = document.querySelectorAll(".formContainer");
  for (let i = 0; i < formContainers.length; i++) {
    formContainers[i].style.zIndex = "999";
  }
}

const cardContainer = document.querySelector(".cardContainer");
const tbody = document.querySelector(".tbody");

let accounts = JSON.parse(localStorage.getItem("account")) || [];

hidePages(0);

async function updateAuthButtons() {
  let isLogin = await checkUserSessions();
  const logoutBtn = document.getElementById("logoutBtn");
  const btn = document.getElementById("showLoginForm");
  logoutBtn.classList.toggle("hidden", !isLogin.loggedIn);
  btn.classList.toggle("hidden", isLogin.loggedIn);
}

async function fetchProducts() {
  try {
    const response = await fetch("Productdb.php", { method: "GET" });
    if (!response.ok) throw new Error("Network response was not ok");
    return await response.json();
  } catch (error) {
    console.log(error);
    return [];
  }
}

window.removeFromCart = async (productId, quantity) => {
  document.getElementById("thisModals").classList.add("z-[9999]");
  window.confirmDelete = () => {
    document.getElementById("thisModals").classList.remove("z-[9999]");
    removeCart(productId, quantity);
    toast(" Product successfully deleted.", true, "#toastRemove");
    document.getElementById("thisModals").classList.add("z-[-1]");
  };
};

async function getCart() {
  let isLogin = await checkUserSessions();
  if (!isLogin.loggedIn) return [];

  const userId = isLogin.user.ID;

  const req = await fetch(`shopping.php?id=${encodeURIComponent(userId)}`, {
    method: "GET",
    credentials: "include"
  });

  if (!req.ok) {
    console.log("Something went wrong fetching cart");
    return [];
  }

  return await req.json();
}

function getTodayDate() {
  const date = localStorage.getItem("date");
  if (!date) {
    localStorage.setItem("date", JSON.stringify(new Date().toLocaleDateString()));
  }
  return date;
}

function getTransaction() {
  const token = localStorage.getItem("token");
  if (!token) return {};
  const stored = localStorage.getItem(`transact_${token}`);
  if (!stored) return {};
  try {
    return JSON.parse(stored);
  } catch (err) {
    return {};
  }
}

const checkoutForm = document.getElementById("checkOut");

checkoutForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const cart = getCart();

  if (cart.length === 0) {
    toast("Your cart is empty. Please add items before proceeding to checkout.", false, "#toastProceed");
    return;
  }

  const name = document.getElementById("your_name")?.value.trim();
  const email = document.getElementById("your_email")?.value.trim();
  const city = document.getElementById("select-country-input-3")?.value;
  const municipality = document.getElementById("select-municipality-input-3")?.value;
  const phone = document.getElementById("phone-input")?.value.trim();
  const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked')?.value;

  if (!name || !email || !phone || !paymentMethod) {
    toast("Please fill in all required fields.", false, "#toastProceed");
    return;
  }

  const loading = document.getElementById("loading");
  const modal = document.getElementById("containerModal");

  try {
    loading?.classList.remove("z-[-1]");
    loading?.classList.add("z-[9999]");

    const res = await fetch("checkout.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ name, email, city, municipality, phone, paymentMethod })
    });

    const data = await res.json();

    if (!res.ok) {
      loading?.classList.remove("z-[9999]");
      loading?.classList.add("z-[-1]");
      toast(data.error || "Checkout failed. Please try again.", false, "#toastProceed");
      return;
    }

    // 🔥 smooth animation delay (success feel)
    await new Promise(resolve => setTimeout(resolve, 800));

    loading?.classList.remove("z-[9999]");
    loading?.classList.add("z-[-1]");

    modal?.classList.remove("hidden");

    resetCheckOutForm();

    // UI refresh
     
      await updateCartCount(),
      await renderCart(),
      await loadProducts(),
      await renderOrderHistory()


    // const token = localStorage.getItem("token");
    // localStorage.removeItem(`cart_${token}`);

  } catch (err) {
    loading?.classList.remove("z-[9999]");
    loading?.classList.add("z-[-1]");
    console.error(err);
    toast("An unexpected error occurred.", false, "#toastProceed");
  }
});


function saveTransaction(transactionCart) {
  const token = localStorage.getItem("token");
  const getDate = new Date().toLocaleDateString();




  

  const admin = JSON.parse(localStorage.getItem("transaction")) || {};
  const key = `transact_${token}`;
  const existing = JSON.parse(localStorage.getItem(key)) || {};

  if (!existing[getDate]) existing[getDate] = [];
  if (!admin[getDate]) admin[getDate] = [];

  existing[getDate].push(...transactionCart);
  admin[getDate].push(...transactionCart);

  localStorage.setItem(`transact_${token}`, JSON.stringify(existing));
  localStorage.setItem(`transaction`, JSON.stringify(admin));
}




async function saveCart(cart) {
  const token = localStorage.getItem("token");
  localStorage.setItem(`cart_${token}`, JSON.stringify(cart));
  updateCartCount();
}

async function updateCartCount() {
  const cart = await getCart();
  if (!Array.isArray(cart)) return;
  let total = 0;
  for (let i = 0; i < cart.length; i++) {
    total += cart[i].productQuantity;
  }
  document.getElementById("cartCount").textContent = total;
}

window.addToCart = async (productId, btn) => {
  const isLogin = await checkUserSessions();
  if (!isLogin.loggedIn) return;

  const userId = isLogin.user.ID;
  const product = products.find(p => String(p.productId) === String(productId));
  if (!product) return;

  try {
    const res = await fetch("shopping.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        userId,
        productId: product.productId,
        productName: product.name,
        productImg: product.img,
        productPrice: product.price
      })
    });

    if (!res.ok) return;

    await updateCartCount();
    await renderCart();

  } catch (err) {
    console.log(err);
  }

  if (btn) {
    const original = btn.innerHTML;
    btn.innerHTML = "✓ Added!";
    btn.style.background = "#16a34a";
    btn.disabled = true;

    setTimeout(async () => {
      btn.innerHTML = original;
      btn.style.background = "";
      btn.disabled = false;
      await loadProducts();
    }, 1000);
  }
};

async function loadProducts() {
  products = await fetchProducts();
  displayProducts(products);
}

async function removeCart(productId, quantity) {
  const session = await checkUserSessions();
  if (!session.loggedIn) return;

  const userId = session.user?.ID;

  let cart = await getCart();
  let item = cart.find(i => String(i.productId) === String(productId));
  if (!item) return;

  try {
    const res = await fetch('shopping.php', {
      method: "DELETE",
      headers: { "Content-type": "application/json" },
      body: JSON.stringify({ userId, productId, quantity })
    });

    if (!res.ok) {
      console.error(await res.text());
      return;
    }

    await updateCartCount();
    await loadProducts();
    await renderCart();
  } catch (error) {
    console.log(error);
  }
}

async function initializedProfile() {
  try {
    const session = await checkUserSessions();

    const profile = document.getElementById("profile");
    const profileInitial = document.getElementById("profileInitial");
    const initialBackground = document.getElementById("initialBackground");
    const initial = document.getElementById("initial");

    if (!profile || !profileInitial || !initialBackground || !initial) return;

    if (!session?.loggedIn) {
      profile.classList.add("hidden");
      profile.classList.remove("block");
      return;
    }

    const req = await fetch("profile.php", {
      method: "GET",
      credentials: "include",
    });

    if (!req.ok) throw new Error("Failed to fetch profile");

    const data = await req.json();

    const user = data?.user;
    if (!user) throw new Error("Invalid user data");

    const {
      backgroundFirst = "#ccc",
      backgroundSecond = "#999",
      textColor = "#000",
      email = "",
    } = user;

    const firstChar = email?.trim()?.charAt(0)?.toUpperCase() || "?";

    initial.textContent = firstChar;
    profileInitial.textContent = firstChar;

    initial.style.color = textColor;
    profileInitial.style.background = `linear-gradient(45deg, ${backgroundFirst}, ${backgroundSecond})`;;
    profileInitial.style.color = textColor;

    initialBackground.style.background = `linear-gradient(45deg, ${backgroundFirst}, ${backgroundSecond})`;

    profile.classList.remove("hidden");
    profile.classList.add("block");

  } catch (error) {
    console.error("Profile initialization error:", error);
  }
}

window.changeQty = async (productId, delta, action) => {
  const session = await checkUserSessions();
  if (!session.loggedIn) return;

  const userId = session.user.ID;

  let cart = await getCart();
  let item = cart.find(i => String(i.productId) === String(productId));
  if (!item) return;

  let newQty = item.productQuantity + delta;

  if (newQty <= 0) {
    await removeCart(productId, item.productQuantity);
    return;
  }

  try {
    const req = await fetch(`shopping.php?action=${encodeURIComponent(action)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ userId, productId, quantity: newQty })
    });

    if (!req.ok) {
      console.error(await req.text());
      return;
    }

    await updateCartCount();
    await loadProducts();
    await renderCart();
  } catch (err) {
    console.log(err);
  }
};


document.addEventListener("click", function (e) {

  // Show order summary panel
  if (e.target && e.target.id === "orderSummary") {
    const summary = document.getElementById("cartSummary");
    const modalContainer = document.getElementById("modalContainer");
    if (summary) {
      summary.classList.remove("hidden");
      summary.style.display = "flex";
    }
    if (modalContainer) {
      modalContainer.style.display = "block";
    }
    return;
  }

  if (e.target && e.target.id === "closeModal") {
    const summary = document.getElementById("cartSummary");
    const modalContainer = document.getElementById("modalContainer");
    if (summary) {
      summary.classList.add("hidden");
      summary.style.display = "none";
    }
    if (modalContainer) {
      modalContainer.style.display = "none";
    }
    return;
  }

  if (e.target && e.target.id === "checkOutBtn") {
    navigate(2);
    const summary = document.getElementById("cartSummary");
    const modalContainer = document.getElementById("modalContainer");
    if (summary) {
      summary.classList.add("hidden");
      summary.style.display = "none";
    }
    if (modalContainer) {
      modalContainer.style.display = "none";
    }
    return;
  }
});

async function renderCart() {
  let cart = await getCart();
  if (!Array.isArray(cart)) cart = [];

  tbody.innerHTML = "";
  document.getElementById("Subtotal").innerHTML = "";
  document.getElementById("paymentContainer").innerHTML = "";

  const oldSummary = document.getElementById("cartSummary");
  if (oldSummary) oldSummary.remove();

  const orderSummaryBtn = document.querySelector("#orderSummary");

  if (cart.length === 0) {
    orderSummaryBtn.disabled = true;
    orderSummaryBtn.style.cursor = "not-allowed";
    orderSummaryBtn.style.opacity = "0.5";

    tbody.innerHTML = `
      <tr>
        <td colspan="5" class="px-6 py-12 text-center text-gray-400 text-lg">
          🛒 Your cart is empty.
          <a href="#" onclick="navigate(0)" class="text-[#C9A96E] underline ml-1">Continue shopping</a>
        </td>
      </tr>`;
    return;
  }

  orderSummaryBtn.disabled = false;
  orderSummaryBtn.style.cursor = "pointer";
  orderSummaryBtn.style.opacity = "1";

  let grandTotal = 0;
  for (let i = 0; i < cart.length; i++) {
    let item = cart[i];
    const lineTotal = item.productPrice * item.productQuantity;
    grandTotal += lineTotal;

    tbody.innerHTML += `
      <tr class="group border-b border-red-500 hover:bg-amber-50/30 transition-all duration-200">
        <td class="px-5 py-4">
          <div class="flex items-center gap-3">
            <div class="w-14 h-14 shrink-0 rounded-xl bg-gray-50 border border-gray-100 p-1.5 overflow-hidden">
              <img src="${item.productImg || "https://via.placeholder.com/80"}"
                onerror="this.src='https://via.placeholder.com/80'"
                class="w-full h-full object-contain mix-blend-multiply" />
            </div>
            <div class="min-w-0">
              <p class="text-sm font-semibold text-slate-800 truncate max-w-[180px]">${item.productName}</p>
              <p class="text-md font-mono text-slate-400 mt-0.5 tracking-wide">#${item.productId}</p>
            </div>
          </div>
        </td>
        <td class="px-5 py-4">
          <span class="text-md font-semibold uppercase tracking-widest text-slate-400 block mb-0.5">Unit</span>
          <span class="text-sm font-semibold text-slate-700">₱${Number(item.productPrice).toFixed(2)}</span>
        </td>
        <td class="px-5 py-4">
          <span class="text-md font-semibold uppercase tracking-widest text-slate-400 block mb-1.5">Qty</span>
          <div class="inline-flex items-center rounded-xl border border-gray-200 bg-white shadow-xs overflow-hidden">
            <button onclick="changeQty('${item.productId}', -1, 'decrease')"
              class="w-8 h-8 flex items-center justify-center text-slate-500 hover:bg-red-50 hover:text-red-500 transition-colors cursor-pointer text-base font-bold">−</button>
            <span class="w-8 h-8 flex items-center justify-center text-sm font-bold text-slate-800 border-x border-gray-200 bg-gray-50">${item.productQuantity}</span>
            <button onclick="changeQty('${item.productId}', 1, 'increase')"
              class="w-8 h-8 flex items-center justify-center text-slate-500 hover:bg-emerald-50 hover:text-emerald-600 transition-colors cursor-pointer text-base font-bold">+</button>
          </div>
        </td>
        <td class="px-5 py-4">
          <span class="text-md font-semibold uppercase tracking-widest text-slate-400 block mb-0.5">Total</span>
          <span class="text-sm font-bold text-amber-600">₱${lineTotal.toFixed(2)}</span>
        </td>
        <td class="px-5 py-4">
          <button onclick="removeFromCart('${item.productId}', ${item.productQuantity})"
            class="w-8 h-8 rounded-xl bg-red-50 hover:bg-red-500 border border-red-100 hover:border-transparent text-red-400 hover:text-white flex items-center justify-center transition-all duration-200 cursor-pointer group/btn shadow-xs">
            <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </td>
      </tr>`;
  }

  // Build the summary panel — starts hidden, shown when user clicks "Order Summary"
  const summaryEl = document.createElement("div");
  summaryEl.id = "cartSummary";
  summaryEl.className = "hidden fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[9999] flex justify-center items-center";
  summaryEl.innerHTML = `
    <div class="bg-white rounded-2xl shadow-md p-6 min-w-[280px] border border-gray-100">
      <span class="flex justify-between flex-col">
        <h3 class="text-lg font-bold mb-4 text-gray-800">Order Summary
          <button id="closeModal" class="inline-flex items-center justify-center border align-middle select-none font-sans font-medium text-center transition-all duration-300 ease-in text-sm rounded-md py-2 px-4 shadow-sm bg-slate-800 border-slate-800 text-slate-50 hover:bg-slate-700 ml-10 lg:ml-20 cursor-pointer">&times;</button>
        </h3>
      </span>
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
        <span class="text-[#C9A96E]">₱${(Number(grandTotal.toFixed(2)) + 50).toFixed(2)}</span>
      </div>
      <button id="checkOutBtn"
        class="w-full bg-[#C9A96E] hover:bg-yellow-700 text-white font-semibold py-3 rounded-xl transition-colors cursor-pointer text-base">
        Proceed to Checkout →
      </button>
    </div>`;

  document.getElementById("Subtotal").innerHTML = grandTotal.toFixed(2);
  document.getElementById("paymentContainer").innerHTML =
    grandTotal > 0 ? "₱" + (50 + Number(grandTotal.toFixed(2))).toFixed(2) : "0";

  const tableWrapper = document.querySelector(".relative.overflow-x-auto");
  tableWrapper.parentNode.insertBefore(summaryEl, tableWrapper.nextSibling);
}

function renderTransaction() {
  let transactionCart = getTransaction() || {};
  const dateContainer = document.getElementById("dateContainer");
  const transactionContainer = document.getElementById("transactionContainer");

  transactionContainer.innerHTML = "";
  dateContainer.innerHTML = "";

  const dates = Object.keys(transactionCart);

  if (dates.length === 0) {
    transactionContainer.innerHTML = `
      <h1 class="text-center text-2xl">
        🛒 Your Transaction cart is empty.
        <a href="#" onclick="navigate(0)" class="text-[#C9A96E] underline ml-1">Continue shopping</a>
      </h1>`;
    return;
  }

  dates.forEach((key) => {
    dateContainer.innerHTML += `<strong>${key}</strong>`;
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
              <p class="text-xs text-slate-500 mt-1 font-mono">#${item.productId}</p>
            </div>
          </div>
          <div class="hidden sm:block w-px h-10 bg-gray-100 shrink-0"></div>
          <div class="flex items-center gap-5 sm:gap-6 flex-wrap sm:flex-nowrap">
            <div class="flex flex-col gap-0.5 min-w-[52px]">
              <span class="text-md font-semibold uppercase tracking-widest text-slate-400">Price</span>
              <span class="text-sm font-semibold text-slate-800">₱${Number(item.productPrice).toLocaleString()}</span>
            </div>
            <div class="flex flex-col gap-0.5 min-w-[36px]">
              <span class="text-md font-semibold uppercase tracking-widest text-slate-400">Qty</span>
              <span class="text-sm font-semibold text-slate-800">${item.productQuantity}</span>
            </div>
            <div class="flex flex-col gap-0.5">
              <span class="text-md font-semibold uppercase tracking-widest text-slate-400">Status</span>
              <span class="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-full py-1 px-2.5">
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
                Delivered
              </span>
            </div>
            <div class="flex flex-col gap-0.5 min-w-[64px]">
              <span class="text-md font-semibold uppercase tracking-widest text-slate-400">Total</span>
              <span class="text-sm font-bold text-amber-600">₱${(item.productPrice * item.productQuantity).toLocaleString()}</span>
            </div>
          </div>
          <div class="hidden sm:block w-px h-10 bg-gray-100 shrink-0"></div>
          <div class="shrink-0 w-full sm:w-auto">
            <button
              onclick="requestRefund('${item.productId}', '${item.productName}', ${i}, '${key}')"
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

let searchValue = "";
let categoryValue = "all";

async function applyFilters() {
  const res = await fetch(
    `Productdb.php?category=${encodeURIComponent(categoryValue)}&search=${encodeURIComponent(searchValue)}`,
    { method: "GET", credentials: "include" }
  );
  if (!res.ok) return;
  const filtered = await res.json();
  displayProducts(filtered);
}

document.getElementById("searchInput").addEventListener("input", (e) => {
  searchValue = e.target.value.toLowerCase();
  applyFilters();
});

document.getElementById("categoryFilter").addEventListener("change", (e) => {
  categoryValue = e.target.value;
  applyFilters();
});

async function checkUserSessions() {
  const res = await fetch("checkSession.php", { credentials: "include" });
  return await res.json();
}

async function displayProducts(products) {
  if (!Array.isArray(products) || products.length === 0) {
    cardContainer.innerHTML = `<p class="text-center text-gray-400 col-span-full py-12">No products found.</p>`;
    return;
  }

  let isLogin = await checkUserSessions();
  cardContainer.innerHTML = "";

  for (let i = 0; i < products.length; i++) {
    let e = products[i];
    let stars = "";
    for (let j = 0; j < 5; j++) {
      stars += `<svg class="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
        <path d="M13.849 4.22c-.684-1.626-3.014-1.626-3.698 0L8.397 8.387l-4.552.361c-1.775.14-2.495 2.331-1.142 3.477l3.468 2.937-1.06 4.392c-.413 1.713 1.472 3.067 2.992 2.149L12 19.35l3.897 2.354c1.52.918 3.405-.436 2.992-2.15l-1.06-4.39 3.468-2.938c1.353-1.146.633-3.336-1.142-3.477l-4.552-.36-1.754-4.17Z"/>
      </svg>`;
    }

    cardContainer.innerHTML += `
      <div class="w-full bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200">
        <img class="rounded-lg mb-4 h-48 w-full object-contain cursor-default hover:scale-105 transition-transform duration-300 ease-in-out"
          src="${e.img || "https://via.placeholder.com/200"}"
          onerror="this.src='https://via.placeholder.com/200'"
          alt="${e.name}" />
        <div class="flex items-center gap-2 mb-3">
          <div class="flex">${stars}</div>
          <span class="text-xs bg-yellow-50 text-yellow-700 px-2 py-0.5 rounded font-medium">4.8 / 5</span>
        </div>
        <h2 class="text-base font-bold text-gray-800 mb-1 line-clamp-1">${e.name}</h2>
        <p class="text-xs text-gray-400 mb-1 line-clamp-2">${e.description}</p>
        <p class="text-xs text-gray-400 mb-4">Stock: ${e.stock}</p>
        <div class="flex items-center justify-between">
          <span class="text-xl font-bold text-gray-900">₱${e.price}</span>
          <button
            type="button"
            class="addToCartBtn inline-flex items-center gap-1.5 cursor-pointer bg-black text-white font-medium text-sm px-3 py-2 rounded-lg hover:bg-gray-800 transition-colors"
            onclick="${isLogin.loggedIn ? `addToCart(${e.productId}, this)` : `showForms()`}"
            ${e.stock <= 0 ? "disabled" : ""}
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M5 4h1.5L9 16m0 0h8m-8 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm8 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm-8.5-3h9.25L19 7H7.312"/>
            </svg>
            Add to cart
          </button>
        </div>
      </div>`;
  }
}

function toast(message, status, element) {
  const toastEl = document.querySelector(element);
  if (toastEl === null) return;
  toastEl.classList.remove("top-[200%]");
  if (status) {
    toastEl.innerHTML = `<span class="text-xl">✅</span><span class="font-medium">${message}</span>`;
    toastEl.classList.add("top-10", "bg-green-500", "text-white", "z-9999");
    setTimeout(() => { toastEl.classList.remove("top-10", "bg-green-500", "text-white", "z-9999"); }, 2000);
  } else {
    toastEl.innerHTML = `<span class="text-xl">⚠️</span><span class="font-medium">${message}</span>`;
    toastEl.classList.add("top-10", "bg-red-500", "text-white", "z-9999");
    setTimeout(() => { toastEl.classList.remove("top-10", "bg-red-500", "text-white", "z-9999"); }, 2000);
  }
}


(async () => {
  await updateAuthButtons();
  await initializedProfile();
  await renderCart();     
  await updateCartCount();
})();

loadProducts();
renderTransaction();