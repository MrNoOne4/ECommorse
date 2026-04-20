<?php
session_start();
  header("Cache-Control: no-store, no-cache, must-revalidate"); 
  header("Pragma: no-cache"); 
  header("Expires: 0");
  
if (!isset($_SESSION["user"]) || $_SESSION["user"]["role"] !== "admin") {
    http_response_code(401);
    echo json_encode(["error" => "Unauthorized"]);
    exit;
}



?>

<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Admin Dashboard - E-Shopping App</title>
    <script src="https://code.jquery.com/jquery-3.7.1.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
    <style>

      #snackbar {
        visibility: hidden;
        min-width: 250px;
        color: #fff;
        text-align: center;
        border-radius: 6px;
        padding: 12px 20px;
        position: fixed;
        z-index: 9999;
        top: 30px;
        left: 50%;
        transform: translateX(-50%);
        font-size: 14px;
      }
      #snackbar.show {
        visibility: visible !important;
        animation: fadein 0.5s, fadeout 0.5s 2.5s;
      }
      @keyframes fadein {
        from { top: 0; opacity: 0; }
        to   { top: 30px; opacity: 1; }
      }
      @keyframes fadeout {
        from { top: 30px; opacity: 1; }
        to   { top: 0; opacity: 0; }
      }

      .overlay {
        position: fixed;
        inset: 0;
        background: rgba(0,0,0,0.5);
        display: flex;
        justify-content: center;
        align-items: flex-start;
        padding-top: 40px;
        z-index: 1000;
        opacity: 0;
        pointer-events: none;
        transition: 0.3s ease;
      }

      .overlay.active {
        opacity: 1;
        pointer-events: auto;
      }

      .modal {
        width: 90%;
        max-width: 480px;
        background: white;
        border-radius: 10px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        transform: translateY(-80px);
        opacity: 0;
        transition: 0.3s ease;
        overflow-y: auto;
        max-height: 90vh;
      }

      .overlay.active .modal {
        opacity: 1;
      }



      .modal-header h2 {
        margin: 0;
        font-size: 18px;
        font-weight: 600;
      }


      .close-btn:hover { color: #000; }
    </style>
  </head>

  <body class="bg-slate-50 text-slate-800 min-h-screen overflow-x-hidden font-sans">

    <div id="snackbar" class="invisible opacity-0 fixed top-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-5 py-3 rounded-md text-sm transition-all duration-300 z-[9999]"></div>

    <section class="grid grid-cols-[260px_1fr] min-h-screen max-lg:grid-cols-[220px_1fr] max-md:grid-cols-1">

      <aside
        id="dashboardNav"
        class="sticky top-0 h-screen bg-slate-900 text-white px-4 py-6 overflow-y-auto max-md:relative max-md:h-auto max-md:w-full"
      >
        <h2 class="text-2xl font-bold text-slate-200 mb-8 text-center">Admin Panel</h2>
        <nav>
          <ul class="list-none space-y-2 p-0 m-0">
            <li>
              <a href="#" id="productNav"
                class="text-slate-300 no-underline block px-5 py-3 rounded-md transition-all duration-200 hover:bg-slate-800 hover:text-white cursor-pointer">
                Products
              </a>
            </li>
            <li>
              <a href="#" id="cancelNav"
                class="text-slate-300 no-underline block px-5 py-3 rounded-md transition-all duration-200 hover:bg-slate-800 hover:text-white cursor-pointer">
                Refund Requests
              </a>
            </li>
            <li>
              <a href="#" id="transactionNav"
                class="text-slate-300 no-underline block px-5 py-3 rounded-md transition-all duration-200 hover:bg-slate-800 hover:text-white cursor-pointer">
                Transaction Record
              </a>
            </li>
            <li>
              <a id="logoutNav"
                class="text-slate-300 no-underline block px-5 py-3 rounded-md transition-all duration-200 hover:bg-slate-800 hover:text-white cursor-pointer">
                Logout
              </a>
            </li>
          </ul>
        </nav>
      </aside>

      <main class="bg-white p-8 max-md:p-6">

        <section id="productDashboard">

          <div class="flex justify-between items-center mb-6">
            <h2 class="text-4xl font-bold text-slate-900 m-0">Admin Dashboard</h2>
            <button
              id="clearStorage"
              class="px-4 py-2 bg-red-500 text-white font-semibold rounded-md border-none cursor-pointer transition-colors duration-200 hover:bg-red-700"
            >
              Clear Storage
            </button>
          </div>

          <h3 class="text-2xl font-semibold text-slate-700 mt-9 mb-5">Product Management (CRUD)</h3>

          <form
            id="productForm"
            class="grid gap-5 mb-10 grid gap-5 mb-10 grid-cols-[repeat(auto-fit,minmax(260px,1fr))]"
            method="POST"
          >
            <input type="text" id="productName" placeholder="Product Name" class="px-4 py-3 border border-slate-300 rounded-md text-base outline-none focus:border-blue-400 transition-colors" />
            <input type="number" id="productPrice" placeholder="Price" class="px-4 py-3 border border-slate-300 rounded-md text-base outline-none focus:border-blue-400 transition-colors" />
            <select id="categoryFilter" class="px-4 py-3 border border-slate-300 rounded-md text-base outline-none focus:border-blue-400 cursor-pointer transition-colors">
                <option value="all">All Categories</option>
                <option value="Electronics">Electronics</option>
                <option value="Foods">Foods</option>
                <option value="Clothes">Clothes</option>
                <option value="Shoes">Shoes</option>
                <option value="Books">Books</option>
            </select>

            <input type="number" id="productQty" placeholder="Quantity" class="px-4 py-3 border border-slate-300 rounded-md text-base outline-none focus:border-blue-400 transition-colors" />
            <input type="text" id="productImage" placeholder="Image URL" class="px-4 py-3 border border-slate-300 rounded-md text-base outline-none focus:border-blue-400 transition-colors" />
            <textarea id="productDescription" placeholder="Product Description" class="col-span-full px-4 py-3 border border-slate-300 rounded-md text-base outline-none focus:border-blue-400 transition-colors min-h-[110px] resize-y"></textarea>

            <div id="errorBox"
              class="col-span-full hidden bg-red-100 text-red-800 px-4 py-3 rounded-md border border-red-200 my-2"></div>

            <button type="submit"
              class="col-span-full py-4 bg-blue-500 text-white font-semibold rounded-md border-none cursor-pointer transition-colors duration-200 hover:bg-blue-600">
              Add Product
            </button>
          </form>

          <h3 class="text-2xl font-semibold text-slate-700 mt-9 mb-5">Products</h3>

          <div id="searchFilter" class="flex flex-wrap gap-4 mb-7 max-md:flex-col">
            <input type="text" id="searchInput" placeholder="Search by product name"
              class="px-4 py-3 border border-gray-300 rounded-md text-base min-w-[220px] flex-1 max-md:min-w-full outline-none focus:border-blue-400 transition-colors" />
            <select id="filterSelect"
              class="px-4 py-3 border border-gray-300 rounded-md text-base min-w-[220px] flex-1 max-md:min-w-full outline-none focus:border-blue-400 cursor-pointer transition-colors">
              <option value="">All</option>
              <option value="Low">Below 100</option>
              <option value="Medium">Price 100–500</option>
              <option value="High">Higher than 500</option>
            </select>
          </div>

          <div
            id="itemContainer"
            class="grid gap-6 max-md:grid-cols-1"
            style="grid-template-columns: repeat(auto-fill, minmax(245px, 1fr));"
          ></div>

        </section>

        <section id="cancelRecordContainer" class="h-full w-full overflow-y-hidden">

          <h2 class="text-4xl font-bold text-slate-900 mb-6">
            Cancellation Requests
          </h2>

          <div class="overflow-x-auto bg-white rounded-xl shadow">
            <table class="min-w-full text-sm text-left text-gray-700">

              <thead class="bg-gray-100 text-gray-800 uppercase text-xs">
                <tr>
                  <th class="px-6 py-4">ID</th>
                  <th class="px-6 py-4">Reference Code</th>
                  <th class="px-6 py-4">Product</th>
                  <th class="px-6 py-4">User</th>
                  <th class="px-6 py-4">Reason</th>
                  <th class="px-6 py-4">Date</th>
                  <th class="px-6 py-4 text-center">Action</th>
                </tr>
              </thead>

              <tbody id="cancelTbody">
                <!-- dynamic rows here -->
              </tbody>

            </table>
          </div>

</section>


        <section id="transactionContainer" class="h-full w-full">
          <h2 class="text-4xl font-bold text-slate-900 mb-6">Transaction Record</h2>
          <div class="mx-auto max-h-screen px-4 py-8 sm:px-8">
            <div class="overflow-y-hidden border w-full">
              <div class="tx-card overflow-x-scroll">
                <table class="tx-table w-full overflow-y-scroll max-h-screen h-">
                  <thead>
                    <tr class="bg-blue-700">
                      <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-white">Date</th>
                      <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-white">Product Name</th>
                      <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-white">Reference Code</th>
                      <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-white">Product ID</th>
                      <th class="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-white">Qty</th>
                      <th class="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-white">Price</th>
                      <th class="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-white">Total Sales</th>
                    </tr>
                  </thead>
                  <tbody id="tbody" class="divide-y divide-gray-100"></tbody>
                </table>
                <div class="flex justify-center gap-4 mt-4">
                  <button id="prevBtn" class="text-white bg-black rounded-md shadow-xs cursor-pointer bg-brand box-border border border-transparent hover:bg-brand-strong focus:ring-4 focus:ring-brand-medium shadow-xs font-medium leading-5 rounded-base text-sm px-4 py-2.5 focus:outline-none">Prev</button>
                  <span id="pageNumber" class="px-4 py-2">1</span>
                  <button id="nextBtn" class="text-white bg-black rounded-md shadow-xs cursor-pointer bg-brand box-border border border-transparent hover:bg-brand-strong focus:ring-4 focus:ring-brand-medium shadow-xs font-medium leading-5 rounded-base text-sm px-4 py-2.5 focus:outline-none">Next</button>
              </div>
              </div>
            </div>
          </div>
        </section>

        <div id="myModal" class="hidden fixed z-[1000] inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center">
          <div class="bg-white rounded-lg p-6 w-[90%] max-w-sm text-center fixed top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2">
            <span class="close absolute top-2 right-4 text-2xl font-bold cursor-pointer">&times;</span>
            <h3 class="text-xl font-semibold text-slate-900 mb-2">
              Are you sure you want to delete all stored data?
            </h3>
            <p class="text-slate-700 mb-6">This action is permanent and cannot be undone.</p>
            <div class="flex justify-around">
              <button id="modalConfirm" class="px-5 py-3 bg-blue-500 text-white rounded-md font-medium border-none cursor-pointer hover:bg-blue-600">
                Confirm
              </button>
              <button id="modalCancel" class="px-5 py-3 bg-red-500 text-white rounded-md font-medium border-none cursor-pointer hover:bg-red-600">
                Cancel
              </button>
            </div>
          </div>
        </div>

        <div id="deleteItemModal" class="hidden fixed z-[1000] inset-0 bg-black/40 backdrop-blur-xs flex items-center h-screen justify-center">
          <div class="bg-white rounded-lg p-6 w-[90%] max-w-sm text-center fixed top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2">
            <span class="close absolute top-2 right-4 text-2xl font-bold cursor-pointer">&times;</span>
            <h3 class="text-xl font-semibold text-slate-900 mb-1">
              Are you sure you want to delete<br>Product <strong><span id="itemSelected"></span></strong>?
            </h3>
            <p class="text-slate-700 mb-6">This action cannot be undone.</p>
            <div class="flex justify-around">
              <button id="deleteItemConfirm" class="px-5 py-3 bg-blue-500 text-white rounded-md font-medium border-none cursor-pointer hover:bg-blue-600">
                Confirm
              </button>
              <button id="deleteItemCancel" class="px-5 py-3 bg-red-500 text-white rounded-md font-medium border-none cursor-pointer hover:bg-red-600">
                Cancel
              </button>
            </div>
          </div>
        </div>

      </main> 

      <div class="overlay fixed inset-0 bg-black/40  opacity-0 pointer-events-none transition-all backdrop-blur-xs duration-300 z-[1000]" id="cancelOverlay">
        <div class="modal w-[90%] max-w-md bg-white rounded-xl shadow-xl transform transition-all duration-300  translate-y-25   opacity-0 ">
          <div class="modal-header flex text-center justify-between items-center px-5 py-4 border-b sticky top-0 bg-white z-10">
            <h2 >Cancelation Details Product</h2>
            <button class="close-btn text-xl text-gray-500 hover:text-black cursor-pointer" onclick="closeModal()">✖</button>
          </div>

          <form id="productUpdateForm" class="flex flex-col p-5 gap-3" method="PATCH">
            <div class="flex justify-center items-center justify-center">
              <img src="" class="w-50 h-50 " id="images"></div>
            <input type="text" id="cancelName" placeholder="Product Name"
              class="px-4 py-3 border border-slate-300 rounded-md text-base outline-none focus:border-blue-400 transition-colors"  disabled="true"/>
            <input  id="productCancelPrice" placeholder="Price"
              class="px-4 py-3 border border-slate-300 rounded-md text-base outline-none focus:border-blue-400 transition-colors"  disabled="true"/>
            <select id="categoryCancelFilter"
              class="px-4 py-3 border border-slate-300 rounded-md text-base outline-none focus:border-blue-400 cursor-pointer transition-colors" disabled="true">
                <option value="all">All Categories</option>
                <option value="Electronics">Electronics</option>
                <option value="Foods">Foods</option>
                <option value="Clothes">Clothes</option>
                <option value="Shoes">Shoes</option>
                <option value="Books">Books</option>
            </select>
            <input type="number" id="productCancelQty" placeholder="Quantity"
              class="px-4 py-3 border border-slate-300 rounded-md text-base outline-none focus:border-blue-400 transition-colors"  disabled="true"/>
            <input type="text" id="cancelTotalPriceImage" placeholder="Total Price"
              class="px-4 py-3 border border-slate-300 rounded-md text-base outline-none focus:border-blue-400 transition-colors"  disabled="true"/>
            <textarea id="reason" placeholder="Product Description"
              class="px-4 py-3 border border-slate-300 rounded-md text-base outline-none focus:border-blue-400 transition-colors"  disabled="true"
              style="resize:none; height:80px;"></textarea>

            <div class="flex gap-3 mt-4">

              <button type="button" id="approveBtn"
                class="flex-1 py-3 bg-green-500 text-white font-semibold rounded-md border-none cursor-pointer transition-colors duration-200 hover:bg-green-600">
                Approve
              </button>

              <button type="button" id="declineBtn"
                class="flex-1 py-3 bg-red-500 text-white font-semibold rounded-md border-none cursor-pointer transition-colors duration-200 hover:bg-red-600">
                Decline
              </button>

            </div>
          </form>
      </div>
    </div>
    
    </section>



    <script src="Product.js"></script>
    <script src="admin.js"></script>
  </body>
</html>