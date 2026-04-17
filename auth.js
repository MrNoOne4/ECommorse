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

async function checkUserSessions() {
  const res = await fetch('checkSession.php', {
    credentials: "include"
  })
  const data = await res.json();

  return data;
}



// Initialize and display the user's profile in the UI
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

  const token = session.user;
  if (!token?.ID) {
      console.warn("No user ID in session");
    return;
  }
  const req = await fetch(`profile.php?id=${encodeURIComponent(token.ID)}`, {
    method: "GET"
  })

  const data = await req.json();

  const {backgroundFirst, backgroundSecond, textColor} = data.user;

  const firstChar = token.email[0].toUpperCase();


  initial.innerHTML = firstChar;
  
  profileInitial.innerHTML = firstChar;


  initial.style.color = textColor;
  initialBackground.style.background = backgroundFirst;
  profileInitial.style.background = backgroundFirst;
  profileInitial.style.color = textColor;

  profile.classList.remove("hidden");
  profile.classList.add("block");
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
    return;
  }

    window.location.href = "index.html";


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
});

// Show or hide login/logout buttons depending on login status
async function updateAuthButtons() {
  let isLogin = await checkUserSessions();

  const logoutBtn = document.getElementById("logoutBtn");
  const btn = document.getElementById("showLoginForm");

  logoutBtn.classList.toggle("hidden", !isLogin.loggedIn);
  btn.classList.toggle("hidden", isLogin.loggedIn);
}



// Handle login form submission
document.querySelector("#loginForm form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const isValid = await validateLogin(e);
  if (!isValid) return;
});

// Delete the currently logged-in account
const confirmDeletion = async () => {
  const session = await checkUserSessions();
  const req = await fetch(`profile.php`, {
    method: "DELETE",

    headers: {
        'Content-Type': 'application/json'
      },

      body: JSON.stringify({
        id: session.user.ID
      })
  });

  if (!req.ok) {
    console.log("something went wrong");
    return;
  }


  const result = await req.json();

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


document.addEventListener("click", async function (e) {
  const session = await checkUserSessions();
  const token = session.user;

    if (!token.ID) {
      toast("user are not authenticated.", false, "#toast-default");
      return;
  }

  const btn = e.target.closest("#saveChange");
  if (!btn) return;


  const color1 = document.querySelector("#backgroundFirst")?.value;
  const color2 = document.querySelector("#backgroundSecond")?.value;
  const value = document.querySelector("#color")?.value;

  toast("Profile Successfully changes", true, "#toast-default");

  // NOTE: You need to define what "id" should be
  // Example: const id = token OR another stored value
 
    console.log(token);


  const req = await fetch(`profile.php?action=updateColor`, {
    method: "PATCH",

    headers: {
        'Content-Type': 'application/json'
      },

      body: JSON.stringify({
        backgroundFirst: color1,
        backgroundSecond: color2,
        color: value
      })
  });

  const res = await req.json();

  if (!req.ok) {
    console.log("something went wrong");
    return;
  }


  // localStorage equivalents (unchanged logic, just vanilla JS)
  // localStorage.setItem(
  //   `background_${token}`,
  //   JSON.stringify(`linear-gradient(to right, ${color1}, ${color2})`)
  // );
  // localStorage.setItem(`color_${token}`, JSON.stringify(value));

  // intitializeColors();
  await initializedProfile();
  await updateAuthButtons();
  
  const product = await loadProducts();
  displayProducts(product);
  updateCartCount();
  renderTransaction();

  const profileContainer = document.querySelector("#profileContainer");
  if (profileContainer) {
    profileContainer.style.transition = "opacity 0.3s ease";
    profileContainer.style.opacity = "0";

    setTimeout(() => {
      profileContainer.style.display = "none";
    }, 300);
  }

});

// Update the logged-in user's email
document.querySelector("#updateBtn").addEventListener("click", async () => {
  const newEmail = document.querySelector("#newEmail").value;

  const sessionRes = await fetch("checkSession.php", { credentials: "include" });
  const session = await sessionRes.json();
  const user = session.user;

  if (!newEmail) {
    toast("Please enter email", false, "#toast-default");
    return;
  }

  if (!user?.ID) {
    toast("Not authenticated", false, "#toast-default");
    return;
  }

  const res = await fetch(
    `profile.php?action=updateEmail`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email: newEmail })
    }
  );

  const data = await res.json();

  if (!res.ok || data.error) {
    toast(data.error || "Update failed", false, "#toast-default");
    return;
  }

  toast("Email updated!", true, "#toast-default");

  await initializedProfile(); // reload UI from session

  document.querySelector("#newEmail").value = "";
});