let arritems = [];
let tempId = "";
let currentEditId = -1;
let editingIndex = -1;
let currentPage = 1;

let currentCancellationId = {
  cancelationId: null,
  productId: null,
  referenceCode: null
  
};

const overlay = document.querySelector(".overlay");
const UpdateOverlay = document.querySelector("#UpdateOverlay");

window.closeModal = function () {
  overlay.classList.remove("active");
};

window.openModal = function () {
  overlay.classList.add("active");
};

window.closeModalUpdate = function () {
  UpdateOverlay.classList.remove("active");
};

window.openModalUpdate = function () {
  UpdateOverlay.classList.add("active");
};


$(document).ready(async function () {

  await displayItems();

  function myToast(message, status) {
    const $x = $("#snackbar");
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

  function hideContainers() {
    $("#transactionContainer").hide();
    $("#cancelRecordContainer").hide();
  }

  function clearBtn() {
    const hasItems = Array.isArray(arritems) && arritems.length !== 0;

    if (hasItems) {
      $("#clearStorage")
        .show()
        .prop("disabled", false)
        .css("cursor", "pointer");
    } else {
      $("#clearStorage")
        .hide()
        .prop("disabled", true)
        .css("cursor", "not-allowed");
    }
  }

  function clearItemForm() {
    $("#productName").val("");
    $("#productPrice").val("");
    $("#categoryFilter").eq(0).prop("selected", true);
    $("#productQty").val("");
    $("#productDescription").val("");
    $("#productImage").val("");
  }

  hideContainers();

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

  $("#logoutNav").click(async function () {
    if (!confirm("Do you want to log out?")) return;

    const res = await fetch("logout.php");
    await res.json();

    if (!res.ok) {
      myToast("Logout unsuccessful!", "Danger");
      return;
    }

    window.location.href = "index.html";
  });

  $("#productForm").submit(function (e) {
    productFormSubmit(e);
  });

  $("#productUpdateForm").submit(async function (e) {

    await productUpdateFormSubmit(e);
  });

  $("#searchInput").on("input", function () {
    displayItems();
  });

  $("#filterSelect").change(function () {
    displayItems();
  });

  window.editProduct = async function (id) {  
    currentEditId = id;

    const req = await fetch(
      `adminProductdb.php?id=${encodeURIComponent(id)}`
    );

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
    $("#Updateimages").attr("src", result.img);

    window.openModalUpdate();
  };



  async function displayItems() {
    $("#itemContainer").html("");

    const res = await fetch(
      `adminProductdb.php?search=${encodeURIComponent($("#searchInput").val())}&price=${encodeURIComponent($("#filterSelect").val())}`
    );

    if (!res.ok) {
      console.error("Failed to fetch products:", res.statusText);
      return;
    }

    arritems = await res.json();

    if (Array.isArray(arritems) && arritems.length > 0) {
      $.each(arritems, function (index, item) {

        const card = `
          <div class="bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col hover:border-slate-300 hover:shadow-md transition-all duration-200">

            <img src="${item.img}" alt="${item.name}" class="w-full h-36 object-contain bg-slate-50 p-3">

            <div class="px-4 pt-3">
              <span class="inline-block text-xs font-medium px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                ${item.category ?? "Product"}
              </span>
            </div>

            <div class="flex flex-col gap-1 px-4 pt-2 pb-3 flex-1">
              <p class="text-sm font-semibold text-slate-900 m-0">${item.name}</p>
              <p class="text-xs text-slate-500 line-clamp-2 m-0">${item.description}</p>

              <div class="flex justify-between items-center mt-2">
                <span class="text-base font-bold text-slate-900">
                  ₱${Number(item.price).toLocaleString()}
                </span>

                <span class="text-xs px-2 py-1 rounded-full border ${
                  item.stock <= 5
                    ? "bg-red-50 text-red-700 border-red-200"
                    : "bg-slate-100 text-slate-500 border-slate-200"
                }">
                  Stock: ${item.stock}
                </span>
              </div>
            </div>

            <div class="flex gap-2 px-4 pb-4">
              <button class="flex-1 py-2 text-xs font-medium rounded-lg bg-amber-100 text-amber-900 hover:bg-amber-200 border-none cursor-pointer"
                onclick="editProduct(${item.productId})">
                Edit
              </button>

              <button class="flex-1 py-2 text-xs font-medium rounded-lg bg-red-100 text-red-800 hover:bg-red-200 border-none cursor-pointer"
                onclick="deleteProduct(${item.productId}, '${item.name}')">
                Delete
              </button>
            </div>

          </div>
        `;

        $("#itemContainer").append(card);
      });

    } else {
      $("#itemContainer").html(
        '<p class="text-slate-400 text-center col-span-full py-10">No products found.</p>'
      );
    }

    clearBtn();
  }

  overlay.addEventListener("click", function (e) {
    if (e.target === overlay) {
      window.closeModal();
    }
  });
  
async function getTransactionRecord(page = 1) {
    const req = await fetch(`transactiondb.php?page=${page}`, {
        method: "GET"
    });

    const res = await req.json();

    if (!req.ok) {
        console.log("Something went wrong");
        return [];
    }

    return res;
}

function fmt(n) {
  return '₱' + n.toLocaleString('en-PH', { minimumFractionDigits: 2 });
}

async function displayTransaction(page = 1) {
  const transac = await getTransactionRecord(page);
  const tbody = $("#tbody");

  if (!transac || transac.length === 0) {
    tbody.html(`
      <tr>
        <td colspan="7" class="text-center py-10 text-gray-400">
          No transactions found
        </td>
      </tr>
    `);
    return;
  }

  let rows = "";

  for (let trans of transac) {
    rows += `
      <tr class="hover:bg-blue-50 even:bg-gray-50 transition-colors">
        <td class="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
          ${trans.date}
        </td>

        <td class="px-4 py-3 font-medium text-gray-800">
          ${trans.productName}
        </td>

        <td class="px-4 py-3">
          <span class="bg-blue-50 text-blue-700 text-xs font-mono px-2 py-0.5 rounded border border-blue-200">
            ${trans.referenceCode}
          </span>
        </td>

        <td class="px-4 py-3 text-xs text-gray-400">
          ${trans.productId}
        </td>

        <td class="px-4 py-3 text-center">
          <span class="bg-gray-100 text-gray-700 text-xs font-medium px-2 py-0.5 rounded">
            ${trans.quantity}
          </span>
        </td>

        <td class="px-4 py-3 text-right text-gray-500 text-sm">
          ${fmt(trans.price)}
        </td>

        <td class="px-4 py-3 text-right">
          <span class="text-green-700 bg-green-50 font-medium text-sm px-2 py-0.5 rounded">
            ${fmt(trans.totalSales)}
          </span>
        </td>
      </tr>
    `;
  }

  tbody.html(rows);
}

  displayTransaction();

  async function productFormSubmit(e) {
    e.preventDefault();

    const name = $("#productName").val().trim();
    const price = parseFloat($("#productPrice").val());
    const category = $("#categoryFilter").val();
    const quantity = parseInt($("#productQty").val());
    const description = $("#productDescription").val().trim();
    const imageUrl = $("#productImage").val().trim();

    if (!name) {
      myToast("Product Name must not be empty.", "Danger");
      return;
    }

    if (!description) {
      myToast("Product Description must not be empty.", "Danger");
      return;
    }

    if (!imageUrl) {
      myToast("Product must have an image.", "Danger");
      return;
    }

    if (category === "all") {
      myToast("Please select a category.", "Danger");
      return;
    }

    if (isNaN(price) || isNaN(quantity)) {
      myToast("Invalid numbers.", "Danger");
      return;
    }

    if (price <= 0 || quantity <= 0) {
      myToast("Must be greater than zero.", "Danger");
      return;
    }

    try {
      const res = await fetch("adminProductdb.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          price,
          category,
          stock: quantity,
          img: imageUrl,
          description
        })
      });

      if (!res.ok) return myToast("Failed to add product.", "Danger");

      myToast("Product added successfully!", "Success");

      clearItemForm();
      displayItems();
      await displayTransaction();
    } catch (err) {
      console.error(err);
      myToast("An error occurred.", "Danger");
    }
  }

  async function productUpdateFormSubmit(e) {
    e.preventDefault();

    const name = $("#productUpdateName").val().trim();
    const price = parseFloat($("#productUpdatePrice").val());
    const category = $("#categoryUpdateFilter").val();
    const quantity = parseInt($("#productUpdateQty").val());
    const description = $("#productUpdateDescription").val().trim();
    const imageUrl = $("#productUpdateImage").val().trim();
    if (!name) {
        return myToast("Product Name must not be empty.", "Danger");
    }

    if (!description) {
        return myToast("Product Description must not be empty.", "Danger");
    }

    if (!imageUrl) {
        return myToast("Product must have an image.", "Danger");
    }

    if (category === "all") {
        return myToast("Please select a category.", "Danger");
    }

    if (isNaN(price) || isNaN(quantity)) {
        return myToast("Invalid numbers.", "Danger");
    }

    if (price <= 0 || quantity <= 0) {
        return myToast("Must be greater than zero.", "Danger");
    }

    try {
      const res = await fetch(
        `adminProductdb.php?id=${encodeURIComponent(currentEditId)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            price,
            category,
            stock: quantity,
            img: imageUrl,
            description
          })
        }
      );

      if (!res.ok) return myToast("Failed to update product.", "Danger");

      myToast("Product updated successfully!", "Success");

      displayItems();
      await displayTransaction();
      window.closeModalUpdate();
    } catch (err) {
      console.error(err);
      myToast("An error occurred.", "Danger");
    }
  }

  window.deleteProduct = function (id, productName) {
    tempId = id;
    $("#itemSelected").html(productName);
    $("#deleteItemModal").fadeIn();
  };

  $(document).on("click", ".close, #deleteItemCancel", function () {
    $("#deleteItemModal").fadeOut();
  });

  $(document).on("click", "#deleteItemConfirm", async function () {
    const res = await fetch(
      `adminProductdb.php?id=${tempId}`,
      { method: "DELETE" }
    );

    if (!res.ok) {
      myToast("Failed to delete item.", "Danger");
      return;
    }

    $("#deleteItemModal").fadeOut();
    myToast("Item Successfully Deleted", "Success");

    displayItems();
  });

  $(document).on("click", "#clearStorage", function () {
    $("#myModal").fadeIn();
  });

  $(document).on("click", ".close, #modalCancel", function () {
    $("#myModal").fadeOut();
  });

  $("#modalConfirm").click(async function () {
    $("#myModal").fadeOut();

    const res = await fetch("adminProductdb.php", {
      method: "DELETE"
    });

    if (!res.ok) {
      myToast("Failed to clear products.", "Danger");
      return;
    }

    myToast("Storage cleared!", "Success");
    displayItems();
  });

  $("#prevBtn").on("click", function () {
    if (currentPage > 1) {
        currentPage--;
        displayTransaction(currentPage);
        $("#pageNumber").text(currentPage);
    }
});

 $("#nextBtn").on("click", async function () {
     const nextPage = currentPage + 1;
     const data = await getTransactionRecord(nextPage);
     if (!data || data.length === 0) return; // no more pages
     currentPage = nextPage;
     displayTransaction(currentPage);
     $("#pageNumber").text(currentPage);
 });


const cancelOverlay = document.getElementById("cancelOverlay");

window.openCancelModal = function () {
  cancelOverlay.classList.add("active");
};

window.closeCancelModal = function () {
  cancelOverlay.classList.remove("active");
};

window.viewCancellation = async function (cancelationId, orderId, referenceCode) {
  currentCancellationId['cancelationId'] = cancelationId;
  currentCancellationId['productId'] = orderId;
  currentCancellationId['referenceCode'] = referenceCode;

  const res = await fetch(`cancellationdb.php?id=${cancelationId}`);

  if (!res.ok) {
    myToast("Failed to load cancellation.", "Danger");
    return;
  }

  const data = await res.json();

  $('#images').attr('src', data.img);
  $("#cancelName").val(data.productName);     
  $("#productCancelPrice").val(data.price); 
  $("#categoryCancelFilter").val(data.category);
  $("#cancelProduct").val(data.productName);
  $("#productCancelQty").val(data.quantity);
  $("#cancelTotalPriceImage").val(data.price * data.quantity);
  $("#reason").val(data.reason);

  window.openCancelModal();
  
};

$("#approveBtn").click(async function () {
  await updateRefundStatus("Accepted");
});

$("#declineBtn").click(async function () {
  await updateRefundStatus("Decline");
});

async function updateRefundStatus(status) {
  if (!currentCancellationId.cancelationId || !currentCancellationId.productId || !currentCancellationId.referenceCode) {
    myToast("No cancellation selected.", "Danger");
    return;
  }


  let res;
  try {
    res = await fetch("cancellationdb.php", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cancelationId: currentCancellationId.cancelationId,
        productId: currentCancellationId.productId,
        referenceCode: currentCancellationId.referenceCode,
        status: status
      })
    });
  } catch (err) {
    myToast("Network error.", "Danger");
    return;
  }

  let data;
try {
  data = await res.json();
} catch {
  myToast("Invalid server response.", "Danger");
  return;
}

  if (!res.ok || !data.success) {
    myToast(data.message || "Failed to update status.", "Danger");
    return;
  }

  myToast(`Request ${status}`, "Success");

  window.closeCancelModal();
  displayCancellations();
};



async function displayCancellations() {
  const res = await fetch("refund.php", {
    method: "GET",
  });

  if (!res.ok) {
    myToast("Failed to load cancellations.", "Danger");
    return;
  }

  const data = await res.json();
  
  let rows = "";

  if (!data || data.length === 0) {
    $("#cancelTbody").html(`
      <tr>
        <td colspan="7" class="text-center py-10 text-gray-400">
          No cancellation requests found
        </td>
      </tr>
    `);
    return;
  }

  for (let c of data) {
    rows += `
      <tr class="border-b hover:bg-gray-50 transition">
        <td class="px-6 py-4">${c.cancellationId}</td>
        <td class="px-6 py-4 font-medium text-gray-900">${c.referenceCode}</td>
        <td class="px-6 py-4">${c.productName}</td>
        <td class="px-6 py-4">${c.email}</td>
        <td class="px-6 py-4">${c.reason}</td>
        <td class="px-6 py-4">${c.createdAt}</td>
        <td class="px-6 py-4 text-center">
          <button
            onclick="viewCancellation(${c.cancellationId}, ${c.orderItemId}, '${c.referenceCode}')"
            class="px-4 py-2 cursor-pointer text-white bg-blue-600 hover:bg-blue-700 rounded-lg text-sm"
          >
            View Details
          </button>
        </td>
      </tr>
    `;
  }

  $("#cancelTbody").html(rows);
}
displayCancellations();

});