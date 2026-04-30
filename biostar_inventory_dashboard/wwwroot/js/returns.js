let returnsData = [];
let createLines = [];
let selectedReturn = null;
let outTransactions = [];
let currentStatusFilter = "active"; // ✅ GLOBAL
const outTransactionModal = new bootstrap.Modal(document.getElementById("outTransactionModal"));

const returnModal = new bootstrap.Modal(document.getElementById("returnModal"));
const detailsModal = new bootstrap.Modal(document.getElementById("returnDetailsModal"));

document.addEventListener("DOMContentLoaded", () => {
    setToday();
    loadReturns();

    document.getElementById("btnNewReturn").addEventListener("click", openCreateModal);
    document.getElementById("btnAddLine").addEventListener("click", addCreateLine);
    document.getElementById("btnSaveReturn").addEventListener("click", saveReturn);
    document.getElementById("btnReleaseReturn").addEventListener("click", releaseReturn);
    document.getElementById("btnCancelReturn").addEventListener("click", cancelReturn);
    document.getElementById("btnOpenOutSearch").addEventListener("click", openOutTransactionSearch);
    document.getElementById("btnSearchOutTransactions").addEventListener("click", searchOutTransactions);


    document.querySelectorAll(".returns-tab").forEach(btn => {
        btn.addEventListener("click", function () {
            document.querySelectorAll(".returns-tab")
                .forEach(x => x.classList.remove("active"));

            this.classList.add("active");

            currentStatusFilter = this.dataset.status;
            loadReturns();
        });
    });
});

function setToday() {
    const today = new Date().toISOString().split("T")[0];
    document.getElementById("returnDate").value = today;
}



async function loadReturns() {
    const tbody = document.getElementById("returnsTableBody");
    tbody.innerHTML = `<tr><td colspan="10" class="text-center text-muted py-4">Loading...</td></tr>`;

    try {
        const res = await fetch(`/Returns/GetAll?status=${encodeURIComponent(currentStatusFilter)}`);
        if (!res.ok) throw new Error(await res.text());

        returnsData = await res.json();
        renderReturns();
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="10" class="text-danger text-center py-4">${escapeHtml(err.message)}</td></tr>`;
    }
}

function renderReturns() {
    const tbody = document.getElementById("returnsTableBody");

    if (!returnsData.length) {
        tbody.innerHTML = `<tr><td colspan="10" class="text-center text-muted py-4">No returns found.</td></tr>`;
        return;
    }

    tbody.innerHTML = returnsData.map(r => {
        const totalQty = (r.lines || []).reduce((sum, x) => sum + Number(x.quantity || 0), 0);
        const releasedQty = (r.lines || []).reduce((sum, x) => sum + Number(x.released_qty || 0), 0);
        const oldestAging = Math.max(...(r.lines || []).map(x => getAgingDays(x.created_at)));
        const remaining = totalQty - releasedQty;

        return `
            <tr>
                <td class="fw-semibold">${escapeHtml(r.return_no)}</td>
                <td>${formatDatePH(r.return_date)}</td>
                <td>${escapeHtml(r.customer_name || "-")}</td>
                <td>${statusBadge(r.status)}</td>
                <td>${formatQty(totalQty)}</td>
                <td>${formatQty(releasedQty)}</td>
                <td>${formatQty(remaining)}</td>
                <td>${oldestAging} day${oldestAging !== 1 ? "s" : ""}</td>
                <td>${escapeHtml(r.reason || "-")}</td>
                <td class="text-end">
                    <button class="btn btn-sm btn-outline-primary" onclick="openDetails(${r.return_id})">
                        View
                    </button>
                </td>
            </tr>
        `;
    }).join("");
}

function openCreateModal() {
    createLines = [];
    clearCreateFields();
    renderCreateLines();
    setToday();
    returnModal.show();
}

function addCreateLine() {
    const line = {
        product_id: val("lineProductId"),
        product_name: val("lineProductName"),
        branch_id: val("lineBranchId"),
        lot_no: val("lineLotNo"),
        quantity: Number(val("lineQty")),
        uom: val("lineUom"),
        quarantine_location: val("lineQuarantineLocation"),
        condition_status: val("lineCondition"),
        remarks: "",

        source_transaction_id: val("selectedOutTransactionId")
            ? Number(val("selectedOutTransactionId"))
            : null,

        order_id: val("lineOrderId") ? Number(val("lineOrderId")) : null,
        order_no: val("lineOrderNo"),
        checklist_id: val("lineChecklistId") ? Number(val("lineChecklistId")) : null,
        checklist_no: val("lineChecklistNo"),

        dr_no: val("lineDrNo"),
        inv_no: val("lineInvNo")
    };

    if (!line.product_id || !line.product_name || !line.branch_id || !line.lot_no || line.quantity <= 0) {
        alert("Please complete Product ID, Product Name, Branch, Lot, and Qty.");
        return;
    }

    createLines.push(line);
    clearLineFields();
    renderCreateLines();
}

function renderCreateLines() {
    const tbody = document.getElementById("returnLinesBody");

    if (!createLines.length) {
        tbody.innerHTML = `<tr><td colspan="7" class="text-center text-muted">No items added.</td></tr>`;
        return;
    }

    tbody.innerHTML = createLines.map((l, i) => `
        <tr>
            <td>${escapeHtml(l.product_name)}<br><small class="text-muted">${escapeHtml(l.product_id)}</small></td>
            <td>${escapeHtml(l.lot_no)}</td>
            <td>${formatQty(l.quantity)} ${escapeHtml(l.uom || "")}</td>
            <td>${escapeHtml(l.quarantine_location || "-")}</td>
            <td>${escapeHtml(l.condition_status)}</td>
            <td>${escapeHtml(l.dr_no || "-")}</td>
            <td class="text-end">
                <button class="btn btn-sm btn-outline-danger" onclick="removeCreateLine(${i})">Remove</button>
            </td>
        </tr>
    `).join("");
}

function removeCreateLine(index) {
    createLines.splice(index, 1);
    renderCreateLines();
}

async function saveReturn() {
    if (!createLines.length) {
        alert("Please add at least one return item.");
        return;
    }

    const payload = {
        customer_id: val("customerId") || null,
        customer_name: val("customerName") || null,
        return_date: val("returnDate"),
        reason: val("returnReason"),
        remarks: val("returnRemarks"),
       created_by: window.currentUserId || "UNKNOWN",
        lines: createLines
    };

    try {
        const res = await fetch("/Returns/Create", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        if (!res.ok) throw new Error(await res.text());

        returnModal.hide();
        await loadReturns();
        alert("Return saved successfully.");
    } catch (err) {
        alert("Failed to save return: " + err.message);
    }
}

async function openDetails(id) {
    try {
        const res = await fetch(`/Returns/GetById?id=${id}`);
        if (!res.ok) throw new Error(await res.text());

        selectedReturn = await res.json();

        document.getElementById("detailsTitle").textContent = selectedReturn.return_no;
        document.getElementById("detailsSubTitle").textContent =
            `${selectedReturn.customer_name || "-"} • ${formatDatePH(selectedReturn.return_date)} • ${selectedReturn.status}`;

        document.getElementById("detailsSummary").innerHTML = `
            <div class="row g-2">
                <div class="col-md-3"><div class="summary-box"><small>Customer</small><strong>${escapeHtml(selectedReturn.customer_name || "-")}</strong></div></div>
                <div class="col-md-3"><div class="summary-box"><small>Status</small><strong>${escapeHtml(selectedReturn.status)}</strong></div></div>
                <div class="col-md-3"><div class="summary-box"><small>Reason</small><strong>${escapeHtml(selectedReturn.reason || "-")}</strong></div></div>
                <div class="col-md-3"><div class="summary-box"><small>Remarks</small><strong>${escapeHtml(selectedReturn.remarks || "-")}</strong></div></div>
            </div>
        `;

        renderDetailsLines();
        detailsModal.show();
    } catch (err) {
        alert("Failed to load return details: " + err.message);
    }
}

function renderDetailsLines() {
    const tbody = document.getElementById("detailsLinesBody");

    tbody.innerHTML = (selectedReturn.lines || []).map(l => {
        const qty = Number(l.quantity || 0);
        const released = Number(l.released_qty || 0);
        const remaining = qty - released;
        const disabled = remaining <= 0 ? "disabled" : "";

        return `
    <tr>
        <td>${escapeHtml(l.product_name)}<br><small class="text-muted">${escapeHtml(l.product_id)}</small></td>
        <td>${escapeHtml(l.lot_no || "-")}</td>
        <td>${formatQty(qty)} ${escapeHtml(l.uom || "")}</td>
        <td>${formatQty(released)} ${escapeHtml(l.uom || "")}</td>
        <td>${formatQty(remaining)} ${escapeHtml(l.uom || "")}</td>
        <td>${escapeHtml(l.dr_no || "-")}</td>
        <td>${escapeHtml(l.inv_no || "-")}</td>
        <td>${escapeHtml(l.po_no || "-")}</td>
        <td>${escapeHtml(l.remarks || "-")}</td>
        <td>${lineStatusBadge(l.release_status)}</td>
        <td style="width:140px;">
            <input type="number"
                   step="0.01"
                   min="0"
                   max="${remaining}"
                   class="form-control form-control-sm release-input"
                   data-line-id="${l.return_line_id}"
                   data-remaining="${remaining}"
                   ${disabled} />
        </td>
    </tr>
`;
    }).join("");
}

async function releaseReturn() {
    if (!selectedReturn) return;

    const inputs = document.querySelectorAll(".release-input");
    const lines = [];

    inputs.forEach(input => {
        const qty = Number(input.value || 0);
        const remaining = Number(input.dataset.remaining || 0);

        if (qty > 0) {
            if (qty > remaining) {
                throw new Error("Release quantity cannot exceed remaining quantity.");
            }

            lines.push({
                return_line_id: Number(input.dataset.lineId),
                quantity: qty
            });
        }
    });

    if (!lines.length) {
        alert("Please enter release quantity.");
        return;
    }

    const payload = {
        released_by: window.currentUserId || "UNKNOWN",
        remarks: val("releaseRemarks"),
        lines
    };

    try {
        const res = await fetch(`/Returns/ReleaseForReprocess?id=${selectedReturn.return_id}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        if (!res.ok) throw new Error(await res.text());

        detailsModal.hide();
        await loadReturns();
        alert("Released for reprocess successfully.");
    } catch (err) {
        alert("Failed to release return: " + err.message);
    }
}

function getAgingDays(dateValue) {
    if (!dateValue) return 0;

    const created = new Date(dateValue);
    const now = new Date();

    const createdPH = new Date(created.toLocaleString("en-US", { timeZone: "Asia/Manila" }));
    const nowPH = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Manila" }));

    createdPH.setHours(0, 0, 0, 0);
    nowPH.setHours(0, 0, 0, 0);

    const diffMs = nowPH - createdPH;
    return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
}

async function cancelReturn() {
    if (!selectedReturn) return;

    if (!confirm("Cancel this return? This is only allowed if nothing was released.")) return;

    try {
        const res = await fetch(`/Returns/Cancel?id=${selectedReturn.return_id}`, {
            method: "POST"
        });

        if (!res.ok) throw new Error(await res.text());

        detailsModal.hide();
        await loadReturns();
        alert("Return cancelled.");
    } catch (err) {
        alert("Failed to cancel return: " + err.message);
    }
}

function clearCreateFields() {
    document.getElementById("customerId").value = "";
    document.getElementById("customerName").value = "";
    document.getElementById("returnReason").value = "";
    document.getElementById("returnRemarks").value = "";
    clearLineFields();
}

function clearLineFields() {
    [
        "lineProductId",
        "lineProductName",
        "lineBranchId",
        "lineLotNo",
        "lineQty",
        "lineUom",
        "lineQuarantineLocation",
        "lineDrNo",
        "lineInvNo",
        "lineOrderNo",
        "lineChecklistNo",
        "lineOrderId",
        "lineChecklistId",
        "selectedOutTransactionId"
    ].forEach(id => document.getElementById(id).value = "");

    document.getElementById("lineCondition").value = "FOR INSPECTION";
}

function val(id) {
    return document.getElementById(id).value.trim();
}

function formatDatePH(value) {
    if (!value) return "-";
    return new Date(value).toLocaleDateString("en-US", {
        timeZone: "Asia/Manila",
        year: "numeric",
        month: "long",
        day: "numeric"
    });
}

function formatQty(value) {
    const num = Number(value || 0);
    return num.toLocaleString(undefined, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    });
}

function statusBadge(status) {
    const s = (status || "").toUpperCase();
    let cls = "bg-secondary";

    if (s === "QUARANTINE") cls = "bg-info text-dark";
    else if (s === "PARTIALLY RELEASED") cls = "bg-warning text-dark";
    else if (s === "RELEASED FOR REPROCESS") cls = "bg-success";
    else if (s === "CANCELLED") cls = "bg-danger";

    return `<span class="badge ${cls}">${escapeHtml(status || "-")}</span>`;
}

function lineStatusBadge(status) {
    const s = (status || "").toUpperCase();
    let cls = "bg-secondary";

    if (s === "IN QUARANTINE") cls = "bg-info text-dark";
    else if (s === "PARTIALLY RELEASED") cls = "bg-warning text-dark";
    else if (s === "RELEASED") cls = "bg-success";

    return `<span class="badge ${cls}">${escapeHtml(status || "-")}</span>`;
}

function escapeHtml(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

//return search




function openOutTransactionSearch() {
    document.getElementById("outSearchText").value = "";
    document.getElementById("outSearchLot").value = "";
    document.getElementById("outTransactionBody").innerHTML =
        `<tr><td colspan="10" class="text-center text-muted py-3">Search OUT transactions.</td></tr>`;

    returnModal.hide();

    setTimeout(() => {
        outTransactionModal.show();
    }, 250);
}

document.getElementById("outTransactionModal").addEventListener("hidden.bs.modal", function () {
    if (document.body.dataset.returnSearchSelected !== "1") {
        setTimeout(() => {
            returnModal.show();
        }, 250);
    }

    document.body.dataset.returnSearchSelected = "0";
});

async function searchOutTransactions() {
    const search = document.getElementById("outSearchText").value.trim();
    const lotNo = document.getElementById("outSearchLot").value.trim();

    const tbody = document.getElementById("outTransactionBody");
    tbody.innerHTML = `<tr><td colspan="10" class="text-center text-muted">Searching...</td></tr>`;

    try {
        const url = `/Returns/SearchOutTransactions?search=${encodeURIComponent(search)}&lotNo=${encodeURIComponent(lotNo)}`;
        const res = await fetch(url);

        if (!res.ok) throw new Error(await res.text());

        outTransactions = await res.json();
        renderOutTransactions();
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="10" class="text-danger text-center">${escapeHtml(err.message)}</td></tr>`;
    }
}

function renderOutTransactions() {
    const tbody = document.getElementById("outTransactionBody");

    if (!outTransactions.length) {
        tbody.innerHTML = `<tr><td colspan="10" class="text-center text-muted py-3">No OUT transactions found.</td></tr>`;
        return;
    }

    tbody.innerHTML = outTransactions.map((t, i) => {
        const outQty = Number(t.quantity || 0);
        const returnedQty = Number(t.returned_qty || 0);
        const returnableQty = Number(t.returnable_qty || 0);

        const disabled = returnableQty <= 0 ? "disabled" : "";
        const badge = returnableQty <= 0
            ? `<span class="badge bg-danger">FULLY RETURNED</span>`
            : returnedQty > 0
                ? `<span class="badge bg-warning text-dark">PARTIAL</span>`
                : `<span class="badge bg-success">AVAILABLE</span>`;

        return `
            <tr>
                <td>${formatDatePH(t.created_at)}</td>
                <td>
                    ${escapeHtml(t.product_name || "-")}
                    <br>
                    <small class="text-muted">${escapeHtml(t.product_id || "")}</small>
                </td>
                <td>${escapeHtml(t.lot_no || "-")}</td>
                <td>
                    <div>${formatQty(outQty)} ${escapeHtml(t.uom || "")}</div>
                    <small class="text-muted">
                        Returned: ${formatQty(returnedQty)} |
                        Returnable: ${formatQty(returnableQty)}
                    </small>
                </td>
                <td>${escapeHtml(t.customer_name || "-")}</td>
                <td>${escapeHtml(t.dr_no || "-")}</td>
                <td>${escapeHtml(t.inv_no || "-")}</td>
                <td>${escapeHtml(t.order_no || "-")}</td>
                <td>
                    ${badge}
                    <br>
                    <small>${escapeHtml(t.remarks || "-")}</small>
                </td>
                <td class="text-end">
                    <button class="btn btn-sm btn-primary" onclick="selectOutTransaction(${i})" ${disabled}>
                        Select
                    </button>
                </td>
            </tr>
        `;
    }).join("");
}

function selectOutTransaction(index) {
    const t = outTransactions[index];
    if (!t) return;

    document.getElementById("selectedOutTransactionId").value = t.transaction_id || "";

    document.getElementById("customerId").value = t.customer_id || "";
    document.getElementById("customerName").value = t.customer_name || "";

    document.getElementById("lineProductId").value = t.product_id || "";
    document.getElementById("lineProductName").value = t.product_name || "";
    document.getElementById("lineBranchId").value = t.branch_id || "";
    document.getElementById("lineLotNo").value = t.lot_no || "";
    document.getElementById("lineQty").value = t.returnable_qty || 0;
    document.getElementById("lineQty").max = t.returnable_qty || 0;
    document.getElementById("lineUom").value = t.uom || "";

    document.getElementById("lineDrNo").value = t.dr_no || "";
    document.getElementById("lineInvNo").value = t.inv_no || "";
    document.getElementById("lineOrderNo").value = t.order_no || "";
    document.getElementById("lineChecklistNo").value = t.checklist_no || "";

    document.getElementById("lineOrderId").value = t.order_id || "";
    document.getElementById("lineChecklistId").value = t.checklist_id || "";

    if (!document.getElementById("returnReason").value.trim()) {
        document.getElementById("returnReason").value = "Returned item";
    }

    document.body.dataset.returnSearchSelected = "1";

    outTransactionModal.hide();

    setTimeout(() => {
        returnModal.show();
    }, 250);

    outTransactionModal.hide();
}