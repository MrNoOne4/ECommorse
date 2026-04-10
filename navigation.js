// Function that controls page navigation (show/hide sections)
function hidePages(index) {
  // Select all page sections (each section has class "pages")
  const page = document.querySelectorAll(".pages");

  // Select all sidebar/menu items (li elements)
  const aside = document.querySelectorAll("li");

  // Hide all pages first
  page.forEach((e) => {
    e.style.display = "none";
  });

  // Reset all sidebar items to default styling
  aside.forEach((e) => {
    e.style.backgroundColor = "transparent";
    e.style.color = "white";
  });

  // Show the selected page based on the given index
  page[index].style.display = "block";

  // Highlight the active sidebar item
  aside[index].style.backgroundColor = "#F5F5F5";
  aside[index].style.color = "black";
}

// Global navigation function (can be called from anywhere in the app)
window.navigate = function (index) {
  // Switch visible page
  hidePages(index);

  // If navigating to page index 1 (e.g., cart page), re-render cart contents
  if (index === 1) renderCart();
};