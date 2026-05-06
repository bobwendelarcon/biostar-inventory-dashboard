
let savedPtpId = null;
let cachedCategories = [];

let ptpCurrentPage = 1;
let ptpPageSize = 50;
let ptpTotalPages = 1;
let ptpTotalRecords = 0;

document.addEventListener("DOMContentLoaded", function () {
    setDefaultDate();
    loadCategoriesForManual();

    document.getElementById("ptpPrevBtn")?.addEventListener("click", function () {
        if (ptpCurrentPage > 1) {
            ptpCurrentPage--;
            loadPtpTracking();
        }
    });

    document.getElementById("ptpNextBtn")?.addEventListener("click", function () {
        if (ptpCurrentPage < ptpTotalPages) {
            ptpCurrentPage++;
            loadPtpTracking();
        }
    });

    document.getElementById("btnLoadShortages")?.addEventListener("click", loadPlanningShortages);
    document.getElementById("btnAddManualLine")?.addEventListener("click", addManualLine);
    document.getElementById("btnSavePtp")?.addEventListener("click", savePtpRequest);
    document.getElementById("btnPrintPtp")?.addEventListener("click", printPtpRequest);
    document.getElementById("btnRefreshPtpList")?.addEventListener("click", loadPtpTracking);
    document.getElementById("btnSubmitProduce")?.addEventListener("click", submitProduceStock);

    document.getElementById("ptpSearchInput")
        ?.addEventListener("input", function () {
            ptpCurrentPage = 1;
            loadPtpTracking();
        });

    document.getElementById("ptpStatusFilter")
        ?.addEventListener("change", function () {
            ptpCurrentPage = 1;
            loadPtpTracking();
        });


    document.getElementById("btnClearPtpFilter")
        ?.addEventListener("click", function () {
            document.getElementById("ptpSearchInput").value = "";
            document.getElementById("ptpStatusFilter").value = "ACTIVE";

            ptpCurrentPage = 1;
            loadPtpTracking();
        });


    loadPtpTracking();

    setInterval(updateRunningTimes, 60000);

    setInterval(() => {
        const produceModalOpen = document
            .getElementById("produceModal")
            ?.classList.contains("show");

        if (!produceModalOpen) {
            loadPtpTracking();
        }
    }, 5000);

    const role = String(window.currentUserRole || "").trim().toUpperCase();

    if (role === "PRODUCTION") {
        // hide create tab button
        const createTabBtn = document.getElementById("create-tab");
        if (createTabBtn) createTabBtn.style.display = "none";

        // hide create tab content
        const createTab = document.getElementById("createTab");
        if (createTab) createTab.style.display = "none";

        // auto switch to tracking tab
        const trackingTabBtn = document.getElementById("tracking-tab");
        if (trackingTabBtn) trackingTabBtn.click();
    }


    document.addEventListener("click", function (e) {
        const removeBtn = e.target.closest(".btn-remove-line");
        if (removeBtn) {
            removeBtn.closest("tr")?.remove();
            refreshEmptyRow();
            return;
        }

        const viewBtn = e.target.closest(".btn-view-ptp");
        if (viewBtn) {
            viewPtpRequest(viewBtn.dataset.ptpId);
            return;
        }

        const deleteBtn = e.target.closest(".btn-delete-ptp");
        if (deleteBtn) {
            deletePtpLine(deleteBtn.dataset.ptpLineId);
            return;
        }

        const startBtn = e.target.closest(".btn-start-ptp");
        if (startBtn) {
            startProduction(startBtn.dataset.ptpLineId);
            return;
        }

        const produceBtn = e.target.closest(".btn-produce-ptp");
        if (produceBtn) {
            openProduceModal(produceBtn.dataset.ptpLineId);
            return;
        }
    });
});


async function openProduceModal(ptpLineId) {
    if (!ptpLineId) return;

    initMonthYearDropdowns();

    document.getElementById("producePtpLineId").value = ptpLineId;
    document.getElementById("produceQty").value = "";
    document.getElementById("produceLotNo").value = "";
    document.getElementById("produceTransmittalNo").value = "";

    const phDate = new Date(
        new Date().toLocaleString("en-US", {
            timeZone: "Asia/Manila"
        })
    );

    const currentMonth = String(phDate.getMonth() + 1).padStart(2, "0");
    const currentYear = String(phDate.getFullYear());
    //const expYear = String(phDate.getFullYear() + 1);
    const expYear = currentYear;

    // MFG = current PH month/year
    document.getElementById("produceMfgMonth").value = currentMonth;
    document.getElementById("produceMfgYear").value = currentYear;

    // EXP = current PH month + next year
    document.getElementById("produceExpMonth").value = currentMonth;
    document.getElementById("produceExpYear").value = expYear;

    await loadProduceWarehouses();

    new bootstrap.Modal(document.getElementById("produceModal")).show();
}

function renderPtpSummaryFromResponse(data) {
    document.getElementById("cardPending").textContent = data.pending || 0;
    document.getElementById("cardOngoing").textContent = data.ongoing || 0;
    document.getElementById("cardPartial").textContent = data.partial || 0;
    document.getElementById("cardCompletedToday").textContent = data.completed || 0;
}

let cachedPtpList = [];

async function loadPtpTracking() {
    try {
        const search = document.getElementById("ptpSearchInput")?.value.trim() || "";
        const status = document.getElementById("ptpStatusFilter")?.value || "ACTIVE";

        const response = await fetch(
            `/ProductToProduce/List?page=${ptpCurrentPage}&pageSize=${ptpPageSize}&status=${encodeURIComponent(status)}&search=${encodeURIComponent(search)}`
        );

        if (!response.ok) throw new Error(await response.text());

        const data = await response.json();
        ptpCurrentPage = Number(data.page || ptpCurrentPage);
        ptpPageSize = Number(data.pageSize || ptpPageSize);
        ptpTotalRecords = Number(data.totalRecords || 0);
        ptpTotalPages = Number(data.totalPages || 1);
        cachedPtpList = data.items || [];

        renderPtpTracking(cachedPtpList);
        renderPtpSummaryFromResponse(data);
        renderPtpPagination();

    } catch (err) {
        console.error(err);
        document.getElementById("ptpTrackingBody").innerHTML = `
            <tr>
                <td colspan="10" class="text-center text-danger py-4">
                    Failed to load PTP tracking.
                </td>
            </tr>
        `;
    }
}

function renderPtpPagination() {

    const rangeText = document.getElementById("ptpRangeText");

    const prevBtn = document.getElementById("ptpPrevBtn");

    const nextBtn = document.getElementById("ptpNextBtn");

    const start = ptpTotalRecords === 0
        ? 0
        : ((ptpCurrentPage - 1) * ptpPageSize) + 1;

    const end = Math.min(
        ptpCurrentPage * ptpPageSize,
        ptpTotalRecords
    );

    if (rangeText) {
        rangeText.textContent = `${start}-${end} of ${ptpTotalRecords}`;
    }

    if (prevBtn) {
        prevBtn.disabled = ptpCurrentPage <= 1;
    }

    if (nextBtn) {
        nextBtn.disabled = ptpCurrentPage >= ptpTotalPages;
    }
}

async function loadProduceWarehouses() {
    const select = document.getElementById("produceBranch");
    if (!select) return;

    select.innerHTML = `<option value="">Loading...</option>`;

    try {
        const res = await fetch("/Inventory/GetBranches");

        if (!res.ok) throw new Error(await res.text());

        const data = await res.json();

        select.innerHTML = `<option value="">Select Warehouse</option>`;

        data.forEach(b => {
            select.innerHTML += `
                <option value="${safe(b.branch_id || b.branchId || "")}">
                    ${safe(b.branch_name || b.branchName || b.branch_id || "")}
                </option>
            `;
        });

    } catch (err) {
        console.error(err);
        select.innerHTML = `<option value="">Failed to load warehouses</option>`;
    }
}
function initMonthYearDropdowns() {
    const months = [
        "01", "02", "03", "04", "05", "06",
        "07", "08", "09", "10", "11", "12"
    ];

    const now = new Date();
    const currentYear = now.getFullYear();

    const yearStart = currentYear - 2;
    const yearEnd = currentYear + 5;

    const monthSelects = [
        document.getElementById("produceMfgMonth"),
        document.getElementById("produceExpMonth")
    ];

    const yearSelects = [
        document.getElementById("produceMfgYear"),
        document.getElementById("produceExpYear")
    ];

    // months
    monthSelects.forEach(select => {
        select.innerHTML = `<option value="">MM</option>`;
        months.forEach(m => {
            select.innerHTML += `<option value="${m}">${m}</option>`;
        });
    });

    // years
    yearSelects.forEach(select => {
        select.innerHTML = `<option value="">YYYY</option>`;
        for (let y = yearStart; y <= yearEnd; y++) {
            select.innerHTML += `<option value="${y}">${y}</option>`;
        }
    });
}
function buildDateFromMonthYear(month, year, isEnd = false) {
    if (!month || !year) return null;

    if (!isEnd) {
        return `${year}-${month}-01`;
    }

    const lastDay = new Date(Number(year), Number(month), 0).getDate();
    return `${year}-${month}-${lastDay}`;
}

async function submitProduceStock() {
    const ptpLineId = Number(document.getElementById("producePtpLineId").value || 0);
    const quantity = Number(document.getElementById("produceQty").value || 0);
    const branchId = document.getElementById("produceBranch").value;
    const lotNo = document.getElementById("produceLotNo").value.trim();
    const transmittalNo = document.getElementById("produceTransmittalNo").value.trim();

    const mfgMonth = document.getElementById("produceMfgMonth").value;
    const mfgYear = document.getElementById("produceMfgYear").value;
    const expMonth = document.getElementById("produceExpMonth").value;
    const expYear = document.getElementById("produceExpYear").value;

    const manufacturingDate = buildDateFromMonthYear(mfgMonth, mfgYear, false);
    const expirationDate = buildDateFromMonthYear(expMonth, expYear, true);

    if (!transmittalNo) {
        alert("Transmittal No. is required.");
        return;
    }

    if (!ptpLineId) {
        alert("Invalid PTP line.");
        return;
    }

    if (quantity <= 0) {
        alert("Produced quantity must be greater than 0.");
        return;
    }

    if (!branchId) {
        alert("Please select warehouse.");
        return;
    }

    if (!lotNo) {
        alert("Lot No is required.");
        return;
    }

    if (!manufacturingDate) {
        alert("MFG month and year are required.");
        return;
    }

    if (!expirationDate) {
        alert("EXP month and year are required.");
        return;
    }

    try {
        const response = await fetch("/ProductToProduce/Produce", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                ptpLineId,
                quantity,
                branchId,
                lotNo,
                transmittalNo,
                manufacturingDate,
                expirationDate
            })
        });

        if (!response.ok) throw new Error(await response.text());

        const result = await response.json();

        bootstrap.Modal.getInstance(document.getElementById("produceModal"))?.hide();

        alert(result.message || "Production stock recorded successfully.");
        await loadPtpTracking();

    } catch (err) {
        console.error(err);
        alert("Failed to save production stock: " + err.message);
    }
}

function renderPtpTracking(items) {
    const tbody = document.getElementById("ptpTrackingBody");

    if (!items || items.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="12" class="text-center text-muted py-4">No PTP requests found.</td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = "";

    items.forEach(item => {
        const status = normalizeStatus(item.status);
        const requiredQty = Number(item.requiredQty || item.requested_qty || 0);
        const producedQty = Number(item.producedQty || item.produced_qty || 0);
        const remainingQty = Math.max(requiredQty - producedQty, 0);

        tbody.insertAdjacentHTML("beforeend", `
            <tr data-started-at="${safe(item.startedAt || item.started_at || "")}"
                data-completed-at="${safe(item.completedAt || item.completed_at || "")}"
                data-status="${safe(status)}">

                <td class="fw-semibold">${safe(item.ptpNo || item.ptp_no || "")}</td>

                <td>
                    <div class="fw-semibold">${safe(item.productName || item.product_name || "")}</div>
                    <small class="text-muted">${safe(item.productId || item.product_id || "")}</small>
                </td>

                <td>
                    ${safe(item.remarks || "-")}
                </td>

                <td>${formatQty(requiredQty)} ${safe(item.uom || "")}</td>

                <td>
                    <div class="fw-semibold">${formatQty(producedQty)} / ${formatQty(requiredQty)} ${safe(item.uom || "")}</div>
                    ${renderProgressBar(requiredQty, producedQty)}
                </td>

                <td>${formatQty(remainingQty)} ${safe(item.uom || "")}</td>

                <td>${renderStatusBadge(status)}</td>

                <td>
                    ${formatDate(item.requestedDate || item.requested_date)}
                </td>

                <td>${formatDateTime(item.startedAt || item.started_at)}</td>

                <td class="running-time">${getRunningTimeText(item.startedAt || item.started_at, item.completedAt || item.completed_at, status)}</td>

                <td>${safe(item.createdBy || item.created_by || item.requestedBy || item.requested_by || "")}</td>

                <td class="text-center">
    <div class="d-flex gap-1 justify-content-center">

        <button type="button"
                class="btn btn-outline-primary btn-sm btn-view-ptp"
                data-ptp-id="${safe(item.ptpId || item.ptp_id || "")}">
            View
        </button>

        ${canStartProduction(status) ? `
            <button type="button"
                    class="btn btn-outline-success btn-sm btn-start-ptp"
                    data-ptp-line-id="${safe(item.ptpLineId || item.ptp_line_id || "")}">
                Start
            </button>
        ` : ""}

        ${canProduceStock(status) ? `
            <button type="button"
                    class="btn btn-outline-warning btn-sm btn-produce-ptp"
                    data-ptp-line-id="${safe(item.ptpLineId || item.ptp_line_id || "")}">
                Produce
            </button>
        ` : ""}

        ${canDeletePtp(status) ? `
            <button type="button"
                    class="btn btn-outline-danger btn-sm btn-delete-ptp"
                    data-ptp-line-id="${safe(item.ptpLineId || item.ptp_line_id || "")}">
                Delete
            </button>
        ` : ""}
    </div>
</td>


            </tr>
        `);
    });
}

function canStartProduction(status) {
    const role = String(window.currentUserRole || "").trim().toUpperCase();
    return role === "PRODUCTION" && normalizeStatus(status) === "PENDING";
}

function canProduceStock(status) {
    const role = String(window.currentUserRole || "").trim().toUpperCase();
    const s = normalizeStatus(status);

    return role === "PRODUCTION" &&
        (s === "IN_PROGRESS" || s === "PARTIAL");
}
function canDeletePtp(status) {
    const role = String(window.currentUserRole || "").toUpperCase();

    console.log("CURRENT ROLE:", role, "STATUS:", status);

    if (role === "PRODUCTION" || role === "PRODUCT")
        return false;

    return normalizeStatus(status) === "PENDING";
}
function renderPtpSummary(items) {
    document.getElementById("cardPending").textContent =
        items.filter(x => normalizeStatus(x.status) === "PENDING").length;

    document.getElementById("cardOngoing").textContent =
        items.filter(x => normalizeStatus(x.status) === "IN_PROGRESS").length;

    document.getElementById("cardPartial").textContent =
        items.filter(x => normalizeStatus(x.status) === "PARTIAL").length;

    document.getElementById("cardCompletedToday").textContent =
        items.filter(x => normalizeStatus(x.status) === "COMPLETED" && isToday(x.completedAt || x.completed_at)).length;
}

function renderStatusBadge(status) {
    if (status === "PENDING")
        return `<span class="badge bg-secondary status-badge">PENDING</span>`;

    if (status === "IN_PROGRESS")
        return `<span class="badge bg-primary status-badge">ONGOING</span>`;

    if (status === "PARTIAL")
        return `<span class="badge bg-warning text-dark status-badge">PARTIAL</span>`;

    if (status === "COMPLETED")
        return `<span class="badge bg-success status-badge">COMPLETED</span>`;

    if (status === "CANCELLED")
        return `<span class="badge bg-danger status-badge">CANCELLED</span>`;

    return `<span class="badge bg-secondary status-badge">${safe(status)}</span>`;
}

function normalizeStatus(status) {
    return String(status || "PENDING").trim().toUpperCase();
}
function renderProgressBar(requiredQty, producedQty) {
    const percent = requiredQty > 0 ? Math.min((producedQty / requiredQty) * 100, 100) : 0;

    return `
        <div class="progress mt-1" style="height: 6px;">
            <div class="progress-bar" style="width:${percent}%"></div>
        </div>
    `;
}

function updateRunningTimes() {
    document.querySelectorAll("#ptpTrackingBody tr[data-status]").forEach(row => {
        const startedAt = row.dataset.startedAt;
        const completedAt = row.dataset.completedAt;
        const status = row.dataset.status;

        const cell = row.querySelector(".running-time");
        if (cell) {
            cell.textContent = getRunningTimeText(startedAt, completedAt, status);
        }
    });
}

function parseUtcDate(dateStr) {
    if (!dateStr) return null;

    let value = String(dateStr).replace(" ", "T");

    if (!value.endsWith("Z") && !value.includes("+")) {
        value += "Z";
    }

    const date = new Date(value);
    return isNaN(date.getTime()) ? null : date;
}

function getRunningTimeText(startedAt, completedAt, status) {
    if (!startedAt) return "-";

    const start = parseUtcDate(startedAt);
    if (isNaN(start.getTime())) return "-";

    let end;

    if (status === "COMPLETED" && completedAt) {
        end = parseUtcDate(completedAt);
    } else {
        end = new Date();
    }

    const diffMs = end - start;
    if (diffMs < 0) return "-";

    const totalMinutes = Math.floor(diffMs / 60000);
    const days = Math.floor(totalMinutes / 1440);
    const hours = Math.floor((totalMinutes % 1440) / 60);
    const minutes = totalMinutes % 60;

    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
}

function formatDateTime(dateStr) {
    if (!dateStr) return "-";

    let value = String(dateStr).replace(" ", "T");

    // Treat backend DateTime as UTC if no timezone included
    if (!value.endsWith("Z") && !value.includes("+")) {
        value += "Z";
    }

    const date = new Date(value);
    if (isNaN(date.getTime())) return "-";

    return date.toLocaleString("en-US", {
        timeZone: "Asia/Manila",
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "numeric",
        minute: "2-digit",
        hour12: true
    });
}

function isToday(dateStr) {
    if (!dateStr) return false;

    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return false;

    const today = new Date();

    return date.getFullYear() === today.getFullYear()
        && date.getMonth() === today.getMonth()
        && date.getDate() === today.getDate();
}


async function loadCategoriesForManual() {
    try {
        const response = await fetch("/Categories/GetCategories");

        if (!response.ok) throw new Error(await response.text());

        const data = await response.json();

        cachedCategories = Array.isArray(data) ? data : data.items || [];

    } catch (err) {
        console.error(err);
        cachedCategories = [];
        alert("Failed to load categories.");
    }
}

function setDefaultDate() {
    const input = document.getElementById("requestedDate");
    if (!input) return;

    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");

    input.value = `${yyyy}-${mm}-${dd}`;
}

async function loadPlanningShortages() {
    try {
        const response = await fetch("/ProductToProduce/GetPlanningShortages");
        if (!response.ok) throw new Error(await response.text());

        const data = await response.json();

        if (!data || data.length === 0) {
            alert("No planning shortages found.");
            return;
        }

        clearEmptyRow();

        data.forEach(item => {
            addLine({
                productId: item.productId,
                productName: item.productName,
                suggestedQty: item.shortageQty,
                qtyInput: item.shortageQty,
                requestedQty: item.shortageQty,
                uom: item.uom,
                packUom: item.packUom,
                packQty: item.packQty,
                deliveryDate: document.getElementById("requestedDate").value,
                remarks: "",
                sourceType: "PLANNING",
                readonlyProduct: true
            });
        });

    } catch (err) {
        console.error(err);
        alert("Failed to load planning shortages.");
    }
}

function addManualLine() {
    clearEmptyRow();

    addLine({
        productId: "",
        productName: "",
        suggestedQty: 0,
        qtyInput: 0,
        requestedQty: 0,
        uom: "",
        packUom: "",
        packQty: 0,
        deliveryDate: document.getElementById("requestedDate").value,
        remarks: "",
        sourceType: "MANUAL",
        readonlyProduct: false
    });
}

function addLine(line) {
    const tbody = document.getElementById("ptpLinesBody");

    const categoryOptions = cachedCategories.map(c => `
    <option value="${safe(c.catg_id || c.catgId || "")}">
        ${safe(c.catg_name || c.catgName || "")}
    </option>
`).join("");

    const productCell = line.readonlyProduct
        ? `
        <div class="fw-semibold">${safe(line.productName)}</div>
        <small class="text-muted">${safe(line.productId)}</small>
        <input type="hidden" class="line-product-id" value="${safe(line.productId)}" />
        <input type="hidden" class="line-product-name" value="${safe(line.productName)}" />
    `
        : `
        <select class="form-select mb-1 line-category-select">
            <option value="">Select Category</option>
            ${categoryOptions}
        </select>

        <select class="form-select line-product-select">
            <option value="">Select Product</option>
        </select>

        <input type="hidden" class="line-product-id" value="" />
        <input type="hidden" class="line-product-name" value="" />
    `;

    const hasPack = line.packUom && Number(line.packQty || 0) > 0;

    tbody.insertAdjacentHTML("beforeend", `
        <tr>
            <td>${productCell}</td>

            <td>
                <input type="number"
                       class="form-control line-suggested-qty"
                       value="${Number(line.suggestedQty || 0)}"
                       readonly />
                <small class="text-muted">${safe(line.uom || "")}</small>

                <input type="hidden" class="line-uom" value="${safe(line.uom || "")}" />
                <input type="hidden" class="line-base-uom" value="${safe(line.uom || "")}" />
                <input type="hidden" class="line-pack-uom" value="${safe(line.packUom || "")}" />
                <input type="hidden" class="line-pack-qty" value="${Number(line.packQty || 0)}" />
                <input type="hidden" class="line-requested-qty" value="${Number(line.requestedQty || 0)}" />
            </td>

            <td>
                <input type="number"
                       class="form-control line-qty-input"
                       min="0"
                       step="0.01"
                       value="${Number(line.qtyInput || line.requestedQty || 0)}" />
            </td>

            <td>
                <select class="form-select line-uom-type">
                    <option value="BASE">Base (${safe(line.uom || "")})</option>
                    ${hasPack ? `<option value="PACK">Pack (${safe(line.packUom)})</option>` : ""}
                </select>
                ${hasPack
            ? `<small class="text-muted">1 ${safe(line.packUom)} = ${formatQty(line.packQty)} ${safe(line.uom || "")}</small>`
            : `<small class="text-muted">No pack setup</small>`
        }
            </td>

            <td>
                <div class="fw-semibold line-base-display"></div>
            </td>

            <td>
                <input type="date"
                       class="form-control line-delivery-date"
                       value="${safe(line.deliveryDate || "")}" />
            </td>

            <td>
                <input type="text"
                       class="form-control line-remarks"
                       value="${safe(line.remarks || "")}"
                       placeholder="Remarks" />
            </td>

            <td>
                <span class="badge ${line.sourceType === "PLANNING" ? "bg-primary" : "bg-secondary"}">
                    ${safe(line.sourceType)}
                </span>
                <input type="hidden" class="line-source-type" value="${safe(line.sourceType)}" />
            </td>

            <td class="text-center">
                <button type="button" class="btn btn-outline-danger btn-sm btn-remove-line">
                    Remove
                </button>
            </td>
        </tr>
    `);

    const row = tbody.lastElementChild;
    bindPtpQtyConversion(row);
    if (!line.readonlyProduct) {
        bindManualProductDropdown(row);
    }
   
}
function convertMonthToDate(value, isEnd = false) {
    if (!value) return null;

    const [year, month] = value.split("-");

    if (!year || !month) return null;

    // Start of month OR end of month
    if (!isEnd) {
        return `${year}-${month}-01`;
    } else {
        // last day of month
        const lastDay = new Date(year, month, 0).getDate();
        return `${year}-${month}-${lastDay}`;
    }
}
function bindPtpQtyConversion(row) {
    const qtyInput = row.querySelector(".line-qty-input");
    const uomType = row.querySelector(".line-uom-type");

    function recalc() {
        const qty = Number(qtyInput.value || 0);
        const type = uomType.value || "BASE";

        const packQty = Number(row.querySelector(".line-pack-qty")?.value || 0);
        const baseUom = row.querySelector(".line-base-uom")?.value || "";
        const packUom = row.querySelector(".line-pack-uom")?.value || "";

        let baseQty = qty;

        if (type === "PACK") {
            if (packQty <= 0) {
                baseQty = 0;
            } else {
                baseQty = qty * packQty;
            }
        }

        row.querySelector(".line-requested-qty").value = baseQty;

        let display = `${formatQty(baseQty)} ${baseUom}`.trim();

        if (type === "PACK" && packQty > 0) {
            display += `<br><small class="text-muted">${formatQty(qty)} ${packUom}</small>`;
        }

        row.querySelector(".line-base-display").innerHTML = display;
    }

    qtyInput.addEventListener("input", recalc);
    uomType.addEventListener("change", recalc);

    recalc();
}

async function savePtpRequest() {
    const rows = Array.from(document.querySelectorAll("#ptpLinesBody tr"))
        .filter(row => !row.querySelector("td[colspan]"));

    if (rows.length === 0) {
        alert("Please add at least one product.");
        return;
    }

    const lines = rows.map(row => {
        return {
            productId: row.querySelector(".line-product-id")?.value.trim() || "",
            productName: row.querySelector(".line-product-name")?.value.trim() || "",

            suggestedQty: Number(row.querySelector(".line-suggested-qty")?.value || 0),

            qtyInput: Number(row.querySelector(".line-qty-input")?.value || 0),
            uomType: row.querySelector(".line-uom-type")?.value || "BASE",

            // final BASE qty
            requestedQty: Number(row.querySelector(".line-requested-qty")?.value || 0),

            uom: row.querySelector(".line-uom")?.value || "",
            packUom: row.querySelector(".line-pack-uom")?.value || "",
            packQty: Number(row.querySelector(".line-pack-qty")?.value || 0),

            deliveryDate: row.querySelector(".line-delivery-date")?.value || null,
            remarks: row.querySelector(".line-remarks")?.value.trim() || "",
            sourceType: row.querySelector(".line-source-type")?.value || "MANUAL"
        };
    }).filter(x => x.productId && x.productName && x.requestedQty > 0);

    if (lines.length === 0) {
        alert("Please complete at least one valid line.");
        return;
    }

    const payload = {
        requestedDate: document.getElementById("requestedDate").value,
        remarks: document.getElementById("headerRemarks").value.trim(),
        createdBy: document.getElementById("createdBy").value,
        lines
    };

    try {
        const response = await fetch("/ProductToProduce/Create", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) throw new Error(await response.text());

        const result = await response.json();

        savedPtpId = result.ptpId;

        document.getElementById("btnPrintPtp").disabled = false;

        alert(result.message || "PTP request saved.");

        // clear form
        document.getElementById("headerRemarks").value = "";

        setDefaultDate();

        const tbody = document.getElementById("ptpLinesBody");

        tbody.innerHTML = `
    <tr>
        <td colspan="9" class="text-center text-muted py-4">
            No products added yet.
        </td>
    </tr>
`;

    } catch (err) {
        console.error(err);
        alert("Failed to save PTP request: " + err.message);
    }
}


function bindManualProductDropdown(row) {
    const categorySelect = row.querySelector(".line-category-select");
    const productSelect = row.querySelector(".line-product-select");

    if (!categorySelect || !productSelect) return;

    categorySelect.addEventListener("change", async function () {
        const categoryId = this.value;

        productSelect.innerHTML = `<option value="">Loading...</option>`;

        row.querySelector(".line-product-id").value = "";
        row.querySelector(".line-product-name").value = "";

        if (!categoryId) {
            productSelect.innerHTML = `<option value="">Select Product</option>`;
            return;
        }

        try {
            const response = await fetch(`/Product/GetProductsLookup?categoryId=${encodeURIComponent(categoryId)}`);

            if (!response.ok) throw new Error(await response.text());

            const products = await response.json();

            productSelect.innerHTML = `<option value="">Select Product</option>`;

            products.forEach(p => {
                productSelect.insertAdjacentHTML("beforeend", `
                    <option
                        value="${safe(p.productId || p.product_id || "")}"
                        data-name="${safe(p.productName || p.product_name || "")}"
                        data-uom="${safe(p.uom || "")}"
                        data-pack-uom="${safe(p.packUom || p.pack_uom || "")}"
                        data-pack-qty="${Number(p.packQty || p.pack_qty || 0)}">
                        ${safe(p.productName || p.product_name || "")}
                    </option>
                `);
            });

        } catch (err) {
            console.error(err);
            productSelect.innerHTML = `<option value="">Failed to load products</option>`;
        }
    });

    productSelect.addEventListener("change", function () {
        const opt = this.options[this.selectedIndex];

        const productId = opt.value || "";
        const productName = opt.dataset.name || "";
        const uom = opt.dataset.uom || "";
        const packUom = opt.dataset.packUom || "";
        const packQty = Number(opt.dataset.packQty || 0);

        row.querySelector(".line-product-id").value = productId;
        row.querySelector(".line-product-name").value = productName;

        row.querySelector(".line-uom").value = uom;
        row.querySelector(".line-base-uom").value = uom;
        row.querySelector(".line-pack-uom").value = packUom;
        row.querySelector(".line-pack-qty").value = packQty;

        const uomSmall = row.querySelector(".line-suggested-qty")?.closest("td")?.querySelector("small");
        if (uomSmall) uomSmall.textContent = uom;

        const uomType = row.querySelector(".line-uom-type");
        const hasPack = packUom && packQty > 0;

        uomType.innerHTML = `
            <option value="BASE">Base (${safe(uom)})</option>
            ${hasPack ? `<option value="PACK">Pack (${safe(packUom)})</option>` : ""}
        `;

        const uomTypeSmall = uomType.closest("td").querySelector("small");
        if (uomTypeSmall) {
            uomTypeSmall.innerHTML = hasPack
                ? `1 ${safe(packUom)} = ${formatQty(packQty)} ${safe(uom)}`
                : `No pack setup`;
        }

        row.querySelector(".line-qty-input").dispatchEvent(new Event("input"));
    });
}
async function printPtpRequest() {
    if (!savedPtpId) {
        alert("Save the request first before printing.");
        return;
    }

    try {
        const response = await fetch(`/ProductToProduce/GetById?id=${savedPtpId}`);
        if (!response.ok) throw new Error(await response.text());

        const data = await response.json();

        const rows = (data.lines || []).map((line, index) => {
            const packText =
                line.uom_type === "PACK" && line.pack_qty > 0
                    ? `<br><small>${formatQty(line.qty_input)} ${safe(line.pack_uom || "")}</small>`
                    : "";

            return `
                <tr>
                    <td>${index + 1}</td>
                    <td>${safe(line.product_name)}</td>
                    <td class="text-end">
                        ${formatQty(line.requested_qty)} ${safe(line.uom || "")}
                        ${packText}
                    </td>
                    <td>${formatDate(line.delivery_date)}</td>
                    <td>${safe(line.remarks || "")}</td>
                </tr>
            `;
        }).join("");

        const html = `
            <div class="print-document">
                <h3 class="text-center">PRODUCT TO PRODUCE REQUEST</h3>

                <div class="print-meta">
                    <div><b>PTP No:</b> ${safe(data.ptp_no)}</div>
                    <div><b>Requested Date:</b> ${formatDate(data.requested_date)}</div>
                    <div><b>Status:</b> ${safe(data.status)}</div>
                    <div><b>Created By:</b> ${safe(data.created_by || "")}</div>
                </div>

                <table class="print-table">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Product Name</th>
                            <th>Quantity</th>
                            <th>Delivery Date</th>
                            <th>Remarks</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rows}
                    </tbody>
                </table>

                <div class="signature-area">
                    <div>Prepared By: ____________________</div>
                    <div>Approved By: ____________________</div>
                    <div>Received By Production: ____________________</div>
                </div>
            </div>
        `;

        const printArea = document.getElementById("printArea");
        printArea.innerHTML = html;
        printArea.classList.remove("d-none");

        window.print();

        printArea.classList.add("d-none");

    } catch (err) {
        console.error(err);
        alert("Failed to print PTP request: " + err.message);
    }
}

function clearEmptyRow() {
    const tbody = document.getElementById("ptpLinesBody");
    const emptyRow = tbody.querySelector("td[colspan]");
    if (emptyRow) tbody.innerHTML = "";
}

function refreshEmptyRow() {
    const tbody = document.getElementById("ptpLinesBody");
    const rows = tbody.querySelectorAll("tr");

    if (rows.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9" class="text-center text-muted py-4">No products added yet.</td>
            </tr>
        `;
    }
}

function formatQty(value) {
    return Number(value || 0).toLocaleString("en-US", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    });
}

function formatDate(dateStr) {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "";

    return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric"
    });
}

function safe(value) {
    if (value === null || value === undefined) return "";
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function applyPtpFilters() {

    const searchText = String(
        document.getElementById("ptpSearchInput")?.value || ""
    ).trim().toLowerCase();

    const statusFilter = String(
        document.getElementById("ptpStatusFilter")?.value || "ACTIVE"
    ).trim().toUpperCase();

    let filtered = [...cachedPtpList];

    // All (exc Completed)
    if (statusFilter === "ACTIVE") {

        filtered = filtered.filter(item => {

            const s = normalizeStatus(item.status);

            return s !== "COMPLETED"
                && s !== "CANCELLED";
        });
    }

    // All (inc Completed)
    else if (statusFilter === "ALL") {

        // no filtering
    }

    // Specific Status
    else {

        filtered = filtered.filter(item =>
            normalizeStatus(item.status) === statusFilter
        );
    }

    // Search
    if (searchText) {

        filtered = filtered.filter(item => {

            const text = [
                item.ptpNo,
                item.ptp_no,
                item.productName,
                item.product_name,
                item.productId,
                item.product_id,
                item.createdBy,
                item.created_by,
                item.requestedBy,
                item.requested_by
            ]
                .join(" ")
                .toLowerCase();

            return text.includes(searchText);
        });
    }

    renderPtpTracking(filtered);
}

async function viewPtpRequest(ptpId) {
    if (!ptpId) return;

    try {
        const response = await fetch(`/ProductToProduce/GetById?id=${encodeURIComponent(ptpId)}`);

        if (!response.ok) throw new Error(await response.text());

        const data = await response.json();

        alert(
            `PTP No: ${data.ptp_no || data.ptpNo || ""}\n` +
            `Status: ${data.status || ""}\n` +
            `Created By: ${data.created_by || data.createdBy || ""}\n` +
            `Remarks: ${data.remarks || ""}`
        );

    } catch (err) {
        console.error(err);
        alert("Failed to load PTP details: " + err.message);
    }
}
async function startProduction(ptpLineId) {
    if (!ptpLineId) return;

    if (!confirm("Start production for this item?")) return;

    try {
        const response = await fetch(`/ProductToProduce/StartLine?ptpLineId=${ptpLineId}`, {
            method: "POST"
        });

        if (!response.ok) throw new Error(await response.text());

        alert("Production started.");
        await loadPtpTracking();

    } catch (err) {
        console.error(err);
        alert("Failed to start production: " + err.message);
    }
}

async function deletePtpLine(ptpLineId) {
    if (!ptpLineId) return;

    if (!confirm("Delete this pending PTP request?")) return;

    try {
        const response = await fetch(`/ProductToProduce/DeleteLine?ptpLineId=${encodeURIComponent(ptpLineId)}`, {
            method: "DELETE"
        });

        if (!response.ok) throw new Error(await response.text());

        const result = await response.json();

        alert(result.message || "PTP deleted.");
        await loadPtpTracking();

    } catch (err) {
        console.error(err);
        alert("Failed to delete PTP: " + err.message);
    }
}
function canDeletePtp(status) {
    const role = String(window.currentUserRole || "").trim().toUpperCase();
    const cleanStatus = normalizeStatus(status);

    console.log("ROLE:", role, "STATUS:", cleanStatus);

    if (role === "PRODUCTION" || role === "PRODUCT" || role === "WAREHOUSE")
        return false;

    return cleanStatus === "PENDING";
}
