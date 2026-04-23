function formatDateOnly(created_at) {
    if (!created_at) return "-";

    const utcString = String(created_at).replace(" ", "T") + "Z";
    const date = new Date(utcString);

    return date.toLocaleDateString("en-US", {
        timeZone: "Asia/Manila",
        year: "numeric",
        month: "long",
        day: "numeric"
    });
}

function formatTimeOnly(created_at) {
    if (!created_at) return "-";

    const utcString = String(created_at).replace(" ", "T") + "Z";
    const date = new Date(utcString);

    return date.toLocaleTimeString("en-US", {
        timeZone: "Asia/Manila",
        hour: "numeric",
        minute: "2-digit",
        second: "2-digit",
        hour12: true
    });
}

let currentPage = 1;
let pageSize = 30;
let totalRecords = 0;
let lotSearchTimeout;
let isEditing = false;

function escapeHtml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}

function toDisplayNumber(value) {
    const num = Number(value || 0);

    if (Number.isInteger(num)) {
        return num.toString();
    }

    return num.toFixed(2);
}


function buildReferenceHtml(item) {
    const refs = [];

    if (item.dr_no) refs.push(`<div><strong>DR:</strong> ${escapeHtml(item.dr_no)}</div>`);
    if (item.inv_no) refs.push(`<div><strong>INV:</strong> ${escapeHtml(item.inv_no)}</div>`);
    if (item.po_no) refs.push(`<div><strong>PO:</strong> ${escapeHtml(item.po_no)}</div>`);
    if (item.order_no) refs.push(`<div><strong>DO:</strong> ${escapeHtml(item.order_no)}</div>`);
    if (item.checklist_no) refs.push(`<div><strong>DC:</strong> ${escapeHtml(item.checklist_no)}</div>`);

    return refs.length > 0
        ? `<div class="reference-stack">${refs.join("")}</div>`
        : `<span class="text-muted">-</span>`;
}

async function loadTransactions(page = 1) {
    try {
        currentPage = page;

        const lotNo = document.getElementById("lotNoFilter")?.value.trim() || "";
        const product = document.getElementById("productFilter")?.value.trim() || "";
        const type = document.getElementById("typeFilter")?.value || "";
        const from = document.getElementById("dateFromFilter")?.value || "";
        const to = document.getElementById("dateToFilter")?.value || "";
        const scannedBy = document.getElementById("scannedByFilter")?.value.trim() || "";
        const reference = document.getElementById("referenceFilter")?.value.trim() || "";
        const warehouse = document.getElementById("warehouseFilter")?.value || "";
        const order = document.getElementById("orderFilter")?.value || "desc";
        const supplier = document.getElementById("supplierFilter")?.value || "";
        const customer = document.getElementById("customerFilter")?.value || "";
        const quickFilter = document.getElementById("filterApplied")?.value || "";

        let url = `/Transactions/GetTransactions?page=${page}&pageSize=${pageSize}`;

        if (lotNo) url += `&lot_no=${encodeURIComponent(lotNo)}`;
        if (product) url += `&product=${encodeURIComponent(product)}`;
        if (type) url += `&type=${encodeURIComponent(type)}`;
        if (from) url += `&from=${encodeURIComponent(from)}`;
        if (to) url += `&to=${encodeURIComponent(to)}`;
        if (scannedBy) url += `&scanned_by=${encodeURIComponent(scannedBy)}`;
        if (reference) url += `&reference=${encodeURIComponent(reference)}`;
        if (warehouse) url += `&warehouse=${encodeURIComponent(warehouse)}`;
        if (order) url += `&order=${encodeURIComponent(order)}`;
        if (supplier) url += `&supplier=${encodeURIComponent(supplier)}`;
        if (customer) url += `&customer=${encodeURIComponent(customer)}`;
        if (quickFilter) url += `&quickFilter=${encodeURIComponent(quickFilter)}`;

        console.log("FILTER URL:", url);

        const response = await fetch(url);

        if (!response.ok) {
            const errText = await response.text();
            throw new Error("HTTP " + response.status + " - " + errText);
        }

        const result = await response.json();
        const data = result.data;
        totalRecords = Number(result.total) || 0;

        const tableBody = document.getElementById("transactionTable");
        tableBody.innerHTML = "";

        if (!data || data.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="11" class="text-center text-muted">
                        No transactions found.
                    </td>
                </tr>
            `;
            renderPagination(0);
            return;
        }

        data.forEach(item => {
            console.log(item);
            const transactionType = (item.transaction_type || "").toUpperCase();
            const isOut = transactionType === "OUT";

            tableBody.innerHTML += `
                <tr>
                    <td>${escapeHtml(item.lot_no ?? "")}</td>
                    <td>${escapeHtml(item.product_name ?? "")}</td>
                    <td>${escapeHtml(item.customer_name ?? "")}</td>
                    <td>${formatDateOnly(item.created_at)}</td>
                    <td>${formatTimeOnly(item.created_at)}</td>
                    <td>${escapeHtml(item.branch_name ?? item.branch_id ?? "")}</td>
                    <td>${escapeHtml(item.transaction_type ?? "")}</td>
                    <td>${escapeHtml(`${toDisplayNumber(item.quantity)} ${item.uom || ""}`)}</td>
                    <td>${escapeHtml(formatPackOnly(item))}</td>
                    <td>${buildReferenceHtml(item)}</td>
                    <td>${escapeHtml(item.remarks ?? "")}</td>
                    <td class="text-center">
                        ${isOut
                    ? `
                                <button
                                    type="button"
                                    class="btn btn-sm btn-outline-primary btn-edit"
                                    data-id="${item.transaction_id ?? ""}"
                                    data-customer="${escapeHtml(item.customer_name ?? "")}"
                                    data-dr="${escapeHtml(item.dr_no ?? "")}"
                                    data-inv="${escapeHtml(item.inv_no ?? "")}"
                                    data-po="${escapeHtml(item.po_no ?? "")}"
                                    data-remarks="${escapeHtml(item.remarks ?? "")}">
                                    Edit
                                </button>
                            `
                    : `<span class="text-muted">-</span>`
                }
                    </td>
                </tr>
            `;
        });

        renderPagination(totalRecords);
    } catch (error) {
        document.getElementById("transactionTable").innerHTML = `
            <tr>
                <td colspan="11" class="text-center text-danger">
                    ${error.message}
                </td>
            </tr>
        `;
        console.error(error);
    }
}

function renderPagination(total) {
    const totalCount = Number(total) || 0;
    const totalPages = Math.ceil(totalCount / pageSize);

    const start = totalCount === 0 ? 0 : ((currentPage - 1) * pageSize) + 1;
    const end = Math.min(currentPage * pageSize, totalCount);

    const rangeText = document.getElementById("rangeText");
    if (rangeText) {
        rangeText.innerText = `${start}-${end} of ${totalCount.toLocaleString()}`;
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
        loadTransactions(currentPage);
    }
}

function prevPage() {
    if (currentPage > 1) {
        currentPage--;
        loadTransactions(currentPage);
    }
}

function formatTransactionQty(item) {
    const qty = Number(item.quantity || 0);
    const packQty = Number(item.pack_qty || 0);
    const packUom = (item.pack_uom || "").toUpperCase();
    const uom = item.uom || "";

    const qtyText = toDisplayNumber(qty);

    if (!packQty || packQty <= 0) {
        return escapeHtml(`${qtyText} ${uom}`.trim());
    }

    const packs = Math.floor(qty / packQty);
    const remainder = qty % packQty;

    let breakdown = "";

    if (packs > 0 && remainder > 0) {
        breakdown = `${packs} ${packUom} + ${toDisplayNumber(remainder)} ${uom}`;
    } else if (packs > 0) {
        breakdown = `${packs} ${packUom}`;
    } else {
        breakdown = `${toDisplayNumber(remainder)} ${uom}`;
    }

    return escapeHtml(`${qtyText} ${uom} = (${breakdown})`);
}

function formatPackOnly(item) {
    const qty = Number(item.quantity || 0);
    const packQty = Number(item.pack_qty || 0);
    const packUom = (item.pack_uom || "").toUpperCase();
    const uom = item.uom || "";

    if (!packQty || packQty <= 0) {
        return "-";
    }

    const packs = Math.floor(qty / packQty);
    const remainder = qty % packQty;

    if (packs > 0 && remainder > 0) {
        return `${packs} ${packUom} + ${toDisplayNumber(remainder)} ${uom}`;
    } else if (packs > 0) {
        return `${packs} ${packUom}`;
    } else {
        return `${toDisplayNumber(remainder)} ${uom}`;
    }
}




document.addEventListener("click", function (e) {
    const btn = e.target.closest(".btn-edit");
    if (!btn) return;

    isEditing = true;

    document.getElementById("editTransactionId").value = btn.dataset.id || "";
  
    document.getElementById("editDrNo").value = btn.dataset.dr || "";
    document.getElementById("editInvNo").value = btn.dataset.inv || "";
    document.getElementById("editPoNo").value = btn.dataset.po || "";
    document.getElementById("editRemarks").value = btn.dataset.remarks || "";

    const modalElement = document.getElementById("editReferenceModal");
    const modal = new bootstrap.Modal(modalElement);
    modal.show();
});

document.addEventListener("DOMContentLoaded", function () {
    document.getElementById("prevBtn")?.addEventListener("click", prevPage);
    document.getElementById("nextBtn")?.addEventListener("click", nextPage);

    document.getElementById("applyFilters")?.addEventListener("click", function () {
        loadTransactions(1);
    });

    document.getElementById("clearFilters")?.addEventListener("click", function () {
        const ids = [
            "lotNoFilter",
            "productFilter",
            "typeFilter",
            "dateFromFilter",
            "dateToFilter",
            "scannedByFilter",
            "referenceFilter",
            "warehouseFilter",
            "orderFilter",
            "supplierFilter",
            "customerFilter",
            "filterApplied"
        ];

        ids.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = "";
        });

        const orderEl = document.getElementById("orderFilter");
        if (orderEl) orderEl.value = "desc";

        loadTransactions(1);
    });

    document.getElementById("lotNoFilter")?.addEventListener("input", function () {
        clearTimeout(lotSearchTimeout);
        lotSearchTimeout = setTimeout(() => {
            loadTransactions(1);
        }, 500);
    });

    document.getElementById("btnSaveReference")?.addEventListener("click", async function () {
        const payload = {
            transaction_id: parseInt(document.getElementById("editTransactionId").value, 10),
            //customer: document.getElementById("editCustomer").value.trim(),
            dr_no: document.getElementById("editDrNo").value.trim(),
            inv_no: document.getElementById("editInvNo").value.trim(),
            po_no: document.getElementById("editPoNo").value.trim(),
            remarks: document.getElementById("editRemarks").value.trim()
        };

        console.log("UPDATE PAYLOAD:", payload);

        try {
            const res = await fetch("/Transactions/UpdateReference", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(payload)
            });

            const text = await res.text();
            console.log("UPDATE RESPONSE STATUS:", res.status);
            console.log("UPDATE RESPONSE BODY:", text);

            if (!res.ok) {
                throw new Error(text || "Failed to update reference.");
            }

            const modalElement = document.getElementById("editReferenceModal");
            const modalInstance = bootstrap.Modal.getInstance(modalElement);
            if (modalInstance) modalInstance.hide();

            isEditing = false;
            loadTransactions(currentPage);
            alert("Reference updated successfully.");
        } catch (err) {
            console.error("UPDATE ERROR:", err);
            alert("Error: " + err.message);
        }
    });

    document.getElementById("editReferenceModal")?.addEventListener("hidden.bs.modal", function () {
        isEditing = false;
    });

    //const scrollArea = document.getElementById("transactionScrollArea");
    //if (scrollArea) {
    //    scrollArea.addEventListener("wheel", function (e) {
    //        if (e.deltaY !== 0) {
    //            e.preventDefault();
    //            scrollArea.scrollLeft += e.deltaY;
    //        }
    //    }, { passive: false });
    //}

    loadTransactions(1);

    setInterval(() => {
        if (!isEditing) {
            loadTransactions(currentPage);
        }
    }, 5000);
});