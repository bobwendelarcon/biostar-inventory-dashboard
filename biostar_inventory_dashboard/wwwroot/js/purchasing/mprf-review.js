document.addEventListener("DOMContentLoaded", function () {
    const tableBody = document.getElementById("mprfReviewTableBody");

    if (tableBody) {
        loadMprfReviewList();
    }

    const search = document.getElementById("reviewSearch");
    const status = document.getElementById("reviewStatusFilter");

    if (search) search.addEventListener("input", loadMprfReviewList);
    if (status) status.addEventListener("change", loadMprfReviewList);

    const reviewDate = document.getElementById("reviewDateDisplay");
    if (reviewDate) {
        reviewDate.value = new Date().toLocaleDateString();
    }
});

let reviewListCache = [];

async function loadMprfReviewList() {
    const tbody = document.getElementById("mprfReviewTableBody");

    try {
        const response = await fetch("/purchasing/mprf/review-list");

        if (!response.ok) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center text-danger py-4">
                        Failed to load MPRF review list.
                    </td>
                </tr>`;
            return;
        }

        const data = await response.json();
        reviewListCache = Array.isArray(data) ? data : [];

        renderReviewList();

    } catch (error) {
        console.error(error);

        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center text-danger py-4">
                    Error loading MPRF review list.
                </td>
            </tr>`;
    }
}

function renderReviewList() {
    const tbody = document.getElementById("mprfReviewTableBody");
    const search = document.getElementById("reviewSearch")?.value?.toLowerCase() ?? "";
    const status = document.getElementById("reviewStatusFilter")?.value ?? "";

    let data = reviewListCache;

    if (search) {
        data = data.filter(x =>
            String(x.mprf_no ?? "").toLowerCase().includes(search)
            || String(x.category ?? "").toLowerCase().includes(search)
            || String(x.requested_by_name ?? "").toLowerCase().includes(search)
        );
    }

    if (status) {
        data = data.filter(x => x.status === status);
    }

    if (!data || data.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center text-muted py-4">
                    No MPRF records for review.
                </td>
            </tr>`;
        return;
    }

    tbody.innerHTML = data.map(item => {
        let actions = "";

        if (item.status === "SUBMITTED") {
            actions = `
        <div class="dropdown">
            <button class="btn btn-sm btn-light border dropdown-toggle action-btn"
                    type="button"
                    data-bs-toggle="dropdown">
                Actions
            </button>
            <ul class="dropdown-menu">
                <li>
                    <button class="dropdown-item"
                            onclick="openMprfReview(${item.mprf_id}, true)">
                        Review
                    </button>
                </li>
            </ul>
        </div>`;
        }
//        else if (item.status === "REVIEWED" || item.status === "CANVASSING") {
//            actions = `
//        <div class="dropdown">
//            <button class="btn btn-sm btn-light border dropdown-toggle action-btn"
//                    type="button"
//                    data-bs-toggle="dropdown">
//                Actions
//            </button>
//            <ul class="dropdown-menu">
//                <li>
//                    <button class="dropdown-item"
//                            onclick="openMprfReview(${item.mprf_id}, false)">
//                        View
//                    </button>
//                </li>
//                <li>
//                   <button class="dropdown-item"
//        onclick="openCanvassing(${item.mprf_id})">
//    Canvassing
//</button>
//                </li>
//            </ul>
//        </div>`;
            //        }

        else if (item.status === "REVIEWED") {
            actions = `
    <div class="dropdown">
        <button class="btn btn-sm btn-light border dropdown-toggle action-btn"
                type="button"
                data-bs-toggle="dropdown">
            Actions
        </button>
        <ul class="dropdown-menu">
            <li>
                <button class="dropdown-item"
                        onclick="openMprfReview(${item.mprf_id}, false)">
                    View
                </button>
            </li>
            <li>
                <button class="dropdown-item"
                        onclick="openCanvassing(${item.mprf_id})">
                    Canvassing
                </button>
            </li>
        </ul>
    </div>`;
        }
        else if (item.status === "CANVASSING") {
            actions = `
    <div class="dropdown">
        <button class="btn btn-sm btn-light border dropdown-toggle action-btn"
                type="button"
                data-bs-toggle="dropdown">
            Actions
        </button>
        <ul class="dropdown-menu">
            <li>
                <button class="dropdown-item"
                        onclick="openMprfReview(${item.mprf_id}, false)">
                    View
                </button>
            </li>
        </ul>
    </div>`;
        }
        else {
            actions = `
        <div class="dropdown">
            <button class="btn btn-sm btn-light border dropdown-toggle action-btn"
                    type="button"
                    data-bs-toggle="dropdown">
                Actions
            </button>
            <ul class="dropdown-menu">
                <li>
                    <button class="dropdown-item"
                            onclick="openMprfReview(${item.mprf_id}, false)">
                        View
                    </button>
                </li>
            </ul>
        </div>`;
        }

        return `
            <tr>
                <td>${escapeHtml(item.mprf_no ?? "")}</td>
                <td>${formatDate(item.request_date)}</td>
                <td>${escapeHtml(item.category ?? "")}</td>
                <td>${escapeHtml(item.requested_by_name ?? item.requested_by ?? "-")}</td>
             
             <td>${statusBadge(item.status)}</td>
<td>${renderPoProgress(item)}</td>
<td style="width:90px;">
    ${actions}
</td>
            </tr>
        `;
    }).join("");
}

async function openCanvassing(mprfId) {
    try {
        const response = await fetch(`/purchasing/canvassing/create-from-mprf/${mprfId}`, {
            method: "POST"
        });

        const result = await response.json();

        if (!response.ok) {
            alert(result.message || "Failed to create canvassing.");
            return;
        }

        window.location.href = `/purchasing/canvassing/details-page/${result.canvassId}`;
    } catch (error) {
        console.error(error);
        alert("Error creating supplier canvassing.");
    }
}

async function openMprfReview(id, editable) {
    try {
        const response = await fetch(`/purchasing/mprf/${id}`);

        if (!response.ok) {
            alert("Failed to load MPRF.");
            return;
        }

        const data = await response.json();







        document.getElementById("reviewMprfId").value = data.mprf_id;
        document.getElementById("reviewMprfNo").value = data.mprf_no ?? "";
        document.getElementById("reviewRequestDate").value = formatDate(data.request_date);
        document.getElementById("reviewDepartment").value = data.category ?? "";
        document.getElementById("reviewRequestedBy").value =
            data.requested_by_name ?? data.requested_by ?? "-";
        document.getElementById("reviewWeek").value = data.week ?? "";
        document.getElementById("reviewStatus").innerHTML = statusBadge(data.status);

        //document.getElementById("reviewDecision").value =
        //    data.review_decision ?? "APPROVE_FOR_CANVASSING";

        document.getElementById("reviewRemarks").value =
            data.review_remarks ?? "";

        renderReviewLines(data.lines ?? [], editable);
        renderReviewHistory(data);


        const isReviewable = data.status === "SUBMITTED";

        document.querySelector(".btn-danger").disabled = !isReviewable;
        document.querySelector(".btn-warning").disabled = !isReviewable;
        document.querySelector(".btn-success").disabled = !isReviewable;

        document.getElementById("btnRejectReview").disabled = !isReviewable;
        document.getElementById("btnReturnReview").disabled = !isReviewable;
        document.getElementById("btnApproveReview").disabled = !isReviewable;

        document.getElementById("reviewRemarks").readOnly = !isReviewable;



        setReviewEditable(editable);

        const modal = new bootstrap.Modal(document.getElementById("mprfReviewModal"));
        modal.show();

    } catch (error) {
        console.error(error);
        alert("Error loading MPRF review.");
    }
}

function renderReviewLines(lines, editable) {
    const tbody = document.getElementById("reviewLinesBody");

    if (!lines || lines.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center text-muted py-4">
                    No material lines found.
                </td>
            </tr>`;
        return;
    }

    tbody.innerHTML = lines.map(line => {
        const qtyOnHand = Number(line.qty_on_hand ?? 0);
        const stockStatus = getStockStatus(qtyOnHand);
        const purchasingQty = line.purchasing_qty ?? "";
        const purchasingRemarks = line.purchasing_remarks ?? "";

        return `
            <tr data-line-id="${line.mprf_line_id}">
                <td>${escapeHtml(formatMaterial(line))}</td>
                <td>${escapeHtml(formatClassification(line))}</td>
                <td>${formatNumber(line.qty_on_hand)}</td>
                <td>${escapeHtml(line.uom ?? "")}</td>
                <td>${escapeHtml(line.remarks ?? "")}</td>
                <td>${stockStatus}</td>
                <td>
                    <input type="number"
                           class="form-control form-control-sm purchasing-qty"
                           min="0"
                           step="0.0001"
                           value="${escapeHtml(purchasingQty)}"
                           ${editable ? "" : "readonly"}>
                </td>
                <td>
                    <input type="text"
                           class="form-control form-control-sm purchasing-remarks"
                           value="${escapeHtml(purchasingRemarks)}"
                           placeholder="Purchasing notes"
                           ${editable ? "" : "readonly"}>
                </td>
            </tr>
        `;
    }).join("");
}

function renderReviewHistory(data) {
    const tbody = document.getElementById("reviewHistoryBody");

    const rows = [];

    rows.push(`
        <tr>
            <td>${formatDate(data.created_at)}</td>
            <td>${escapeHtml(data.requested_by_name ?? data.requested_by ?? "-")}</td>
            <td><span class="badge bg-primary">Submitted</span></td>
            <td>MPRF submitted for purchasing review.</td>
        </tr>
    `);

    if (data.reviewed_at || data.review_decision) {
        rows.push(`
            <tr>
                <td>${formatDate(data.reviewed_at)}</td>
                <td>${escapeHtml(data.reviewed_by_name ?? data.reviewed_by ?? "-")}</td>
                <td>${reviewDecisionBadge(data.review_decision)}</td>
                <td>${escapeHtml(data.review_remarks ?? "-")}</td>
            </tr>
        `);
    } else {
        rows.push(`
            <tr>
                <td>-</td>
                <td>-</td>
                <td><span class="badge bg-secondary">Pending Review</span></td>
                <td>No purchasing decision yet.</td>
            </tr>
        `);
    }

    tbody.innerHTML = rows.join("");
}

function setReviewEditable(editable) {
    //document.getElementById("reviewDecision").disabled = !editable;
    document.getElementById("reviewRemarks").readOnly = !editable;

    document.querySelectorAll(".purchasing-qty").forEach(x => {
        x.readOnly = !editable;
    });

    document.querySelectorAll(".purchasing-remarks").forEach(x => {
        x.readOnly = !editable;
    });
}

function quickReviewDecision(decision) {
    saveMprfReview(decision);
}

async function saveMprfReview(decision = "APPROVE_FOR_CANVASSING") {
    const id = document.getElementById("reviewMprfId").value;
  
    const remarks = document.getElementById("reviewRemarks").value.trim();

    const lines = [];

    document.querySelectorAll("#reviewLinesBody tr[data-line-id]").forEach(row => {
        const lineId = parseInt(row.getAttribute("data-line-id"));
        const purchasingQty = parseFloat(row.querySelector(".purchasing-qty").value || "0");
        const purchasingRemarks = row.querySelector(".purchasing-remarks").value.trim();

        lines.push({
            mprf_line_id: lineId,
            purchasing_qty: purchasingQty,
            purchasing_remarks: purchasingRemarks,
            item_decision: row.querySelector(".item-decision")?.value || "APPROVED"
        });
    });

    if (decision === "APPROVE_FOR_CANVASSING") {
        const invalid = lines.some(x => !x.purchasing_qty || x.purchasing_qty <= 0);

        if (invalid) {
            alert("Please enter Qty to Purchase for all materials before approving for canvassing.");
            return;
        }
    }

    const payload = {
        review_decision: decision,
        review_remarks: remarks,
        lines: lines
    };

    const confirmMessage =
        decision === "APPROVE_FOR_CANVASSING"
            ? "Approve this MPRF for canvassing?"
            : decision === "RETURN_TO_REQUESTOR"
                ? "Return this MPRF to the requestor?"
                : "Reject this MPRF?";

    if (!confirm(confirmMessage)) return;

    const response = await fetch(`/purchasing/mprf/${id}/review`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        const error = await response.text();
        alert(error || "Failed to save MPRF review.");
        return;
    }

    const result = await response.json();

    if (decision === "APPROVE_FOR_CANVASSING") {

        const canvassResponse = await fetch(
            `/purchasing/canvassing/create-from-mprf/${id}`,
            {
                method: "POST"
            });

        const canvassResult = await canvassResponse.json();

        if (!canvassResponse.ok) {
            alert(canvassResult.message || "Failed to create canvassing.");
            return;
        }

        window.location.href =
            `/purchasing/canvassing/details-page/${canvassResult.canvassId}`;

        return;
    }

    alert("MPRF review saved successfully.");

    const modal = bootstrap.Modal.getInstance(
        document.getElementById("mprfReviewModal"));

    if (modal) modal.hide();

    await loadMprfReviewList();
}

function getStockStatus(qtyOnHand) {
    if (qtyOnHand <= 0) {
        return `<span class="badge bg-danger">Critical</span>`;
    }

    if (qtyOnHand <= 20) {
        return `<span class="badge bg-warning text-dark">Low Stock</span>`;
    }

    return `<span class="badge bg-success">Available</span>`;
}

function reviewDecisionBadge(decision) {
    if (decision === "APPROVE_FOR_CANVASSING") {
        return `<span class="badge bg-success">Approved for Canvassing</span>`;
    }

    if (decision === "RETURN_TO_REQUESTOR") {
        return `<span class="badge bg-warning text-dark">Returned</span>`;
    }

    if (decision === "REJECT") {
        return `<span class="badge bg-danger">Rejected</span>`;
    }

    return `<span class="badge bg-secondary">Pending</span>`;
}

function statusBadge(status) {
    if (status === "DRAFT") return `<span class="badge bg-secondary">DRAFT</span>`;
    if (status === "SUBMITTED") return `<span class="badge bg-primary">SUBMITTED</span>`;
    if (status === "REVIEWED") return `<span class="badge bg-info text-dark">REVIEWED</span>`;
    if (status === "CANVASSING") return `<span class="badge bg-warning text-dark">CANVASSING</span>`;
    if (status === "RETURNED") return `<span class="badge bg-warning text-dark">RETURNED</span>`;
    if (status === "REJECTED") return `<span class="badge bg-danger">REJECTED</span>`;
    if (status === "PO_CREATED") return `<span class="badge bg-success">PO CREATED</span>`;

    return `<span class="badge bg-light text-dark">${escapeHtml(status ?? "")}</span>`;
}
function renderPoProgress(item) {

    const total =
        Number(item.total_recommended_suppliers || 0);

    const created =
        Number(item.total_created_po_suppliers || 0);

    if (total === 0) {
        return `
            <span class="badge bg-secondary">
                No PO Yet
            </span>`;
    }

    if (created >= total) {
        return `
            <span class="badge bg-success">
                Complete
            </span>`;
    }

    const remaining = total - created;

    return `
        <div>
            <span class="badge bg-warning text-dark">
                ${created}/${total} POs Created
            </span>
            <div class="small text-muted">
                ${remaining} Remaining
            </div>
        </div>
    `;
}

function formatMaterial(line) {
    const code = line.material_code ?? "";
    const name = line.material_name ?? "";

    if (code && name) return `${code} - ${name}`;
    if (name) return name;
    if (code) return code;

    return `Material ID: ${line.material_id ?? ""}`;
}

function formatClassification(line) {
    const category = line.category_name ?? "";
    const subcategory = line.subcategory_name ?? "";

    if (category && subcategory) return `${category} (${subcategory})`;
    if (category) return category;
    if (subcategory) return subcategory;

    return "-";
}

function formatNumber(value) {
    const number = Number(value ?? 0);

    if (Number.isNaN(number)) return "0";

    return number.toLocaleString(undefined, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 4
    });
}

function formatDate(value) {
    if (!value) return "-";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "-";

    return date.toLocaleDateString();
}

function escapeHtml(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}