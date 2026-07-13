function formatMonthYear(timestamp) {
    if (!timestamp) return "";

    const options = {
        timeZone: "Asia/Manila",
        year: "numeric",
        month: "long"
    };

    if (typeof timestamp === "object" && timestamp.seconds) {
        const date = new Date(timestamp.seconds * 1000);
        return date.toLocaleDateString("en-US", options);
    }

    const date = new Date(timestamp);
    if (!isNaN(date.getTime())) {
        return date.toLocaleDateString("en-US", options);
    }

    return "";
}
function toDisplayNumber(value) {
    const num = Number(value || 0);
    return Number.isInteger(num) ? num.toString() : num.toFixed(2);
}
function getRemainingMonthsDisplay(expiration_date) {
    if (!expiration_date) {
        return `<span class="badge bg-secondary">-</span>`;
    }

    const today = new Date();
    const exp = new Date(String(expiration_date).replace(" ", "T"));

    let years = exp.getFullYear() - today.getFullYear();
    let months = exp.getMonth() - today.getMonth();
    let totalMonths = years * 12 + months;

    if (exp.getDate() < today.getDate()) totalMonths--;

    if (totalMonths < 0) {
        return `<span class="badge bg-danger">Expired</span>`;
    }

    if (totalMonths <= 3) {
        return `<span class="badge bg-warning text-dark">${totalMonths} mo</span>`;
    }

    return `<span class="badge bg-success">${totalMonths} mo</span>`;
}
function getExpiryStatus(expiration_date) {
    if (!expiration_date) return "VALID";

    const today = new Date();
    const exp = new Date(expiration_date);

    let years = exp.getFullYear() - today.getFullYear();
    let months = exp.getMonth() - today.getMonth();
    let totalMonths = years * 12 + months;

    if (exp.getDate() < today.getDate()) totalMonths--;

    if (totalMonths < 0) return "EXPIRED";
    if (totalMonths <= 3) return "EXPIRING_SOON"; // expiration date
    return "VALID";
}

//function getStatusBadge(availableQty, reservedQty = 0) {

//    const qty = Number(availableQty || 0);
//    const reserved = Number(reservedQty || 0);

//    // Fully Reserved
//    if (qty <= 0 && reserved > 0) {
//        return `
//            <span class="badge bg-warning text-dark">
//                Fully Reserved
//            </span>
//        `;
//    }

//    // Out of Stock
//    if (qty <= 0) {
//        return `
//            <span class="badge bg-danger">
//                Out of Stock
//            </span>
//        `;
//    }

//    // Low Stock
//    if (qty <= 10) {
//        return `
//            <span class="badge bg-warning text-dark">
//                Low Stock
//            </span>
//        `;
//    }

//    // Normal
//    if (qty <= 500) {
//        return `
//            <span class="badge bg-success">
//                Normal
//            </span>
//        `;
//    }

//    // Over Stock
//    return `
//        <span class="badge bg-primary">
//            Over Stock
//        </span>
//    `;
//}

function getStatusBadge(availableQty, reservedQty = 0, stockLevel = 0) {
    const qty = Number(availableQty || 0);
    const reserved = Number(reservedQty || 0);
    const level = Number(stockLevel || 0);

    if (qty <= 0 && reserved > 0) {
        return `<span class="badge bg-warning text-dark">Fully Reserved</span>`;
    }

    if (qty <= 0) {
        return `<span class="badge bg-danger">Out of Stock</span>`;
    }

    if (level > 0 && qty < level) {
        return `<span class="badge bg-warning text-dark">Low Stock</span>`;
    }

    return `<span class="badge bg-success">Normal</span>`;
}

function formatPack(qty, packQty, packUom, baseUom) {
    if (!qty || !packQty) return "-";

    const fullPacks = Math.floor(qty / packQty);
    const remainder = qty % packQty;

    let result = "";

    if (fullPacks > 0) result += `${fullPacks} ${packUom}`;
    if (remainder > 0) {
        if (result !== "") result += " & ";
        result += `${remainder} ${baseUom}`;
    }

    return result || `0 ${baseUom}`;
}
function toMonthInputValue(value) {
    if (!value) return "";

    const date = new Date(value);
    if (isNaN(date.getTime())) return "";

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");

    return `${year}-${month}`;
}

let currentPage = 1;
let pageSize = 30;
let totalRecords = 0;
let lotSearchTimeout;
let productSearchTimeout;
let isEditing = false;

async function loadInventory(page = currentPage) {
    try {
        currentPage = page;

        const params = new URLSearchParams({
            page: currentPage,
            pageSize: pageSize,
            lot_no: document.getElementById("lotNoFilter")?.value || "",
            //genericName: document.getElementById("genericNameFilter")?.value || "",
            //brandName: document.getElementById("brandNameFilter")?.value || "",
            search: document.getElementById("productSearchFilter")?.value || "",
            from: document.getElementById("dateFromFilter")?.value || "",
            to: document.getElementById("dateToFilter")?.value || "",
            warehouse: document.getElementById("warehouseFilter")?.value || "",
            category: document.getElementById("categoryFilter")?.value || "",
            stockStatus: document.getElementById("stockStatusFilter")?.value || "",
            expiryStatus:
                document.getElementById("expiryStatusFilter")?.value || "",
            months: document.getElementById("monthsFilter")?.value || "",
            sortBy: document.getElementById("sortByFilter")?.value || "lot",
            order: document.getElementById("orderFilter")?.value || "desc"
        });

        const response = await fetch(`/Inventory/GetInventory?${params.toString()}`);

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(errText);
        }

        const json = await response.json();
        let items = json.data || [];
       // loadCategoryFilter(items);

       

        // 🔥 ADD THIS BLOCK
        //const expiryFilter = document.getElementById("expiryStatusFilter")?.value;

        //if (expiryFilter && expiryFilter !== "All") {
        //    items = items.filter(item => {
        //        const status = getExpiryStatus(item.expiration_date);
        //        if (expiryFilter === "expired") return status === "EXPIRED";
        //        if (expiryFilter === "near") return status === "EXPIRING_SOON";
        //        if (expiryFilter === "safe") return status === "VALID";
        //        if (expiryFilter === "available") {
        //            return status !== "EXPIRED" && Number(item.qty) > 0;
        //        }

        //        return true;
        //    });
        //}
        //totalRecords = items.length;

        totalRecords = json.total;

        const tableBody = document.getElementById("inventoryTable");
        tableBody.innerHTML = "";

        if (items.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center text-muted">
                        No inventory data found.
                    </td>
                </tr>`;
            renderPagination();
            syncInventoryTopScrollbar();
            return;
        }

         //<td>${qty} ${item.uom ?? ""}</td>
         //  <td>${formatPack(item.qty, item.pack_qty, item.pack_uom, item.uom)}</td>

        items.forEach(item => {
            const onHandQty = Number(item.qty ?? 0);
            const reservedQty = Number(item.reserved_qty ?? 0);
            const availableQty = Number(
                item.available_qty ?? (onHandQty - reservedQty)
            );
            const disableTransfer = availableQty <= 0 ? "disabled" : "";

            const today = new Date();
            const expDate = item.expiration_date ? new Date(item.expiration_date) : null;
            const isExpired = expDate && expDate < today;

            const canAdjust =
                (isExpired && availableQty > 0) ||
                (!isExpired);
            const disableAdjust = canAdjust ? "" : "disabled";

            const adjustTitle =
                isExpired && availableQty <= 0 ? "No stock to dispose" :
                    isExpired ? "Dispose expired stock" :
                        "Adjust stock";

            const reservedDetailsJson = encodeURIComponent(
                JSON.stringify(item.reserved_details || [])
            );

            tableBody.innerHTML += `
       <tr class="inventory-row"
    data-product="${item.product_id ?? ""}"
    data-lot="${item.lot_no ?? ""}"
    data-qty="${availableQty}"
    data-branch="${item.branch_id ?? ""}"
    data-warehouse="${item.warehouse ?? ""}"
    data-uom="${item.uom ?? ""}"
    data-exp="${item.expiration_date ?? ""}">
            
        <td>
    <div class="product-cell">
        <div class="product-info">
            <div class="product-title">${item.description ?? ""}</div>
            ${item.product_description
                    ? `<div class="text-muted small">${item.product_description}</div>`
                    : ""}
        </div>

      <button type="button"
        class="btn-view-product-lots"
        title="View all lots for this product"
        data-product-id="${item.product_id ?? ""}"
        data-generic="${item.description ?? ""}"
        data-brand="${item.product_description ?? ""}">
    <i class="bi bi-search"></i>
</button>
    </div>
</td>
            <td>${item.category_name ?? "-"}</td>
            <td>
  <div class="qty-available-wrap btn-view-stock"
     data-product="${item.product_id ?? ""}"
     data-description="${item.description ?? ""}"
     data-product-description="${item.product_description ?? ""}"

     data-lot="${item.lot_no ?? ""}"
     data-branch="${item.branch_id ?? ""}"
     data-warehouse="${item.warehouse ?? ""}"
     data-onhand="${onHandQty}"
     data-reserved="${reservedQty}"
     data-available="${availableQty}"
     data-reserved-details="${reservedDetailsJson}"
     data-uom="${item.uom ?? ""}"
     title="View Reserved Details">

        <div class="qty-main-row">
            <span class="qty-main">
                ${availableQty} ${item.uom ?? ""}
            </span>

            <i class="bi bi-eye qty-eye-icon"></i>
        </div>

        <div class="qty-sub">
          OH:${onHandQty} |
            <span class="reserved-text">
                Res: ${reservedQty}
            </span>
        </div>
    </div>
</td>


<td>
    ${formatPack(availableQty, item.pack_qty, item.pack_uom, item.uom)}
</td>
           
         <td>${getStatusBadge(
             availableQty,
             reservedQty,
             item.stock_level
         )}</td>
            <td>
    <div class="lot-edit-wrap">
        <span>${item.lot_no ?? ""}</span>

        ${String(window.currentUserRole || "").toUpperCase() === "ADMIN" ? `
            <button
                type="button"
                class="btn-edit-lot"
                data-product="${item.product_id ?? ""}"
                data-branch="${item.branch_id ?? ""}"
                data-lot="${item.lot_no ?? ""}"
                title="Edit Lot No">
                <i class="bi bi-pencil-square"></i>
            </button>
        ` : ""}
    </div>
</td>
           <td>
    <span class="lot-edit-wrap">
        <span>
            ${formatMonthYear(item.manufacturing_date)}
            -
            ${formatMonthYear(item.expiration_date)}
        </span>

        <button
            type="button"
            class="btn-edit-date"
            data-product="${item.product_id ?? ""}"
            data-branch="${item.branch_id ?? ""}"
            data-lot="${item.lot_no ?? ""}"
            data-mfg="${item.manufacturing_date ?? ""}"
            data-exp="${item.expiration_date ?? ""}"
            title="Edit MFG / EXP Date">
            <i class="bi bi-pencil-square"></i>
        </button>
    </span>
</td>
            <td>${getRemainingMonthsDisplay(item.expiration_date)}</td>
            <td>${item.warehouse ?? ""}</td>
            ${canShowInventoryAction() ? `

            <td class="text-center action-col">

             <button class="btn btn-sm btn-outline-secondary btn-inventory-actions"
    type="button"
    data-product="${item.product_id ?? ""}"
    data-lot="${item.lot_no ?? ""}"
    data-branch="${item.branch_id ?? ""}"
    data-qty="${availableQty}"
    data-description="${item.description ?? ""}"
    data-product-description="${item.product_description ?? ""}"
    data-warehouse="${item.warehouse ?? ""}"

    data-onhand="${onHandQty}"
    data-reserved="${reservedQty}"
    data-available="${availableQty}"

    data-uom="${item.uom ?? ""}"
    data-exp="${item.expiration_date ?? ""}">
    Actions
</button>

            </td>


` : ""}
        </tr>`;
        });

        renderPagination();

    } catch (error) {
        document.getElementById("inventoryTable").innerHTML = `
            <tr>
                <td colspan="9" class="text-center text-danger">
                    ${error.message}
                </td>
            </tr>`;
        console.error(error);
    }
}


async function loadCategoryFilter() {
    const select = document.getElementById("categoryFilter");
    if (!select) return;

    const currentValue = select.value;

    const res = await fetch("/Inventory/GetInventoryCategories");
    const categories = await res.json();

    select.innerHTML = `<option value="">All Categories</option>`;

    categories.forEach(cat => {
        select.innerHTML += `
            <option value="${cat}">
                ${cat}
            </option>
        `;
    });

    select.value = currentValue;
}



function canShowInventoryAction() {
    const role = String(window.currentUserRole || "").trim().toUpperCase();

    return role !== "PRODUCTION";
}
function applyInventoryRoleUI() {
    const role = String(window.currentUserRole || "").trim().toUpperCase();

    if (role === "PRODUCTION") {
        document.querySelectorAll(".action-col").forEach(el => el.style.display = "none");
    }
}

async function loadBranchesDropdown() {
    try {
        const res = await fetch("/Inventory/GetBranches");

        if (!res.ok) {
            const errText = await res.text();
            throw new Error(errText || "Failed to load branches.");
        }

        const data = await res.json();
        const dropdown = document.getElementById("transferBranch");
        const fromBranch = document.getElementById("transferFromBranch").value || "";

        dropdown.innerHTML = `<option value="">Select Branch</option>`;

        data.forEach(b => {
            const branchId = b.branch_id ?? "";
            const branchName = b.branch_name ?? branchId;

            if (branchId !== fromBranch) {
                dropdown.innerHTML += `
                    <option value="${branchId}">
                        ${branchName}
                    </option>
                `;
            }
        });
    } catch (err) {
        console.error("Failed to load branches", err);
        alert("Failed to load branches.");
    }
}
function toDateInputValue(value) {
    if (!value) return "";

    const date = new Date(value);
    if (isNaN(date.getTime())) return "";

    return date.toISOString().slice(0, 10);
}
function renderPagination() {
    const totalPages = Math.ceil(totalRecords / pageSize);

    const start = totalRecords === 0 ? 0 : ((currentPage - 1) * pageSize) + 1;
    const end = Math.min(currentPage * pageSize, totalRecords);

    const rangeText = document.getElementById("rangeText");
    if (rangeText) {
        rangeText.innerText = `${start}–${end} of ${totalRecords}`;
    }

    const prevBtn = document.getElementById("prevBtn");
    const nextBtn = document.getElementById("nextBtn");

    if (prevBtn) prevBtn.disabled = currentPage === 1;
    if (nextBtn) nextBtn.disabled = currentPage >= totalPages || totalPages === 0;
}

function nextPage() {
    const totalPages = Math.ceil(totalRecords / pageSize);
    if (currentPage < totalPages) {
        currentPage++;
        loadInventory(currentPage);
    }
}

function prevPage() {
    if (currentPage > 1) {
        currentPage--;
        loadInventory(currentPage);
    }
}
document.addEventListener("click", function (e) {



    const editDateBtn = e.target.closest(".btn-edit-date");
    if (editDateBtn) {
        document.getElementById("editDateProductId").value = editDateBtn.dataset.product || "";
        document.getElementById("editDateBranchId").value = editDateBtn.dataset.branch || "";
        document.getElementById("editDateLotNo").value = editDateBtn.dataset.lot || "";
        document.getElementById("editDateLotDisplay").value = editDateBtn.dataset.lot || "";

        document.getElementById("editMfgDate").value = toMonthInputValue(editDateBtn.dataset.mfg);
        document.getElementById("editExpDate").value = toMonthInputValue(editDateBtn.dataset.exp);

        new bootstrap.Modal(document.getElementById("editDateModal")).show();
        return;
    }



    const productLotsBtn = e.target.closest(".btn-view-product-lots");

    if (productLotsBtn) {

        openProductLotsModal(
            productLotsBtn.dataset.productId,
            productLotsBtn.dataset.generic,
            productLotsBtn.dataset.brand
        );

        return;
    }


    // VIEW RESERVED DETAILS
    const viewStockBtn = e.target.closest(".btn-view-stock");
    if (viewStockBtn) {

        const product = viewStockBtn.dataset.description || "";
        const productDescription =
            viewStockBtn.dataset.productDescription || "";
        const lot = viewStockBtn.dataset.lot || "";
        const warehouse = viewStockBtn.dataset.warehouse || "";
        const onHand = Number(viewStockBtn.dataset.onhand || 0);
        const reserved = Number(viewStockBtn.dataset.reserved || 0);
        const available = Number(viewStockBtn.dataset.available || 0);
        const uom = viewStockBtn.dataset.uom || "";
        const reservedDetails = JSON.parse(
            decodeURIComponent(
                viewStockBtn.dataset.reservedDetails || "%5B%5D"
            )
        );

      

        document.getElementById("reservedModalSubTitle").innerHTML = `
    <div>${product}</div>
    ${productDescription
                ? `<div class="text-muted small">${productDescription}</div>`
                : ""}
    <div class="text-muted small">Lot: ${lot} | ${warehouse}</div>
`;

        document.getElementById("reservedOnHand").innerText = `${onHand} ${uom}`;
        document.getElementById("reservedQty").innerText = `${reserved} ${uom}`;
        document.getElementById("reservedAvailable").innerText = `${available} ${uom}`;

        if (!reservedDetails.length) {

            document.getElementById("reservedDetailsTable").innerHTML = `
        <tr>
            <td colspan="3" class="text-center text-muted">
                No reserved stock for this lot.
            </td>
        </tr>
    `;

        } else {

            document.getElementById("reservedDetailsTable").innerHTML =
                reservedDetails.map(x => `
            <tr>
                <td>${x.order_no ?? ""}</td>
                <td>${x.customer_name ?? ""}</td>
                <td class="text-end fw-semibold">
                    ${Number(x.reserved_qty || 0)} ${uom}
                </td>
            </tr>
        `).join("");
        }

        new bootstrap.Modal(
            document.getElementById("reservedDetailsModal")
        ).show();

        return;
    }

    //// TRANSFER
    //const btn = e.target.closest(".btn-transfer");
    //if (btn) {
    //    hideInventoryActionMenu(); 
    //    isEditing = true;

    //    const maxQty = parseFloat(btn.dataset.qty) || 0;

    //    document.getElementById("transferProduct").value = btn.dataset.product || "";
    //    document.getElementById("transferLot").value = btn.dataset.lot || "";
    //    document.getElementById("transferFromBranch").value = btn.dataset.branch || "";
    //    document.getElementById("transferQty").value = "";
    //    document.getElementById("transferQty").setAttribute("max", String(maxQty));

    //    const availableQtyLabel = document.getElementById("transferAvailableQty");
    //    if (availableQtyLabel) {
    //        availableQtyLabel.innerText = `${btn.dataset.qty || 0} ${btn.dataset.uom || ""}`;
    //    }

    //    const fromBranchLabel = document.getElementById("transferFromBranchLabel");
    //    if (fromBranchLabel) {
    //        fromBranchLabel.innerText = btn.dataset.warehouse || "";
    //    }

    //    loadBranchesDropdown();

    //    new bootstrap.Modal(document.getElementById("transferModal")).show();

    //    return;
    //}

    //// ADJUST
    //const adjustBtn = e.target.closest(".btn-adjust");
    //if (adjustBtn) {
    //    hideInventoryActionMenu(); 
    //    const currentQty = Number(adjustBtn.dataset.qty || 0);

    //    const today = new Date();
    //    const expDate = adjustBtn.dataset.exp ? new Date(adjustBtn.dataset.exp) : null;
    //    const isExpired = expDate && expDate < today;

    //    document.getElementById("adjustProduct").value = adjustBtn.dataset.product;
    //    document.getElementById("adjustLot").value = adjustBtn.dataset.lot;
    //    document.getElementById("adjustBranch").value = adjustBtn.dataset.branch;

    //    document.getElementById("adjustCurrentQty").innerText = currentQty;
    //    document.getElementById("adjustQty").value = "";
    //    document.getElementById("adjustQty").setAttribute("max", currentQty);

    //    const adjustTypeSelect = document.getElementById("adjustType");

    //    if (isExpired) {
    //        adjustTypeSelect.innerHTML = `
    //            <option value="DEDUCT">Deduct (Dispose)</option>
    //        `;
    //        document.getElementById("adjustRemarks").value = "EXPIRED DISPOSAL";
    //    }
    //    else if (currentQty <= 0) {
    //        adjustTypeSelect.innerHTML = `
    //            <option value="ADD">Add</option>
    //            <option value="SET">Set Exact Qty</option>
    //        `;
    //        document.getElementById("adjustRemarks").value = "";
    //    }
    //    else {
    //        adjustTypeSelect.innerHTML = `
    //            <option value="ADD">Add</option>
    //            <option value="DEDUCT">Deduct</option>
    //            <option value="SET">Set Exact Qty</option>
    //        `;
    //        document.getElementById("adjustRemarks").value = "";
    //    }

    //    new bootstrap.Modal(document.getElementById("adjustModal")).show();

    //    return;
    //}

    //// HISTORY
    //const historyBtn = e.target.closest(".btn-history");
    //if (historyBtn) {
    //    hideInventoryActionMenu(); 
    //    loadHistory(
    //        historyBtn.dataset.product,
    //        historyBtn.dataset.lot,
    //        historyBtn.dataset.branch
    //    );

    //    return;
    //}


    //edit lot number
    const editLotBtn = e.target.closest(".btn-edit-lot");
    if (editLotBtn) {
        document.getElementById("editLotProductId").value = editLotBtn.dataset.product || "";
        document.getElementById("editLotBranchId").value = editLotBtn.dataset.branch || "";
        document.getElementById("editLotOldNo").value = editLotBtn.dataset.lot || "";
        document.getElementById("editLotCurrentDisplay").value = editLotBtn.dataset.lot || "";
        document.getElementById("editLotNewNo").value = editLotBtn.dataset.lot || "";

        new bootstrap.Modal(document.getElementById("editLotModal")).show();
        return;
    }
});

document.addEventListener("DOMContentLoaded", function () {
    initInventoryHorizontalScroll();
    initInventoryDragScroll();
    loadWarehouseFilter();
    loadCategoryFilter();
    document.getElementById("prevBtn")?.addEventListener("click", prevPage);
    document.getElementById("nextBtn")?.addEventListener("click", nextPage);
    applyInventoryRoleUI();

    document.getElementById("sortByFilter")?.addEventListener("change", () => {
        currentPage = 1;
        loadInventory(1);
    });

    document.getElementById("pageSizeFilter")?.addEventListener("change", function () {
        pageSize = parseInt(this.value) || 30;
        currentPage = 1;
        loadInventory(1);
    });

    document.getElementById("lotNoFilter")?.addEventListener("input", function () {
        clearTimeout(lotSearchTimeout);
        lotSearchTimeout = setTimeout(() => {
            currentPage = 1;
            loadInventory(1);
        }, 500);
    });
    document.getElementById("categoryFilter")
        ?.addEventListener("change", () => {
            currentPage = 1;
            loadInventory(1);
        });
    ["productSearchFilter"].forEach(id => {
        document.getElementById(id)?.addEventListener("input", function () {
            clearTimeout(productSearchTimeout);
            productSearchTimeout = setTimeout(() => {
                currentPage = 1;
                loadInventory(1);
            }, 500);
        });
    });

    document.getElementById("warehouseFilter")?.addEventListener("change", () => {
        currentPage = 1;
        loadInventory(1);
    });

    document.getElementById("stockStatusFilter")?.addEventListener("change", () => {
        currentPage = 1;
        loadInventory(1);
    });

    document.getElementById("expiryStatusFilter")?.addEventListener("change", () => {
        currentPage = 1;
        loadInventory(1);
    });

    document.getElementById("monthsFilter")?.addEventListener("change", () => {
        currentPage = 1;
        loadInventory(1);
    });

    document.getElementById("orderFilter")?.addEventListener("change", () => {
        currentPage = 1;
        loadInventory(1);
    });

    document.getElementById("applyFilters")?.addEventListener("click", () => {
        currentPage = 1;
        loadInventory(1);
    });

    document.getElementById("clearFilters")?.addEventListener("click", function () {
        const ids = [
            "lotNoFilter",
            "productSearchFilter",
            "dateFromFilter",
            "dateToFilter",
            "warehouseFilter",
            "categoryFilter",
            "stockStatusFilter",
            "expiryStatusFilter",
            "monthsFilter",
            "sortByFilter",
            "orderFilter"
        ];

        ids.forEach(id => {
            const el = document.getElementById(id);
            if (!el) return;

            if (id === "expiryStatusFilter") {
                el.value = "available";
            }
            if (id === "sortByFilter") {
                el.value = "lot";
            }
            else if (id === "orderFilter") {
                el.value = "desc";
            }
            else {
                el.value = "";
            }
        });
        const orderEl = document.getElementById("orderFilter");
        if (orderEl) orderEl.value = "desc";

        const pageSizeEl = document.getElementById("pageSizeFilter");
        if (pageSizeEl) pageSizeEl.value = "30";

        pageSize = 30;
        currentPage = 1;
        loadInventory(1);
    });

  

    document.getElementById("btnConfirmTransfer")?.addEventListener("click", async function () {
        const fromBranch = document.getElementById("transferFromBranch").value;
        const toBranch = document.getElementById("transferBranch").value;
        const qty = parseFloat(document.getElementById("transferQty").value);
        const maxQty = parseFloat(document.getElementById("transferQty").getAttribute("max") || "0");

        if (!toBranch) {
            alert("Select destination branch");
            return;
        }

        if (fromBranch === toBranch) {
            alert("Cannot transfer to same branch");
            return;
        }

        if (!qty || qty <= 0) {
            alert("Invalid quantity");
            return;
        }

        if (qty > maxQty) {
            alert("Cannot transfer more than available stock");
            return;
        }

        const payload = {
            product_id: document.getElementById("transferProduct").value,
            lot_no: document.getElementById("transferLot").value,
            from_branch: fromBranch,
            to_branch: toBranch,
            quantity: qty
        };

        console.log("TRANSFER PAYLOAD:", payload);

        try {
            const res = await fetch("/Inventory/Transfer", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            const text = await res.text();
            console.log("TRANSFER RESPONSE STATUS:", res.status);
            console.log("TRANSFER RESPONSE BODY:", text);

            if (!res.ok) {
                throw new Error(text || "Transfer failed.");
            }

            const modalElement = document.getElementById("transferModal");
            const modalInstance = bootstrap.Modal.getInstance(modalElement);
            if (modalInstance) modalInstance.hide();

            isEditing = false;
            alert("Transfer success");
            loadInventory(currentPage);

        } catch (err) {
            console.error("TRANSFER ERROR:", err);
            alert(err.message);
        }
    });

    document.getElementById("transferModal")?.addEventListener("hidden.bs.modal", function () {
        isEditing = false;
    });


    document.getElementById("btnExportInventory")?.addEventListener("click", function () {
        const params = new URLSearchParams({
            lot_no: document.getElementById("lotNoFilter")?.value || "",
            search: document.getElementById("productSearchFilter")?.value || "",
            category: document.getElementById("categoryFilter")?.value || "",
            from: document.getElementById("dateFromFilter")?.value || "",
            to: document.getElementById("dateToFilter")?.value || "",
            warehouse: document.getElementById("warehouseFilter")?.value || "",
            stockStatus: document.getElementById("stockStatusFilter")?.value || "",
            expiryStatus: document.getElementById("expiryStatusFilter")?.value || "",
            months: document.getElementById("monthsFilter")?.value || "",
            order: document.getElementById("orderFilter")?.value || "desc"
        });

        window.location.href = `/Inventory/ExportExcel?${params.toString()}`;
    });

    document.getElementById("btnPrintInventory")?.addEventListener("click", function () {

        const params = new URLSearchParams({
            lot_no: document.getElementById("lotNoFilter")?.value || "",
            search: document.getElementById("productSearchFilter")?.value || "",
            warehouse: document.getElementById("warehouseFilter")?.value || "",
            category: document.getElementById("categoryFilter")?.value || "",
            stockStatus: document.getElementById("stockStatusFilter")?.value || "",
            expiryStatus: document.getElementById("expiryStatusFilter")?.value || "",
            months: document.getElementById("monthsFilter")?.value || "",
            from: document.getElementById("dateFromFilter")?.value || "",
            to: document.getElementById("dateToFilter")?.value || "",
            sortBy: document.getElementById("sortByFilter")?.value || "lot",
            order: document.getElementById("orderFilter")?.value || "desc"
        });

        window.open(`/Inventory/Print?${params.toString()}`, "_blank");
    });

    //document.getElementById("btnPrintInventorySummary")
    //    ?.addEventListener("click", function () {

    //        const params = new URLSearchParams({
    //            search:
    //                document.getElementById(
    //                    "productSearchFilter"
    //                )?.value || "",

    //            warehouse:
    //                document.getElementById(
    //                    "warehouseFilter"
    //                )?.value || "",

    //            category:
    //                document.getElementById(
    //                    "categoryFilter"
    //                )?.value || "",

    //            stockStatus:
    //                document.getElementById(
    //                    "stockStatusFilter"
    //                )?.value || "",

    //            order:
    //                document.getElementById(
    //                    "orderFilter"
    //                )?.value || "asc"
    //        });

    //        window.open(
    //            `/Inventory/PrintSummary?${params.toString()}`,
    //            "_blank"
    //        );
    //    });


    document.getElementById("btnPrintInventorySummary")
        ?.addEventListener("click", async function () {

            await loadPrintCategoryCheckboxes();

            const warehouseSelect =
                document.getElementById("warehouseFilter");

            const warehouseName =
                warehouseSelect?.selectedOptions?.[0]?.text
                || "All Warehouses";

            document.getElementById("printWarehouseDisplay").innerText =
                warehouseName;

            const modalElement =
                document.getElementById("inventoryPrintModal");

            new bootstrap.Modal(modalElement).show();
        });

    document.getElementById("btnSaveLotNo")?.addEventListener("click", saveLotNoEdit);
    document.getElementById("btnSaveDates")?.addEventListener("click", saveLotDates);



    document.getElementById("printSelectAllCategories")
        ?.addEventListener("change", function () {

            const shouldCheckAll = this.checked;

            document.querySelectorAll(".print-category-checkbox")
                .forEach(checkbox => {
                    checkbox.checked = shouldCheckAll;
                });

            this.indeterminate = false;

            updateSelectedCategoryCount();
        });

    document.getElementById("btnConfirmInventoryPrint")
        ?.addEventListener("click", function () {

            const selectedCategories = Array.from(
                document.querySelectorAll(
                    ".print-category-checkbox:checked"
                )
            ).map(checkbox =>
                checkbox.dataset.category || ""
            ).filter(category =>
                category.trim() !== ""
            );

            if (selectedCategories.length === 0) {
                alert("Please select at least one category.");
                return;
            }

            const params = new URLSearchParams();

            params.set(
                "search",
                document.getElementById("productSearchFilter")?.value || ""
            );

            params.set(
                "warehouse",
                document.getElementById("warehouseFilter")?.value || ""
            );

            params.set(
                "categories",
                selectedCategories.join("|")
            );

            params.set(
                "stockStatus",
                document.getElementById("stockStatusFilter")?.value || ""
            );

            params.set(
                "order",
                document.getElementById("orderFilter")?.value || "asc"
            );

            console.log(
                "Selected print categories:",
                selectedCategories
            );

            console.log(
                "Print URL:",
                `/Inventory/PrintSummary?${params.toString()}`
            );

            window.open(
                `/Inventory/PrintSummary?${params.toString()}`,
                "_blank"
            );
        });

    const expiryStatusEl = document.getElementById("expiryStatusFilter");
    if (expiryStatusEl && !expiryStatusEl.value) {
        expiryStatusEl.value = "available";
    }

    loadInventory(1);

    setInterval(() => {
        if (!isEditing) {
            loadInventory(currentPage);
        }
    }, 5000);
});



async function loadPrintCategoryCheckboxes() {
    const container = document.getElementById("printCategoryList");
    const selectAll = document.getElementById("printSelectAllCategories");

    if (!container || !selectAll) return;

    container.innerHTML = `
        <div class="text-center text-muted py-4">
            Loading categories...
        </div>
    `;

    selectAll.checked = false;
    selectAll.indeterminate = false;

    try {
        const response = await fetch("/Inventory/GetInventoryCategories");

        if (!response.ok) {
            throw new Error("Failed to load categories.");
        }

        const categories = await response.json();

        if (!Array.isArray(categories) || categories.length === 0) {
            container.innerHTML = `
                <div class="text-center text-muted py-4">
                    No categories found.
                </div>
            `;

            updateSelectedCategoryCount();
            return;
        }

        container.innerHTML = categories.map((category, index) => `
            <div class="form-check border-bottom py-2">
                <input
                    class="form-check-input print-category-checkbox"
                    type="checkbox"
                    id="printCategory_${index}"
                    data-category="${escapeHtml(category)}">

                <label
                    class="form-check-label w-100"
                    for="printCategory_${index}">
                    ${escapeHtml(category)}
                </label>
            </div>
        `).join("");

        document.querySelectorAll(".print-category-checkbox")
            .forEach(checkbox => {
                checkbox.addEventListener("change", function () {
                    updatePrintSelectAllState();
                    updateSelectedCategoryCount();
                });
            });

        // Initially select everything.
        document.querySelectorAll(".print-category-checkbox")
            .forEach(checkbox => {
                checkbox.checked = true;
            });

        updatePrintSelectAllState();
        updateSelectedCategoryCount();

    } catch (error) {
        container.innerHTML = `
            <div class="alert alert-danger mb-0">
                ${escapeHtml(error.message)}
            </div>
        `;

        selectAll.checked = false;
        selectAll.indeterminate = false;

        updateSelectedCategoryCount();
    }
}

function updatePrintSelectAllState() {
    const selectAll =
        document.getElementById("printSelectAllCategories");

    const checkboxes = Array.from(
        document.querySelectorAll(".print-category-checkbox")
    );

    if (!selectAll) return;

    if (checkboxes.length === 0) {
        selectAll.checked = false;
        selectAll.indeterminate = false;
        return;
    }

    const checkedCount =
        checkboxes.filter(checkbox => checkbox.checked).length;

    selectAll.checked =
        checkedCount === checkboxes.length;

    selectAll.indeterminate =
        checkedCount > 0 &&
        checkedCount < checkboxes.length;
}
function syncPrintSelectAll() {
    const selectAll =
        document.getElementById("printSelectAllCategories");

    const checkboxes = Array.from(
        document.querySelectorAll(".print-category-checkbox")
    );

    if (!selectAll || checkboxes.length === 0) return;

    const checkedCount =
        checkboxes.filter(x => x.checked).length;

    selectAll.checked =
        checkedCount === checkboxes.length;

    selectAll.indeterminate =
        checkedCount > 0 &&
        checkedCount < checkboxes.length;
}

function updateSelectedCategoryCount() {
    const checkedCount =
        document.querySelectorAll(
            ".print-category-checkbox:checked"
        ).length;

    const counter =
        document.getElementById("selectedCategoryCount");

    if (counter) {
        counter.innerText =
            `${checkedCount} selected`;
    }
}

function escapeHtml(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

//edit lot number

async function saveLotNoEdit() {
    const payload = {
        product_id: document.getElementById("editLotProductId").value,
        branch_id: document.getElementById("editLotBranchId").value,
        old_lot_no: document.getElementById("editLotOldNo").value,
        new_lot_no: document.getElementById("editLotNewNo").value.trim(),
        requested_by_role: window.currentUserRole || ""
    };

    if (!payload.new_lot_no) {
        alert("New lot number is required.");
        return;
    }

    try {
        const res = await fetch("/Inventory/RenameLot", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        const text = await res.text();

        if (!res.ok) {
            throw new Error(text || "Failed to update lot number.");
        }

        bootstrap.Modal.getInstance(document.getElementById("editLotModal"))?.hide();

        alert("Lot number updated successfully.");
        loadInventory(currentPage);

    } catch (err) {
        alert(err.message);
    }
}

async function saveAdjust() {
    const quantity = parseFloat(document.getElementById("adjustQty").value || "0");
    const remarks = document.getElementById("adjustRemarks").value.trim();
    const type = document.getElementById("adjustType").value;

    const currentQty = parseFloat(document.getElementById("adjustCurrentQty").innerText || "0");

    if (!quantity || quantity <= 0) {
        alert("Quantity must be greater than 0.");
        return;
    }

    if (!remarks) {
        alert("Remarks is required.");
        return;
    }

    if (type === "DEDUCT" && quantity > currentQty) {
        alert("Cannot deduct more than current stock.");
        return;
    }

    const body = {
        product_id: document.getElementById("adjustProduct").value,
        lot_no: document.getElementById("adjustLot").value,
        branch_id: document.getElementById("adjustBranch").value,
        adjustment_type: type,
        quantity: quantity,
        adjusted_by: window.currentUserId || "UNKNOWN",
        remarks: remarks
    };

    try {
        const res = await fetch("/Inventory/Adjust", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
        });

        const result = await res.json();

        if (!res.ok) throw new Error(result.message);

        alert(result.message || "Adjusted successfully");

        bootstrap.Modal.getInstance(document.getElementById("adjustModal")).hide();

        document.getElementById("adjustQty").value = "";
        document.getElementById("adjustRemarks").value = "";

        loadInventory(currentPage);

    } catch (err) {
        alert(err.message);
    }
}
async function loadWarehouseFilter() {
    try {
        const res = await fetch("/Inventory/GetBranches");

        if (!res.ok) {
            throw new Error("Failed to load warehouse list.");
        }

        const data = await res.json();
        const select = document.getElementById("warehouseFilter");

        if (!select) return;

        select.innerHTML = `<option value="">All Warehouses</option>`;

        data.forEach(b => {
            const branchId = b.branch_id ?? "";
            const branchName = b.branch_name ?? branchId;

            select.innerHTML += `
                <option value="${branchId}">
                    ${branchName}
                </option>
            `;
        });

    } catch (err) {
        console.error("Failed to load warehouse filter", err);
    }
}

function initInventoryHorizontalScroll() {

    const topScroll =
        document.querySelector(".table-scroll-top");

    const bottomScroll = getInventoryScrollBox();

    if (!topScroll || !bottomScroll) return;

    let syncing = false;

    topScroll.addEventListener("scroll", function () {

        if (syncing) return;

        syncing = true;
        bottomScroll.scrollLeft = topScroll.scrollLeft;
        syncing = false;
    });

    bottomScroll.addEventListener("scroll", function () {

        if (syncing) return;

        syncing = true;
        topScroll.scrollLeft = bottomScroll.scrollLeft;
        syncing = false;
    });

    syncInventoryTopScrollbar();
}

function syncInventoryTopScrollbar() {

    const topScroll =
        document.querySelector(".table-scroll-top");

    const bottomScroll = getInventoryScrollBox();

    const table =
        document.querySelector(".inventory-table");

    if (!topScroll || !bottomScroll || !table) return;

    topScroll.firstElementChild.style.width =
        table.scrollWidth + "px";
}

async function loadHistory(
    productId, lotNo, branchId,
    productName, description, warehouse,
    onHandQty, reservedQty, availableQty
) {
    try {
        const res = await fetch(`/Inventory/GetHistory?product_id=${encodeURIComponent(productId)}&lot_no=${encodeURIComponent(lotNo)}&branch_id=${encodeURIComponent(branchId)}`);
        const data = await res.json();

        const table = document.getElementById("historyTable");
        const info = document.getElementById("historyProductInfo");

        table.innerHTML = "";

        info.innerHTML = `
            <div class="row">
                <div class="col-md-6">
                    <div><b>Product:</b> ${productName || "-"}</div>
                    <div><b>Description:</b> ${description || "-"}</div>
                </div>
                <div class="col-md-6">
                    <div><b>Warehouse:</b> ${warehouse || "-"}</div>
                    <div><b>Lot No:</b> ${lotNo || "-"}</div>
                </div>
            </div>
        `;

        if (!Array.isArray(data) || data.length === 0) {
            table.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center text-muted">No history found.</td>
                </tr>`;
        } else {
            data.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

            data.forEach((x, index) => {
                const type = String(x.transaction_type || "").toUpperCase();

                table.innerHTML += `
<tr>
    <td class="text-center">${index + 1}</td>
    <td>${formatPHDateTime(x.created_at)}</td>
    <td>
        <span class="badge rounded-pill ${type === "OUT" ? "bg-danger" : "bg-success"}">
            ${type}
        </span>
    </td>
    <td>
        <div class="fw-semibold">${toDisplayNumber(x.quantity)} ${x.uom ?? ""}</div>
        <div class="text-muted small">${formatPack(x.quantity, x.pack_qty, x.pack_uom, x.uom)}</div>
    </td>
    <td>${x.reference ?? "-"}</td>
    <td>${x.warehouse ?? ""}</td>
    <td>${x.remarks ?? ""}</td>
    <td>${x.scanned_by ?? ""}</td>
</tr>`;
            });
        }

        const uom = document.querySelector(".btn-inventory-actions[data-lot='" + lotNo + "']")?.dataset.uom || "";

        table.innerHTML += `
<tr>
    <td colspan="8">
        <div class="d-flex justify-content-end mt-3">
            <div class="border rounded p-3 bg-light" style="min-width:260px;">
                <div class="fw-bold mb-2">Inventory Summary</div>
                <div class="d-flex justify-content-between">
                    <span>On Hand</span>
                    <b>${toDisplayNumber(onHandQty)} ${uom}</b>
                </div>
                <div class="d-flex justify-content-between text-warning">
                    <span>Reserved</span>
                    <b>${toDisplayNumber(reservedQty)} ${uom}</b>
                </div>
                <div class="d-flex justify-content-between text-success">
                    <span>Available</span>
                    <b>${toDisplayNumber(availableQty)} ${uom}</b>
                </div>
            </div>
        </div>
    </td>
</tr>`;

        new bootstrap.Modal(document.getElementById("historyModal")).show();
        hideInventoryActionMenu();

    } catch (err) {
        console.error("LOAD HISTORY ERROR:", err);
        alert(err.message);
    }
}

function formatPHDateTime(created_at) {
    if (!created_at) return "-";

    const utcString = String(created_at).replace(" ", "T") + "Z";
    const date = new Date(utcString);

    return date.toLocaleString("en-US", {
        timeZone: "Asia/Manila",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "numeric",
        minute: "2-digit",
        second: "2-digit",
        hour12: true
    });
}




function getInventoryScrollBox() {
    return document.querySelector(".inventory-table-wrapper")
        || document.querySelector(".table-scroll-box")
        || document.querySelector(".table-responsive");
}

function initInventoryDragScroll() {
    const scrollBox = getInventoryScrollBox();
    if (!scrollBox) return;

    let isDown = false;
    let startX = 0;
    let scrollLeft = 0;

    scrollBox.addEventListener("mousedown", function (e) {
        if (e.target.closest("button, input, select, textarea, a, .btn-view-stock")) return;

        isDown = true;
        scrollBox.classList.add("dragging");
        startX = e.pageX - scrollBox.getBoundingClientRect().left;
        scrollLeft = scrollBox.scrollLeft;
    });

    document.addEventListener("mouseup", function () {
        isDown = false;
        scrollBox.classList.remove("dragging");
    });

    document.addEventListener("mousemove", function (e) {
        if (!isDown) return;

        e.preventDefault();

        const x = e.pageX - scrollBox.getBoundingClientRect().left;
        const walk = (x - startX) * 1.3;

        scrollBox.scrollLeft = scrollLeft - walk;

        const topScroll = document.querySelector(".table-scroll-top");
        if (topScroll) topScroll.scrollLeft = scrollBox.scrollLeft;
    });
}

function openTransfer(btn) {
    hideInventoryActionMenu();
    isEditing = true;

    const maxQty = parseFloat(btn.dataset.qty) || 0;

    document.getElementById("transferProduct").value = btn.dataset.product || "";
    document.getElementById("transferLot").value = btn.dataset.lot || "";
    document.getElementById("transferFromBranch").value = btn.dataset.branch || "";

    document.getElementById("transferQty").value = "";
    document.getElementById("transferQty").setAttribute("max", String(maxQty));

    document.getElementById("transferAvailableQty").innerText =
        `${btn.dataset.qty || 0} ${btn.dataset.uom || ""}`;

    document.getElementById("transferFromBranchLabel").innerText =
        btn.dataset.warehouse || "";

    loadBranchesDropdown();

    new bootstrap.Modal(document.getElementById("transferModal")).show();
}

function openAdjust(btn) {
    hideInventoryActionMenu();

    const currentQty = Number(btn.dataset.qty || 0);

    const today = new Date();
    const expDate = btn.dataset.exp ? new Date(btn.dataset.exp) : null;
    const isExpired = expDate && expDate < today;

    document.getElementById("adjustProduct").value = btn.dataset.product || "";
    document.getElementById("adjustLot").value = btn.dataset.lot || "";
    document.getElementById("adjustBranch").value = btn.dataset.branch || "";

    document.getElementById("adjustCurrentQty").innerText = currentQty;
    document.getElementById("adjustQty").value = "";
    document.getElementById("adjustQty").setAttribute("max", currentQty);

    const adjustTypeSelect = document.getElementById("adjustType");

    if (isExpired) {
        adjustTypeSelect.innerHTML = `<option value="DEDUCT">Deduct (Dispose)</option>`;
        document.getElementById("adjustRemarks").value = "EXPIRED DISPOSAL";
    } else if (currentQty <= 0) {
        adjustTypeSelect.innerHTML = `
            <option value="ADD">Add</option>
            <option value="SET">Set Exact Qty</option>
        `;
        document.getElementById("adjustRemarks").value = "";
    } else {
        adjustTypeSelect.innerHTML = `
            <option value="ADD">Add</option>
            <option value="DEDUCT">Deduct</option>
            <option value="SET">Set Exact Qty</option>
        `;
        document.getElementById("adjustRemarks").value = "";
    }

    new bootstrap.Modal(document.getElementById("adjustModal")).show();
}

function openHistory(btn) {
    hideInventoryActionMenu();

    loadHistory(
        btn.dataset.product,
        btn.dataset.lot,
        btn.dataset.branch,
        btn.dataset.description,
        btn.dataset.productDescription,
        btn.dataset.warehouse,
        btn.dataset.onhand,
        btn.dataset.reserved,
        btn.dataset.available
    );
}

let activeInventoryActionBtn = null;

document.addEventListener("click", function (e) {
    const actionBtn = e.target.closest(".btn-inventory-actions");
    const menu = document.getElementById("inventoryActionMenu");

    if (actionBtn) {
        activeInventoryActionBtn = actionBtn;

        if (!menu) {
            console.error("inventoryActionMenu not found");
            return;
        }

        const rect = actionBtn.getBoundingClientRect();

        menu.classList.remove("d-none");

        const menuHeight = menu.offsetHeight || 150;
        const menuWidth = menu.offsetWidth || 180;

        let top = rect.bottom + 6;
        let left = rect.right - menuWidth;

        // if menu will go below screen, open upward
        if (top + menuHeight > window.innerHeight) {
            top = rect.top - menuHeight - 6;
        }

        // keep inside screen
        if (left < 8) left = 8;
        if (left + menuWidth > window.innerWidth) {
            left = window.innerWidth - menuWidth - 8;
        }

        menu.style.top = `${top}px`;
        menu.style.left = `${left}px`;

        return;
    }

    if (!e.target.closest("#inventoryActionMenu")) {
        menu?.classList.add("d-none");
    }
});
//document.addEventListener("contextmenu", function (e) {
//    const row = e.target.closest(".inventory-row");
//    const menu = document.getElementById("inventoryActionMenu");

//    if (!row || !menu) return;

//    e.preventDefault();

//    activeInventoryActionBtn = row;

//    menu.style.top = `${e.clientY}px`;
//    menu.style.left = `${e.clientX}px`;
//    menu.classList.remove("d-none");
//});

function hideInventoryActionMenu() {
    document.getElementById("inventoryActionMenu")?.classList.add("d-none");
}

document.getElementById("menuTransfer")?.addEventListener("click", function (e) {
    e.stopPropagation();
    if (!activeInventoryActionBtn) return;
    openTransfer(activeInventoryActionBtn);
});

document.getElementById("menuAdjust")?.addEventListener("click", function (e) {
    e.stopPropagation();
    if (!activeInventoryActionBtn) return;
    openAdjust(activeInventoryActionBtn);
});

document.getElementById("menuHistory")?.addEventListener("click", function (e) {
    e.stopPropagation();
    if (!activeInventoryActionBtn) return;
    openHistory(activeInventoryActionBtn);
});

document.getElementById("menuStockOut")?.addEventListener("click", function () {
    if (!activeInventoryActionBtn) return;

    hideInventoryActionMenu();

    const availableQty = Number(activeInventoryActionBtn.dataset.qty || 0);

    document.getElementById("stockOutProduct").value = activeInventoryActionBtn.dataset.product || "";
    document.getElementById("stockOutLot").value = activeInventoryActionBtn.dataset.lot || "";
    document.getElementById("stockOutBranch").value = activeInventoryActionBtn.dataset.branch || "";

    document.getElementById("stockOutAvailableQty").innerText =
        `${availableQty} ${activeInventoryActionBtn.dataset.uom || ""}`;

    document.getElementById("stockOutQty").value = "";
    document.getElementById("stockOutQty").setAttribute("max", availableQty);

    document.getElementById("stockOutDrNo").value = "";
    document.getElementById("stockOutInvNo").value = "";
    document.getElementById("stockOutPoNo").value = "";
    document.getElementById("stockOutRemarks").value = "";

    new bootstrap.Modal(document.getElementById("stockOutModal")).show();
});

document.getElementById("btnSaveStockOut")?.addEventListener("click", saveManualStockOut);

async function saveManualStockOut() {
    const qty = Number(document.getElementById("stockOutQty").value || 0);
    const maxQty = Number(document.getElementById("stockOutQty").getAttribute("max") || 0);

    const drNo = document.getElementById("stockOutDrNo").value.trim();
    const invNo = document.getElementById("stockOutInvNo").value.trim();
    const poNo = document.getElementById("stockOutPoNo").value.trim();
    const remarks = document.getElementById("stockOutRemarks").value.trim();

    if (!qty || qty <= 0) {
        alert("Quantity out must be greater than 0.");
        return;
    }

    if (qty > maxQty) {
        alert("Cannot stock out more than available quantity.");
        return;
    }

    if (!drNo && !invNo && !poNo) {
        alert("Please enter at least one reference: DR, INV, or PO.");
        return;
    }

    const refParts = [];
    if (drNo) refParts.push(`DR: ${drNo}`);
    if (invNo) refParts.push(`INV: ${invNo}`);
    if (poNo) refParts.push(`PO: ${poNo}`);

    const body = {
        product_id: document.getElementById("stockOutProduct").value,
        lot_no: document.getElementById("stockOutLot").value,
        branch_id: document.getElementById("stockOutBranch").value,
        adjustment_type: "DEDUCT",
        quantity: qty,
        adjusted_by: window.currentUserId || "UNKNOWN",

        reference_type: "MANUAL_STOCK_OUT",
        dr_no: drNo,
        inv_no: invNo,
        po_no: poNo,

        remarks: remarks || "Manual stock out"
    };

    try {
        const res = await fetch("/Inventory/Adjust", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
        });

        const result = await res.json();

        if (!res.ok) {
            throw new Error(result.message || "Stock out failed.");
        }

        bootstrap.Modal.getInstance(document.getElementById("stockOutModal"))?.hide();

        alert("Stock out saved successfully.");
        loadInventory(currentPage);

    } catch (err) {
        alert(err.message);
    }
}

async function openProductLotsModal(productId, genericName, brandName) {
    const params = new URLSearchParams({
        page: 1,
        pageSize: 100000,
        genericName: genericName,
        brandName: brandName,
        stockStatus: "",
        expiryStatus: "",
        months: "",
        order: "desc"
    });

    const res = await fetch(`/Inventory/GetInventory?${params.toString()}`);
    const json = await res.json();
    const items = (json.data || []).filter(x =>
        String(x.product_id) === String(productId) &&
        Number(x.available_qty || 0) > 0
    );
    renderProductLocationSummary(items);

    document.getElementById("productLotsSubTitle").innerText =
        `${genericName}${brandName ? " / " + brandName : ""}`;

    const table = document.getElementById("productLotsTable");

    if (!items.length) {
        table.innerHTML = `
            <tr>
                <td colspan="7" class="text-center text-muted">
                    No lots found.
                </td>
            </tr>`;
    } else {
        table.innerHTML = items.map(x => {
            const onHandQty = Number(x.qty ?? 0);
            const reservedQty = Number(x.reserved_qty ?? 0);
            const availableQty = Number(x.available_qty ?? (onHandQty - reservedQty));

            return `
                <tr>
                    <td>${x.lot_no ?? ""}</td>
        <td>${x.category_name ?? "-"}</td>
        <td>${x.warehouse ?? ""}</td>
                    <td>
                        <div class="fw-semibold">${availableQty} ${x.uom ?? ""}</div>
                        <div class="text-muted small">OH:${onHandQty} | Res:${reservedQty}</div>
                    </td>
                    <td>${formatPack(availableQty, x.pack_qty, x.pack_uom, x.uom)}</td>
                    <td>${formatMonthYear(x.manufacturing_date)} - ${formatMonthYear(x.expiration_date)}</td>
                    <td>${getRemainingMonthsDisplay(x.expiration_date)}</td>
                    <td>${getStatusBadge(availableQty, reservedQty, x.stock_level)}</td>
                </tr>`;
        }).join("");
    }

    new bootstrap.Modal(document.getElementById("productLotsModal")).show();
}
function renderProductLocationSummary(items) {
    const container = document.getElementById("productLotsLocationSummary");
    if (!container) return;

    const today = new Date();

    const grouped = {};

    items.forEach(x => {
        const location =
            x.location_name ||
            x.warehouse_location ||
            x.warehouse ||
            "No Location";

        const onHandQty = Number(x.qty || 0);
        const reservedQty = Number(x.reserved_qty || 0);
        const availableQty = Number(x.available_qty ?? (onHandQty - reservedQty));

        const expDate = x.expiration_date ? new Date(x.expiration_date) : null;
        const isExpired = expDate && expDate < today;

        if (!grouped[location]) {
            grouped[location] = {
                total: 0,
                available: 0,
                expired: 0
            };
        }

        grouped[location].total += onHandQty;
        grouped[location].available += availableQty;

        if (isExpired) {
            grouped[location].expired += onHandQty;
        }
    });

    const rows = Object.entries(grouped);

    if (!rows.length) {
        container.innerHTML = "";
        return;
    }

    container.innerHTML = `
    <table class="table table-sm table-bordered summary-table">
        <thead class="table-light">
            <tr>
                <th>Warehouse</th>
                <th class="text-end">Total</th>
                <th class="text-end">Available</th>
                <th class="text-end">Expired</th>
            </tr>
        </thead>
        <tbody>
            ${rows.map(([location, s]) => `
                <tr>
                    <td>${location}</td>
                    <td class="text-end">${toDisplayNumber(s.total)}</td>
                    <td class="text-end text-success fw-bold">${toDisplayNumber(s.available)}</td>
                    <td class="text-end text-danger fw-bold">${toDisplayNumber(s.expired)}</td>
                </tr>
            `).join("")}
        </tbody>
    </table>
`;
}
function monthToDate(value, isExpiration) {
    if (!value) return null; // value format: YYYY-MM

    const [year, month] = value.split("-").map(Number);

    if (isExpiration) {
        // last day of selected month
        const lastDay = new Date(year, month, 0).getDate();
        return `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
    }

    // first day of selected month
    return `${year}-${String(month).padStart(2, "0")}-01`;
}

async function saveLotDates() {
    const payload = {
        product_id: document.getElementById("editDateProductId").value,
        branch_id: document.getElementById("editDateBranchId").value,
        lot_no: document.getElementById("editDateLotNo").value,
        manufacturing_date: monthToDate(document.getElementById("editMfgDate").value, false),
        expiration_date: monthToDate(document.getElementById("editExpDate").value, true)
    };

    if (!payload.manufacturing_date || !payload.expiration_date) {
        alert("Manufacturing Date and Expiration Date are required.");
        return;
    }

    const res = await fetch("/Inventory/UpdateLotDates", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    });

    const text = await res.text();

    if (!res.ok) {
        alert(text || "Failed to update dates.");
        return;
    }

    bootstrap.Modal.getInstance(document.getElementById("editDateModal"))?.hide();

    alert("Dates updated successfully.");
    loadInventory(currentPage);
}