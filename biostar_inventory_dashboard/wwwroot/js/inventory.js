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

function getStatusBadge(availableQty, reservedQty = 0) {

    const qty = Number(availableQty || 0);
    const reserved = Number(reservedQty || 0);

    // Fully Reserved
    if (qty <= 0 && reserved > 0) {
        return `
            <span class="badge bg-warning text-dark">
                Fully Reserved
            </span>
        `;
    }

    // Out of Stock
    if (qty <= 0) {
        return `
            <span class="badge bg-danger">
                Out of Stock
            </span>
        `;
    }

    // Low Stock
    if (qty <= 10) {
        return `
            <span class="badge bg-warning text-dark">
                Low Stock
            </span>
        `;
    }

    // Normal
    if (qty <= 500) {
        return `
            <span class="badge bg-success">
                Normal
            </span>
        `;
    }

    // Over Stock
    return `
        <span class="badge bg-primary">
            Over Stock
        </span>
    `;
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
            product: document.getElementById("productFilter")?.value || "",
            from: document.getElementById("dateFromFilter")?.value || "",
            to: document.getElementById("dateToFilter")?.value || "",
            warehouse: document.getElementById("warehouseFilter")?.value || "",
            category: document.getElementById("categoryFilter")?.value || "",
            stockStatus: document.getElementById("stockStatusFilter")?.value || "",
            expiryStatus: "",
            months: document.getElementById("monthsFilter")?.value || "",
            order: document.getElementById("orderFilter")?.value || "desc"
        });

        const response = await fetch(`/Inventory/GetInventory?${params.toString()}`);

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(errText);
        }

        const json = await response.json();
        let items = json.data || [];
        loadCategoryFilter(items);

       

        // 🔥 ADD THIS BLOCK
        const expiryFilter = document.getElementById("expiryStatusFilter")?.value;

        if (expiryFilter && expiryFilter !== "All") {
            items = items.filter(item => {
                const status = getExpiryStatus(item.expiration_date);
                if (expiryFilter === "expired") return status === "EXPIRED";
                if (expiryFilter === "near") return status === "EXPIRING_SOON";
                if (expiryFilter === "safe") return status === "VALID";
                if (expiryFilter === "available") {
                    return status !== "EXPIRED" && Number(item.qty) > 0;
                }

                return true;
            });
        }
        totalRecords = items.length;

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
        <tr>
            
            <td>${item.description ?? ""}</td>
            <td>${item.category_name ?? "-"}</td>
            <td>
  <div class="qty-available-wrap btn-view-stock"
     data-product="${item.product_id ?? ""}"
     data-description="${item.description ?? ""}"

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
           
          <td>${getStatusBadge(availableQty, reservedQty)}</td>
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
            <td>${formatMonthYear(item.manufacturing_date)} - ${formatMonthYear(item.expiration_date)}</td>
            <td>${getRemainingMonthsDisplay(item.expiration_date)}</td>
            <td>${item.warehouse ?? ""}</td>
            ${canShowInventoryAction() ? `
<td class="text-center action-col">
    <button
        class="btn btn-sm btn-outline-primary btn-transfer"
        data-product="${item.product_id ?? ""}"
        data-lot="${item.lot_no ?? ""}"
       data-qty="${availableQty}"
        data-branch="${item.branch_id ?? ""}"
        data-warehouse="${item.warehouse ?? ""}"
        data-uom="${item.uom ?? ""}"
        ${disableTransfer}>
        Transfer
    </button>

    <button
        class="btn btn-sm btn-outline-warning btn-adjust"
        data-product="${item.product_id ?? ""}"
        data-lot="${item.lot_no ?? ""}"
        data-branch="${item.branch_id ?? ""}"
       data-qty="${availableQty}"
        data-exp="${item.expiration_date ?? ""}"
        ${disableAdjust}
        title="${adjustTitle}">
        Adjust
    </button>

    <button
        class="btn btn-sm btn-outline-secondary btn-history"
        data-product="${item.product_id ?? ""}"
        data-lot="${item.lot_no ?? ""}"
        data-branch="${item.branch_id ?? ""}">
        History
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


function loadCategoryFilter(items) {

    const select = document.getElementById("categoryFilter");
    if (!select) return;

    const existing = new Set();

    items.forEach(x => {
        if (x.category_name) {
            existing.add(x.category_name);
        }
    });

    const currentValue = select.value;

    select.innerHTML =
        `<option value="">All Categories</option>`;

    [...existing]
        .sort()
        .forEach(cat => {

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

    // VIEW RESERVED DETAILS
    const viewStockBtn = e.target.closest(".btn-view-stock");
    if (viewStockBtn) {

        const product = viewStockBtn.dataset.description || "";
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

        document.getElementById("reservedModalSubTitle").innerText =
            `${product} | Lot: ${lot} | ${warehouse}`;

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

    // TRANSFER
    const btn = e.target.closest(".btn-transfer");
    if (btn) {

        isEditing = true;

        const maxQty = parseFloat(btn.dataset.qty) || 0;

        document.getElementById("transferProduct").value = btn.dataset.product || "";
        document.getElementById("transferLot").value = btn.dataset.lot || "";
        document.getElementById("transferFromBranch").value = btn.dataset.branch || "";
        document.getElementById("transferQty").value = "";
        document.getElementById("transferQty").setAttribute("max", String(maxQty));

        const availableQtyLabel = document.getElementById("transferAvailableQty");
        if (availableQtyLabel) {
            availableQtyLabel.innerText = `${btn.dataset.qty || 0} ${btn.dataset.uom || ""}`;
        }

        const fromBranchLabel = document.getElementById("transferFromBranchLabel");
        if (fromBranchLabel) {
            fromBranchLabel.innerText = btn.dataset.warehouse || "";
        }

        loadBranchesDropdown();

        new bootstrap.Modal(document.getElementById("transferModal")).show();

        return;
    }

    // ADJUST
    const adjustBtn = e.target.closest(".btn-adjust");
    if (adjustBtn) {

        const currentQty = Number(adjustBtn.dataset.qty || 0);

        const today = new Date();
        const expDate = adjustBtn.dataset.exp ? new Date(adjustBtn.dataset.exp) : null;
        const isExpired = expDate && expDate < today;

        document.getElementById("adjustProduct").value = adjustBtn.dataset.product;
        document.getElementById("adjustLot").value = adjustBtn.dataset.lot;
        document.getElementById("adjustBranch").value = adjustBtn.dataset.branch;

        document.getElementById("adjustCurrentQty").innerText = currentQty;
        document.getElementById("adjustQty").value = "";
        document.getElementById("adjustQty").setAttribute("max", currentQty);

        const adjustTypeSelect = document.getElementById("adjustType");

        if (isExpired) {
            adjustTypeSelect.innerHTML = `
                <option value="DEDUCT">Deduct (Dispose)</option>
            `;
            document.getElementById("adjustRemarks").value = "EXPIRED DISPOSAL";
        }
        else if (currentQty <= 0) {
            adjustTypeSelect.innerHTML = `
                <option value="ADD">Add</option>
                <option value="SET">Set Exact Qty</option>
            `;
            document.getElementById("adjustRemarks").value = "";
        }
        else {
            adjustTypeSelect.innerHTML = `
                <option value="ADD">Add</option>
                <option value="DEDUCT">Deduct</option>
                <option value="SET">Set Exact Qty</option>
            `;
            document.getElementById("adjustRemarks").value = "";
        }

        new bootstrap.Modal(document.getElementById("adjustModal")).show();

        return;
    }

    // HISTORY
    const historyBtn = e.target.closest(".btn-history");
    if (historyBtn) {

        loadHistory(
            historyBtn.dataset.product,
            historyBtn.dataset.lot,
            historyBtn.dataset.branch
        );

        return;
    }


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
    loadWarehouseFilter();
    document.getElementById("prevBtn")?.addEventListener("click", prevPage);
    document.getElementById("nextBtn")?.addEventListener("click", nextPage);
    applyInventoryRoleUI();

  

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
    document.getElementById("productFilter")?.addEventListener("input", function () {
        clearTimeout(productSearchTimeout);
        productSearchTimeout = setTimeout(() => {
            currentPage = 1;
            loadInventory(1);
        }, 500);
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
            "productFilter",
            "dateFromFilter",
            "dateToFilter",
            "warehouseFilter",
            "categoryFilter",
            "stockStatusFilter",
            "expiryStatusFilter",
            "monthsFilter",
            "orderFilter"
        ];

        ids.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = "";
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
            product: document.getElementById("productFilter")?.value || "",
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


    document.getElementById("btnSaveLotNo")?.addEventListener("click", saveLotNoEdit);





    const stockStatusEl = document.getElementById("stockStatusFilter");
    if (stockStatusEl && !stockStatusEl.value) {
        stockStatusEl.value = "available";
    }

    loadInventory(1);

    setInterval(() => {
        if (!isEditing) {
            loadInventory(currentPage);
        }
    }, 5000);
});


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

    const bottomScroll =
        document.querySelector(".table-scroll-box");

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

    const bottomScroll =
        document.querySelector(".table-scroll-box");

    const table =
        document.querySelector(".inventory-table");

    if (!topScroll || !bottomScroll || !table) return;

    topScroll.firstElementChild.style.width =
        table.scrollWidth + "px";
}

async function loadHistory(productId, lotNo, branchId) {
    try {
        const res = await fetch(`/Inventory/GetHistory?product_id=${encodeURIComponent(productId)}&lot_no=${encodeURIComponent(lotNo)}&branch_id=${encodeURIComponent(branchId)}`);

        const text = await res.text();
        console.log("HISTORY STATUS:", res.status);
        console.log("HISTORY BODY:", text);

        if (!res.ok) {
            throw new Error(text || "Failed to load history.");
        }

        const data = JSON.parse(text);

        const table = document.getElementById("historyTable");
        table.innerHTML = "";

        if (!Array.isArray(data) || data.length === 0) {
            table.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center text-muted">No history found.</td>
                </tr>`;
        } else {
            data.forEach(x => {
                table.innerHTML += `
        <tr>
            <td>${x.created_at ?? ""}</td>
            <td>${x.transaction_type ?? ""}</td>
            <td>${x.quantity ?? ""}</td>
            <td>${x.reference ?? ""}</td>
            <td>${x.warehouse ?? ""}</td>
            <td>${x.remarks ?? ""}</td>
            <td>${x.scanned_by ?? ""}</td>
        </tr>`;
            });
        }

        new bootstrap.Modal(document.getElementById("historyModal")).show();

    } catch (err) {
        console.error("LOAD HISTORY ERROR:", err);
        alert(err.message);
    }
}