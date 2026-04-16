// Hide one or more form containers by moving them out of view
function hideForms(...formIds) {
  const formContainers = document.querySelectorAll(".formContainer");

  formIds.forEach((id) => {
    const form = document.getElementById(id);

    if (form) {
      form.classList.remove("-translate-y-1/2");
      form.classList.add("-translate-y-[200%]");
    }
  });

  formContainers.forEach((container) => {
    container.style.zIndex = "-1";
  });
}

// Show the login form and bring the form containers to the front
function showForms() {
  document.querySelector("#loginForm").classList.remove("-translate-y-[200%]");
  document.querySelector("#loginForm").classList.add("-translate-y-1/2");

  document.querySelectorAll(".formContainer").forEach((el) => {
    el.style.zIndex = "999";
  });
}

// Handle the Create Account form submission
document.querySelector("#createAccountForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const isValid = await validateSignUp(e);
  if (!isValid) return;
});

// Validate signup details and create a new account
async function validateSignUp(e) {
  const email = e.target.email.value;
  const password = e.target.password.value;
  const confirmPassword = e.target.confirmPassword.value;

  if (!UserValidator.isValidEmail(email)) {
    toast("Invalid email format", false, "#toast-default");
    return false;
  }

  if (!UserValidator.isValidPassword(password)) {
    toast("Weak password", false, "#toast-default");
    return false;
  }

  if (!UserValidator.isSamePassword(password, confirmPassword)) {
    toast("Passwords do not match", false, "#toast-default");
    return false;
  }

  const isFound = await UserService.findByEmail(email);
  if (isFound) {
    toast("Email already exists", false, "#toast-default");
    return false;
  }

  const res = await fetch("register.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ email, password })
  });

  const result = await res.json();

  if (!res.ok || result.error) {
    toast(result.error || "Error creating account", false, "#toast-default");
    return false;
  }

  toast(result.message || "Account created successfully!", true, "#toast-default");

  hideForms("signUpForm");
  hideForms("loginForm");

  await updateAuthButtons();
  navigation();

  updateCartCount();
  const product = await loadProducts();
  displayProducts(product);
  renderTransaction();
  updateCartCount();
  await initializedProfile();

  return true;
}

// Initialize and display the user's profile in the UI
async function initializedProfile() {
  const session = await checkUserSessions();

  const profile = document.getElementById("profile");
  const profileInitial = document.getElementById("profileInitial");
  const initialBackground = document.getElementById("initialBackground");
  const initial = document.getElementById("initial");

  if (!session || !session.loggedIn) {
    profile.classList.remove("block");
    profile.classList.add("hidden");
    return;
  }

  const token = session.user;
  profile.classList.remove("hidden");

  const backgroundColor = JSON.parse(localStorage.getItem(`background_${token}`)) || "#333333";
  const textColor = JSON.parse(localStorage.getItem(`color_${token}`)) || "#ffffff";

  const firstChar = token[0].toUpperCase();

  profileInitial.innerHTML = firstChar;
  initial.innerHTML = firstChar;

  initial.style.color = textColor;
  initialBackground.style.background = backgroundColor;
  profileInitial.style.background = backgroundColor;
  profileInitial.style.color = textColor;

  
}

// Validate login credentials
async function validateLogin(e) {
  e.preventDefault();

  const email = e.target.email.value;
  const password = e.target.password.value;

  const res = await fetch("login.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ email, password })
  });

  if (!res.ok) {
    toast("Error logging in", false, "#toast-default");
    return false;
  }

  const result = await res.json();

  if (result.error) {
    toast(result.error, false, "#toast-default");
    return false;
  }

  toast("Login successful!", true, "#toast-default");

  await updateAuthButtons();
  hideForms("loginForm");
  navigation();

  if (result.role === "admin") {
    window.location.href = "adminDashboard.php";
    return true;
  }

  const product = await loadProducts();
  displayProducts(product);
  renderTransaction();
  updateCartCount();
  await initializedProfile();

  return true;
}

// Logout button
document.getElementById("logoutBtn").addEventListener("click", async () => {
  const res = await fetch('logout.php');
  const data = await res.json();

  if (!res.ok) {
    toast("Logout unsuccessful!", false, "#toast-default");
    return;
  }

  navigation();
  toast("Logout successful!", true, "#toast-default");

  hidePages(0);
  await updateAuthButtons();

  $("#cartCount").text("0");

  const product = await loadProducts();
  displayProducts(product);

  await initializedProfile();

  resetCheckOutForm();
  resetForm();
});

// Show or hide login/logout buttons depending on login status
async function updateAuthButtons() {
  let isLogin = await checkUserSessions();

  const logoutBtn = document.getElementById("logoutBtn");
  const btn = document.getElementById("showLoginForm");

  logoutBtn.classList.toggle("hidden", !isLogin.loggedIn);
  btn.classList.toggle("hidden", isLogin.loggedIn);
}

// Run once when the page loads
(async () => {
  await updateAuthButtons();
  await initializedProfile();
})();

// Handle login form submission
document.querySelector("#loginForm form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const isValid = await validateLogin(e);
  if (!isValid) return;
});

// Delete the currently logged-in account
const confirmDeletion = async () => {
  const session = await checkUserSessions();
  const token = session.user;

  localStorage.setItem(`background_${token}`, JSON.stringify(""));
  localStorage.setItem(`color_${token}`, JSON.stringify(""));
  localStorage.setItem(`transact_${token}`, JSON.stringify(""));
  localStorage.setItem(`cart_${token}`, JSON.stringify(""));

  await initializedProfile();
  await updateAuthButtons();
  resetCheckOutForm();
  const product = await loadProducts();
  displayProducts(product);
  updateCartCount();
  renderTransaction();
  renderCart();
  hidePages(0);
};

// Confirm delete button
document.querySelector("#deleteConfirm").addEventListener("click", async () => {
  toast("Account successfully deleted.", true, "#toast-default");

  document.getElementById("DeleteModalContainer").style.display = "none";
  document.getElementById("DeleteModal").style.display = "none";
  document.getElementById("profileContainer").style.display = "none";

  await confirmDeletion();
});

// Update the logged-in user's email
document.querySelector("#updateBtn").addEventListener("click", async function () {
  const newEmail = document.querySelector("#newEmail").value;
  const session = await checkUserSessions();
  const token = session.user;

  if (!newEmail) {
    toast("Please enter a valid email.", false, "#toast-default");
    return;
  }

  const tempBackground = JSON.parse(localStorage.getItem(`background_${token}`));
  const tempColor = JSON.parse(localStorage.getItem(`color_${token}`));
  const tempTransaction = JSON.parse(localStorage.getItem(`transact_${token}`));
  const tempCart = JSON.parse(localStorage.getItem(`cart_${token}`));

  localStorage.setItem(`background_${token}`, JSON.stringify(" "));
  localStorage.setItem(`color_${token}`, JSON.stringify(" "));
  localStorage.setItem(`transact_${token}`, JSON.stringify(" "));
  localStorage.setItem(`cart_${token}`, JSON.stringify(" "));

  localStorage.setItem(`color_${newEmail}`, JSON.stringify(tempColor));
  localStorage.setItem(`transact_${newEmail}`, JSON.stringify(tempTransaction));
  localStorage.setItem(`cart_${newEmail}`, JSON.stringify(tempCart));
  localStorage.setItem(`background_${newEmail}`, JSON.stringify(tempBackground));

  await initializedProfile();
  await updateAuthButtons();
  resetCheckOutForm();
  const product = await loadProducts();
  displayProducts(product);
  updateCartCount();
  renderTransaction();

  document.querySelector("#newEmail").value = "";
  document.getElementById("confirmationInputModal").style.display = "none";
  document.getElementById("inputModalContainer").style.display = "none";
  document.getElementById("profileContainer").style.display = "none";

  toast("Your email has been successfully updated!", true, "#toast-default");
});