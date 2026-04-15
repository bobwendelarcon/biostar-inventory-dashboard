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

    if (totalMonths <= 2) {
        return `<span class="badge bg-warning text-dark">${totalMonths} mo</span>`;
    }

    return `<span class="badge bg-success">${totalMonths} mo</span>`;
}

function getStatusBadge(quantity) {
    const qty = parseInt(quantity) || 0;

    if (qty === 0) {
        return `<span class="badge bg-danger">Zero Stock</span>`;
    } else if (qty <= 5) {
        return `<span class="badge bg-warning text-dark">Low Stock</span>`;
    } else if (qty <= 100) {
        return `<span class="badge bg-success">Normal</span>`;
    } else {
        return `<span class="badge bg-primary">Over Stock</span>`;
    }
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
            stockStatus: document.getElementById("stockStatusFilter")?.value || "",
            expiryStatus: document.getElementById("expiryStatusFilter")?.value || "",
            months: document.getElementById("monthsFilter")?.value || "",
            order: document.getElementById("orderFilter")?.value || "desc"
        });

        const response = await fetch(`/Inventory/GetInventory?${params.toString()}`);

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(errText);
        }

        const json = await response.json();
        const items = json.data || [];
        totalRecords = Number(json.total) || 0;

        const tableBody = document.getElementById("inventoryTable");
        tableBody.innerHTML = "";

        if (items.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="9" class="text-center text-muted">
                        No inventory data found.
                    </td>
                </tr>`;
            renderPagination();
            return;
        }

        items.forEach(item => {
            const qty = Number(item.qty ?? 0);
            const disableTransfer = qty <= 0 ? "disabled" : "";

            tableBody.innerHTML += `
                <tr>
                    <td>${item.lot_no ?? ""}</td>
                    <td>${item.description ?? ""}</td>
                    <td>${qty} ${item.uom ?? ""}</td>
                    <td>${formatPack(item.qty, item.pack_qty, item.pack_uom, item.uom)}</td>
                    <td>${getStatusBadge(item.qty)}</td>
                    <td>${formatMonthYear(item.manufacturing_date)} - ${formatMonthYear(item.expiration_date)}</td>
                    <td>${getRemainingMonthsDisplay(item.expiration_date)}</td>
                    <td>${item.warehouse ?? ""}</td>
                    <td class="text-center">
                        <button
                            class="btn btn-sm btn-outline-primary btn-transfer"
                            data-product="${item.product_id ?? ""}"
                            data-lot="${item.lot_no ?? ""}"
                            data-qty="${qty}"
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
                            data-qty="${qty}">
                            Adjust
                        </button>

                        <button
                            class="btn btn-sm btn-outline-secondary btn-history"
                            data-product="${item.product_id ?? ""}"
                            data-lot="${item.lot_no ?? ""}">
                            History
                        </button>
                    </td>
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

    const historyBtn = e.target.closest(".btn-history");
    if (historyBtn) {
        alert("History modal next.");
        return;
    }

    const adjustBtn = e.target.closest(".btn-adjust");
    if (adjustBtn) {
        alert("Adjust modal next.");
        return;
    }
});

document.addEventListener("DOMContentLoaded", function () {
    document.getElementById("prevBtn")?.addEventListener("click", prevPage);
    document.getElementById("nextBtn")?.addEventListener("click", nextPage);

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