// Initialize jQuery when the DOM is fully loaded
$(document).ready(() => {
  let toggle = true;
  var faEyeToggle = false;
  var faEyeToggleSignUp = false;
  var faEyeToggleConfirmSignUp = false;

function resetToggle() {
  faEyeToggleConfirmSignUp = false;
  faEyeToggleSignUp = false;
  faEyeToggle = false;

  $("#faEyePassword")
    .removeClass("fa-eye-slash")
    .addClass("fa-eye");
  $("#passwordInput").attr("type", "password");

  $("#signUpPassword")
    .removeClass("fa-eye-slash")
    .addClass("fa-eye");
  $("#passwordSignUp").attr("type", "password");

  $("#signUpConfirmPassword")
    .removeClass("fa-eye-slash")
    .addClass("fa-eye");
  $("#confirmPassword").attr("type", "password");
}



  // Initial setup: Hide cart summary and modal container
  $("#cartSummary").css("z-index", "-1");
  $("#modalContainer").css("display", "none");

  // Close modal when close button is clicked
  $(document).on("click", "#closeModal", function () {
    $("#cartSummary").fadeOut(300);
    $("#modalContainer").fadeOut(300);
  });

  // Open order summary modal
  $(document).on("click", "#orderSummary", () => {
    $("#cartSummary").fadeIn(300);
    $("#modalContainer").fadeIn(300);
  });

  // Handle checkout button - navigate and close modal
  $(document).on("click", "#checkOutBtn", () => {
    navigate(2);
    $("#modalContainer").fadeOut(300);
  });

  // Toggle navigation sidebar height and icon
  $(document).on("click", "#navigation", () => {
    $("#aside").css("height", toggle ? "auto" : "116px");
    $("#navigation").text(toggle ? "X" : "☰");
    toggle = !toggle;
  });

  // Adjust sidebar on window resize (desktop view)
  $(window).on("resize", () => {
    if (window.innerWidth >= 1000) {
      $("#aside").css("height", "auto");
    }
  });

  // Display login account form
  $(document).on("click", "#login", () => {
    $("#loginAccount").addClass("-translate-y-1/2");
    resetToggle()
    resetForm();
  });

  // Close login form and reset
  $(document).on("click", "#closeLogin", () => {
    $("#loginForm").removeClass("-translate-y-1/2");
    $("#loginForm").addClass("-translate-y-[200%]");
    $(".formContainer").css("z-index", "-1");
    resetForm();
    resetToggle()
  });


  // Show login form and hide sign-up form
  $(document).on("click", "#showLoginForm", () => {
    $("#loginForm").removeClass("-translate-y-[200%]");
    $("#loginForm").addClass("-translate-y-1/2");
    $(".formContainer").css("z-index", "999");
    resetForm();
    resetToggle()
  });

  // Show sign-up form and hide login form
  $(document).on("click", "#showSignUpForm", () => {
    $("#loginForm").removeClass("-translate-y-1/2");
    $("#loginForm").addClass("-translate-y-[200%]");
    $("#signUpForm").removeClass("-translate-y-[200%]");
    $("#signUpForm").addClass("-translate-y-1/2");
    resetForm();
    resetToggle()
  });

  // Switch from sign-up back to login form
  $(document).on("click", "#showLogin", () => {
    $("#signUpForm").removeClass("-translate-y-1/2");
    $("#signUpForm").addClass("-translate-y-[200%]");
    $("#loginForm").removeClass("-translate-y-[200%]");
    $("#loginForm").addClass("-translate-y-1/2");
    resetForm();
    resetToggle()
  });

  // Close sign-up form
  $(document).on("click", "#closeSignUp", () => {
    $("#signUpForm").removeClass("-translate-y-1/2");
    $("#signUpForm").addClass("-translate-y-[200%]");
    $(".formContainer").css("z-index", "-1");
    resetForm();
    resetToggle()
  });

  // Reset all input fields in login and sign-up forms
  function resetForm() {
    const loginFormInputs = document.querySelectorAll(
      "#loginForm form  input, #signUpForm form input",
    );
    loginFormInputs.forEach((input) => (input.value = ""));
    const checkbox = document.querySelector("input[type='checkbox']");
    checkbox.checked = false;
  }

  // Clear all checkout form inputs and reset select/checkbox elements
  function resetCheckOutForm() {
    const checkOutForm = document.querySelectorAll("#checkOut input");
    $("#select-municipality-input-3").prop("selectedIndex", 0);
    $("#pay-on-delivery").prop("checked", false);
    checkOutForm.forEach((e) => (e.value = ""));
  }

  // Handle checkout form submission
  $(document).on("submit", "#checkOut", (e) => {
    const cart = getCart();
    e.preventDefault();

    // Validate cart is not empty
    if (cart.length === 0) {
      toast(
        "  Your cart is empty. Please add items before proceeding to checkout.",
        false,
        "#toastProceed",
      );
      return;
    }

    // Show loading indicator
    $("#loading").removeClass("z-[-1]");
    $("#loading").addClass("z-[9999]");

    // Hide loading and show success modal after 2.5 seconds
    setTimeout(() => {
      $("#loading").removeClass("z-[9999]");
      $("#loading").addClass("z-[-1]");
      $("#containerModal").removeClass("hidden");
      resetCheckOutForm();
    }, 2500);

    // Save transaction and clear cart from storage
    saveTransaction(cart);
    const token = localStorage.getItem("token");
    localStorage.removeItem(`cart_${token}`);

    // Update UI elements
    updateAuthButtons();
    showProducts(products);
    updateCartCount();
    renderCart();
    renderTransaction();
  });

  // Close success modal
  $(document).on("click", "#closeButton, #closeIcon", function () {
    $("#containerModal").addClass("hidden");
  });

  // Close generic modal
  $(document).on("click", ".close", () => {
    $("#thisModals").removeClass("z-[9999]");
    $("#thisModals").addClass("z-[-1]");
  });

  // Initiate product refund request
  window.requestRefund = function (productCode, productName, index) {
    var date = new Date().toLocaleDateString();
    var transaction = getTransaction() || {};

    var productData = transaction[date]?.[index];
    if (!productData) return;

    // Display product info in return modal
    $("#returnImg").attr("src", productData.productImg);
    $("#returnName").html(productData.productName);
    $("#productID").html(productCode);
    $("#returnPrice").html(
      "₱" + productData.productQuantity * productData.productPrice,
    );

    // Store refund data for later use
    window._refundData = { productCode, date, index };
    $("#returnContainer").fadeIn(300);
  };

  // Process the refund/return transaction
  window.continueReturn = function () {
    const { productCode, date, index } = window._refundData;

    let products = JSON.parse(localStorage.getItem("products")) || [];
    const transactions = getTransaction() || {};

    const items = transactions[date];

    if (!items || !items[index]) return;

    const temp = items[index];

    // Find and update product stock
    const productIndex = products.findIndex(
      (p) => p.productCode === productCode,
    );

    if (productIndex !== -1) {
      products[productIndex].stock += temp.productQuantity;
      localStorage.setItem("products", JSON.stringify(products));
    }

    // Remove returned item from transaction history
    transactions[date].splice(index, 1);

    // Delete date entry if no items remain
    if (transactions[date].length === 0) {
      delete transactions[date];
    }

    // Save updated transactions
    localStorage.setItem(
      `transact_${localStorage.getItem("token")}`,
      JSON.stringify(transactions),
    );

    // Show return success animation
    $("#returnContainer").fadeOut(300);

    setTimeout(() => {
      $("#returnLoading").removeClass("z-[-1]").addClass("z-[9999]");

      setTimeout(() => {
        $("#returnLoading").removeClass("z-[9999]").addClass("z-[-1]");
        showProducts(products);
        renderTransaction();
      }, 2500);
    }, 300);
  };

  // Close return modal
  $(document).on("click", "#closeButtonReturn, #closeIconReturn", () => {
    $("#containerReturn").addClass("hidden");
  });

  // Close return modal with fade effect
  $(document).on("click", "#closeReturnModal", () => {
    $("#returnContainer").fadeOut();
  });

  // Close return modal (duplicate handler)
  $(document).on("click", "#closeButtonReturn, #closeIconReturn", () => {
    $("#containerReturn").fadeOut();
  });

  // Open user profile
  $(document).on("click", "#profile", () => {
    $("#profileContainer").fadeIn();
    initializedProfile();
    intitializeColors();
    hidePages(0);
  });

  // Close user profile
  $(document).on("click", "#profileClose", () => {
    $("#profileContainer").fadeOut();
    initializedProfile();
    intitializeColors();
  });

  // Update background gradient preview as colors change
  $(document).on("input", "#backgroundFirst, #backgroundSecond", function () {
    var color1 = $("#backgroundFirst").val();
    var color2 = $("#backgroundSecond").val();
    $("#initialBackground").css(
      "background-image",
      `linear-gradient(to right, ${color1}, ${color2})`,
    );

    $("#profileInitial").css(
      "background-image",
      `linear-gradient(to right, ${color1}, ${color2})`,
    );
  });

  // Load and display user's saved color preferences
  function intitializeColors() {
    var token = localStorage.getItem("token");

    var backgroundColor =
      JSON.parse(localStorage.getItem(`background_${token}`)) ||
      "bg-gradient-to-r from-purple-500 to-blue-500";
    var textColor = JSON.parse(localStorage.getItem(`color_${token}`));

    // Parse gradient colors from stored string
    const colorsRaw = backgroundColor
      .replace("linear-gradient(", "")
      .replace(")", "")
      .split(",")
      .slice(1);

    const colors = [];
    for (let i = 0; i < colorsRaw.length; i++) {
      colors.push(colorsRaw[i].trim());
    }

    // Set input values to current colors
    $("#backgroundFirst").val(`${colors[0]}`);
    $("#backgroundSecond").val(colors[1]);
    $("#color").val(textColor);
  }

  // Initialize colors on page load
  intitializeColors();

  // Save profile color changes to localStorage


  // Update text color preview as user changes color input
  $(document).on("input", "#color", function () {
    var value = $(this).val();
    $("#initial").css("color", value);
    $("#profileInitial").css("color", value);
  });

  // Close account deletion confirmation modal
  $(document).on("click", "#deleteCancel, #deleteIcon", function () {
    $("#DeleteModal").fadeOut();
    $("#DeleteModalContainer").fadeOut();
  });

  // Show account deletion confirmation modal
  $(document).on("click", "#deleteAccount", () => {
    $("#DeleteModalContainer").fadeIn();
    $("#DeleteModal").fadeIn();
  });

  // Close email change modal and clear input
  $(document).on("click", "#closeInputModalBtn", function () {
    $("#inputModalContainer").fadeOut();
    $("#newEmail").val("");
  });

  // Open email change modal
  $(document).on("click", "#editAccount", () => {
    $("#inputModalContainer").fadeIn();
  });

  // Handle email change form submission
  $(document).on("submit", "#emailForm", function (e) {
    if ($("#newEmail").val() === "") {
      return;
    }

    e.preventDefault();

    // Show confirmation modal
    $("#confirmationInputModal").fadeIn();
  });

  // Close confirmation modal
  $(document).on("click", "#cancelBtn, #closeModalBtn", function () {
    $("#confirmationInputModal").fadeOut();
  });


// Login password toggle
$("#faEyePassword").on("click", function (e) {
  faEyeToggle = !faEyeToggle;

  $(this)
    .removeClass(faEyeToggle ? "fa-eye" : "fa-eye-slash")
    .addClass(faEyeToggle ? "fa-eye-slash" : "fa-eye");

  $("#passwordInput").attr("type", faEyeToggle ? "text" : "password");
});


// Sign up password toggle
$("#signUpPassword").on("click", function (e) {
  faEyeToggleSignUp = !faEyeToggleSignUp;

  $(this)
    .removeClass(faEyeToggleSignUp ? "fa-eye" : "fa-eye-slash")
    .addClass(faEyeToggleSignUp ? "fa-eye-slash" : "fa-eye");

  $("#passwordSignUp").attr("type", faEyeToggleSignUp ? "text" : "password");
});


// Confirm password toggle
$("#signUpConfirmPassword").on("click", function (e) {
  faEyeToggleConfirmSignUp = !faEyeToggleConfirmSignUp;

  $(this)
    .removeClass(faEyeToggleConfirmSignUp ? "fa-eye" : "fa-eye-slash")
    .addClass(faEyeToggleConfirmSignUp ? "fa-eye-slash" : "fa-eye");

  $("#confirmPassword").attr("type", faEyeToggleConfirmSignUp ? "text" : "password");
});


});