// Hide one or more form containers by moving them out of view
function hideForms(...formIds) {
  // Select all elements that have the class "formContainer"
  const formContainers = document.querySelectorAll(".formContainer");

  // Loop through every form ID passed into the function
  formIds.forEach((id) => {
    const form = document.getElementById(id);

    if (form) {
      // Remove the centered position class
      form.classList.remove("-translate-y-1/2");

      // Move the form far above the screen so it becomes hidden
      form.classList.add("-translate-y-[200%]");
    }
  });

  // Send all form containers behind other elements
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
document.querySelector("#createAccountForm").addEventListener("submit", (e) => {
  e.preventDefault(); // Prevent page refresh

  const isValid = validateSignUp(e);
  if (!isValid) return;
});

// Search for an account in localStorage using the email
//  function findAccountByEmail(email) {
//   // let accounts = localStorage.getItem("account");

//   // // Convert stored JSON string into an array
//   // if (accounts) {
//   //   accounts = JSON.parse(accounts);
//   // } else {
//   //   accounts = [];
//   // }

//   // // Loop through accounts and return the matching one
//   // for (let i = 0; i < accounts.length; i++) {
//   //   if (accounts[i].email === email) {
//   //     return accounts[i];
//   //   }
//   // }

//   // Return null if no account matches
//   return UserService.findByEmail(email);
// }

// Validate signup details and create a new account
async function validateSignUp(e) {
  const email = e.target.email.value;
  const password = e.target.password.value;
  const confirmPassword = e.target.confirmPassword.value;

  // Prevent users from using the admin email
  // if (email === "admin@gmail.com") {
  //   toast("Email already exists", false, "#toast-default");
  //   return false;
  // }

  if (!UserValidator.isValidEmail(email)) {
    toast("Invalid email format", false, "#toast-default");
    return false;
  }

  if (!UserValidator.isValidPassword(password) || !UserValidator.isValidPassword(confirmPassword)) {
    toast("Password must be at least 8 characters long and include an uppercase letter, a number, and a special character", false, "#toast-default");
    return false;
  }

  // Check if password and confirm password match
  if (!UserValidator.isSamePassword(password, confirmPassword)) {
    toast("Password do not match", false, "#toast-default");
    return false;
  }

  // Get existing accounts from localStorage
  // accounts = JSON.parse(localStorage.getItem("account")) || [];

  // Check if email is already registered
  const isFound = await UserService.findByEmail(email);

  if (isFound) {
    toast("Email already exists", false, "#toast-default");
    return false;
  }

  // Create a new user account
  const account = new User(email, password);
  // accounts.push(account);
  const res = await fetch("register.php", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      email: account.email,
      password: account.password,
    }),
  });



  if (!res.ok) {
    toast("Error creating account", false, "#toast-default");
    return false;
  }

  const result = await res.json();

  if (result.success) {
    toast("Account created successfully!", true, "#toast-default");
  } else {
    toast("Error creating account : " + result.message, false, "#toast-default");
    return false;
  }
  

  // Save updated accounts back to localStorage
  // localStorage.setItem("account", JSON.stringify(accounts));

  // Hide signup form and show success message
  hideForms("signUpForm");
  toast("Account created successfully!", true, "#toast-default");

  // Mark user as logged in
  updateAuthButtons();
  hideForms("loginForm");
  navigation();

  // Load products and display them
  // let products = JSON.parse(localStorage.getItem("products"));
  // displayProducts(products);

  // Save current user email as the token

  // Refresh transaction, cart, and profile display
  renderTransaction();
  updateCartCount();
  initializedProfile();

  return true;
}


// Initialize and display the user's profile in the UI
function initializedProfile() {
  const token = localStorage.getItem("token");
  const login = Boolean(JSON.parse(localStorage.getItem("login")));

  // Get saved profile colors for this user
  const backgroundColor = JSON.parse(
    localStorage.getItem(`background_${token}`),
  );
  const textColor = JSON.parse(localStorage.getItem(`color_${token}`));

  const profile = document.getElementById("profile");
  const profileInitial = document.getElementById("profileInitial");
  const initialBackground = document.getElementById("initialBackground");
  const initial = document.getElementById("initial");

  // If no user is logged in, hide the profile section
  if (!token || login === false) {
    profile.classList.remove("block");
    profile.classList.add("hidden");
    return;
  }

  // Get the first letter of the user's email
  const firstChar = token[0].toUpperCase();

  // Set the displayed initials
  profileInitial.innerHTML = firstChar;
  initial.innerHTML = firstChar;

  // Apply saved colors
  initial.style.color = textColor;
  initialBackground.style.background = backgroundColor;
  profileInitial.style.background = backgroundColor;
  profileInitial.style.color = textColor;

  // Show profile section
  profile.classList.remove("hidden");
  profile.classList.add("block");
}

// Validate login credentials
async function validateLogin(e) {
  const email = e.target.email.value;
  const password = e.target.password.value;

  // Special admin login
  if (email === "admin@gmail.com" && password === "admin123") {
    return (window.location.href = "adminDashboard.html");
  }

  // Search for the account
  const isFound = await UserService.findByEmail(email);

  if (isFound) {
    toast("Account not found", false, "#toast-default");
    return false;
  } 
  
    const res = await fetch("login.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      credentials: "include",
      body: JSON.stringify({
        email: email,
        password: password
      })
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


    // Login success
    localStorage.setItem("login", JSON.stringify(true));
    toast("Login successful!", true, "#toast-default");
    updateAuthButtons();
    hideForms("loginForm");
    navigation();

    // Reload app data after login
    // let products = JSON.parse(localStorage.getItem("products"));
    // showProducts(products);
    localStorage.setItem("token", email);
    renderTransaction();
    updateCartCount();
    initializedProfile();

    return true;
}


// Logout button
document.getElementById("logoutBtn").addEventListener("click", () => {
  const product = JSON.parse(localStorage.getItem("products"));

  // Set login status to false
  localStorage.setItem("login", JSON.stringify(false));

  navigation();
  toast("Logout successful!", true, "#toast-default");

  hidePages(0);
  updateAuthButtons();
  displayProducts(product);

  // Reset cart count display
  $("#cartCount").text("0");

  // Hide profile area
  const profile = document.getElementById("profile");
  profile.classList.remove("block");
  profile.classList.add("hidden");

  // Remove current user token
  localStorage.removeItem("token");

  // Reset checkout form
  resetCheckOutForm();
});

// Show or hide login/logout buttons depending on login status
function updateAuthButtons() {
  isLogin = JSON.parse(localStorage.getItem("login"));

  const logoutBtn = document.getElementById("logoutBtn");
  const btn = document.getElementById("showLoginForm");

  logoutBtn.classList.toggle("hidden", !isLogin);
  btn.classList.toggle("hidden", isLogin);
}

// Run once when the page loads
initializedProfile();

// Handle login form submission
document.querySelector("#loginForm  form").addEventListener("submit", (e) => {
  e.preventDefault();

  const isValid = validateLogin(e);
  if (!isValid) return;
});

// Delete the currently logged-in account from localStorage
const confirmDeletion = () => {
  const token = localStorage.getItem("token");

  // Get all saved accounts
  const temp = JSON.parse(localStorage.getItem("account")) || [];
  const accContainer = [];

  // Keep all accounts except the current one
  for (let i = 0; i < temp.length; i++) {
    if (temp[i].email !== token) {
      accContainer.push(temp[i]);
    }
  }

  // Save updated account list
  localStorage.setItem("account", JSON.stringify(accContainer));

  // Clear user-specific stored data
  localStorage.setItem(`background_${token}`, JSON.stringify(""));
  localStorage.setItem(`color_${token}`, JSON.stringify(""));
  localStorage.setItem(`transact_${token}`, JSON.stringify(""));
  localStorage.setItem(`cart_${token}`, JSON.stringify(""));

  // Log the user out
  localStorage.setItem("login", JSON.stringify(false));

  // Refresh UI after deletion
  initializedProfile();
  updateAuthButtons();
  resetCheckOutForm();
  displayProducts(JSON.parse(localStorage.getItem("products")));
  updateAuthButtons();
  updateCartCount();
  renderTransaction();
  renderCart();
  hidePages(0);
};

// Confirm delete button
document.querySelector("#deleteConfirm").addEventListener("click", () => {
  toast("Account successfully deleted.", true, "#toast-default");

  document.getElementById("DeleteModalContainer").style.display = "none";
  document.getElementById("DeleteModal").style.display = "none";
  document.getElementById("profileContainer").style.display = "none";

  confirmDeletion();
});

// Update the logged-in user's email
document.querySelector("#updateBtn").addEventListener("click", function () {
  const newEmail = document.querySelector("#newEmail").value;
  const accounts = JSON.parse(localStorage.getItem("account")) || [];
  const token = localStorage.getItem("token");
  let tempContainer;

  // Validate input
  if (!newEmail) {
    toast("Please enter a valid email.", false, "#toast-default");
    return;
  }

  // Check if the new email already exists
  for (let i = 0; i < accounts.length; i++) {
    if (accounts[i].email === newEmail) {
      toast(
        "This email is already in use. Please enter a different email.",
        false,
        "#toast-default",
      );
      return;
    }
  }

  // Find the current user in the account list
  for (let i = 0; i < accounts.length; i++) {
    if (accounts[i].email === token) {
      tempContainer = i;
    }
  }

  // Replace old email with the new one
  accounts[tempContainer].email = newEmail;

  // Get old user data tied to the old email
  const tempBackground = JSON.parse(
    localStorage.getItem(`background_${token}`),
  );
  const tempColor = JSON.parse(localStorage.getItem(`color_${token}`));
  const tempTransaction = JSON.parse(localStorage.getItem(`transact_${token}`));
  const tempCart = JSON.parse(localStorage.getItem(`cart_${token}`));

  // Remove old user-specific keys
  localStorage.setItem(`background_${token}`, JSON.stringify(" "));
  localStorage.setItem(`color_${token}`, JSON.stringify(" "));
  localStorage.setItem(`transact_${token}`, JSON.stringify(" "));
  localStorage.setItem(`cart_${token}`, JSON.stringify(" "));

  // Save the same data under the new email key
  localStorage.setItem(`color_${newEmail}`, JSON.stringify(tempColor));
  localStorage.setItem(`transact_${newEmail}`, JSON.stringify(tempTransaction));
  localStorage.setItem(`cart_${newEmail}`, JSON.stringify(tempCart));
  localStorage.setItem(
    `background_${newEmail}`,
    JSON.stringify(tempBackground),
  );

  // Update the active token to the new email
  localStorage.setItem("token", newEmail);

  // Save the updated account list
  localStorage.setItem("account", JSON.stringify(accounts));

  // Refresh the UI
  initializedProfile();
  updateAuthButtons();
  resetCheckOutForm();
  displayProducts(JSON.parse(localStorage.getItem("products")));
  updateCartCount();
  renderTransaction();

  // Clear and close update modal
  document.querySelector("#newEmail").value = "";
  document.getElementById("confirmationInputModal").style.display = "none";
  document.getElementById("inputModalContainer").style.display = "none";
  document.getElementById("profileContainer").style.display = "none";

  toast("Your email has been successfully updated!", true, "#toast-default");
});