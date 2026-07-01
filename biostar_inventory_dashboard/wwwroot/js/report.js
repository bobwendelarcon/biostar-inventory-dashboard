let currentReport = "delivery";
let currentPage = 1;
let pageSize = 25;
let lastReportData = null;

const API_BASE = "";


document.addEventListener("DOMContentLoaded", async function () {
    bindEvents();
    setPrintDate();
    setDefaultDateFilters();

    await loadDropdowns();
    await loadCurrentReport();
});

function setDefaultDateFilters() {
    const today = new Date();

    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);

    document.getElementById("dateFrom").value = formatDateInput(firstDay);
    document.getElementById("dateTo").value = formatDateInput(today);
}

function formatDateInput(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function bindEvents() {
    document.querySelectorAll("#reportTabs .nav-link").forEach(btn => {
        btn.addEventListener("click", async function () {
            document.querySelectorAll("#reportTabs .nav-link").forEach(x => x.classList.remove("active"));
            this.classList.add("active");

            currentReport = this.dataset.report;
            currentPage = 1;
            toggleFilters();
            await loadCurrentReport();
        });

    });

    document.getElementById("btnLoadReport").addEventListener("click", async function () {
        currentPage = 1;
        await loadCurrentReport();
    });

    document.getElementById("btnResetFilters").addEventListener("click", async function () {
        document.querySelectorAll("input, select").forEach(el => {
            if (el.id !== "") el.value = "";
        });
        currentPage = 1;

        await loadCurrentReport();
    });

    document.getElementById("pageSizeSelect").addEventListener("change", async function () {
        pageSize = Number(this.value);
        currentPage = 1;
        await loadCurrentReport();
    });

    document.getElementById("btnFirstPage").addEventListener("click", async function () {
        currentPage = 1;
        await loadCurrentReport();
    });

    document.getElementById("btnPrevPage").addEventListener("click", async function () {
        if (currentPage > 1) {
            currentPage--;
            await loadCurrentReport();
        }
    });

    document.getElementById("btnNextPage").addEventListener("click", async function () {
        if (lastReportData?.hasNext) {
            currentPage++;
            await loadCurrentReport();
        }
    });

    document.getElementById("btnLastPage").addEventListener("click", async function () {
        currentPage = lastReportData?.totalPages || 1;
        await loadCurrentReport();
    });

    toggleFilters();
}



function toggleFilters() {
    const showDate = currentReport === "delivery" || currentReport === "returns";
    const showRegion = currentReport === "delivery";
    const showCustomer = currentReport === "delivery" || currentReport === "returns";
    const showProduct = currentReport === "expiry" || currentReport === "inventory";
    const showBranch = currentReport === "expiry" || currentReport === "inventory";
    const showExpiry = currentReport === "expiry" || currentReport === "inventory";
    const showStock = currentReport === "inventory";

    toggleField("dateFrom", showDate);
    toggleField("dateTo", showDate);
    toggleField("regionFilter", showRegion);
    toggleField("customerFilter", showCustomer);
    toggleField("productFilter", showProduct);
    toggleField("branchFilter", showBranch);
    toggleField("expiryStatusFilter", showExpiry);
    toggleField("stockStatusFilter", showStock);
}

function toggleField(id, show) {
    const el = document.getElementById(id);
    if (!el) return;

    const col = el.closest("[class*='col-']");
    if (col) col.style.display = show ? "" : "none";
}

async function loadDropdowns() {
    await Promise.all([
        loadBranches(),
        loadProducts(),
        loadCustomers()
    ]);
}

async function loadBranches() {
    try {
        const res = await fetch(`/Reports/Branches`)
        if (!res.ok) return;

        const data = await res.json();
        const select = document.getElementById("branchFilter");

        const items = Array.isArray(data) ? data : data.items || [];

        items.forEach(x => {
            select.innerHTML += `<option value="${safeAttr(x.branch_id)}">${safe(x.branch_name)}</option>`;
        });
    } catch (e) {
        console.warn("Branches not loaded", e);
    }
}

async function loadProducts() {
    try {
        const res = await fetch(`/Reports/Products`)
        if (!res.ok) return;

        const data = await res.json();
        const select = document.getElementById("productFilter");

        const items = Array.isArray(data) ? data : data.items || [];

        items.forEach(x => {
            select.innerHTML += `<option value="${safeAttr(x.product_id)}">${safe(x.product_name)}</option>`;
        });
    } catch (e) {
        console.warn("Products not loaded", e);
    }
}

async function loadCustomers() {
    try {
        const res = await fetch(`/Reports/Customers`)
        if (!res.ok) return;

        const data = await res.json();
        const select = document.getElementById("customerFilter");

        const items = Array.isArray(data) ? data : data.items || [];

        items
            .filter(x => !x.partner_type || String(x.partner_type).toUpperCase() === "CUSTOMER")
            .forEach(x => {
                select.innerHTML += `<option value="${safeAttr(x.partner_id)}">${safe(x.partner_name)}</option>`;
            });
    } catch (e) {
        console.warn("Customers not loaded", e);
    }
}

function getFilters() {
    const params = new URLSearchParams();

    addParam(params, "dateFrom", "dateFrom");
    addParam(params, "dateTo", "dateTo");
    addParam(params, "branchId", "branchFilter");
    addParam(params, "productId", "productFilter");
    addParam(params, "customerId", "customerFilter");
    addParam(params, "region", "regionFilter");
    addParam(params, "expiryStatus", "expiryStatusFilter");
    addParam(params, "stockStatus", "stockStatusFilter");

    params.append("page", currentPage);
    params.append("pageSize", pageSize);

    return params.toString();
}

function addParam(params, key, elementId) {
    const value = document.getElementById(elementId)?.value;
    if (value) params.append(key, value);
}

async function loadCurrentReport() {
    setLoading();

    const query = getFilters();

    let endpoint = "";

    if (currentReport === "delivery") endpoint = "DeliveryKpi";
    if (currentReport === "expiry") endpoint = "NearExpiry";
    if (currentReport === "returns") endpoint = "Returns";
    if (currentReport === "inventory") endpoint = "Inventory";

    try {
        const res = await fetch(`/Reports/${endpoint}?${query}`);

        if (!res.ok) {
            throw new Error(await res.text());
        }

        const data = await res.json();

        if (currentReport === "delivery") renderDeliveryReport(data);
        if (currentReport === "expiry") renderNearExpiryReport(data);
        if (currentReport === "returns") renderReturnReport(data);
        if (currentReport === "inventory") renderInventoryReport(data);

    } catch (err) {
        console.error(err);
        document.getElementById("reportTableBody").innerHTML = `
            <tr>
                <td colspan="20" class="text-center text-danger py-4">
                    Failed to load report.
                </td>
            </tr>
        `;
    }
}

function setLoading() {
    document.getElementById("summaryCards").innerHTML = "";
    document.getElementById("reportTableHead").innerHTML = "";
    document.getElementById("reportTableBody").innerHTML = `
        <tr>
            <td colspan="20" class="text-center text-muted py-4">Loading report...</td>
        </tr>
    `;

    const pagination = document.getElementById("reportPagination");

    if (pagination) {
        pagination.style.display = currentReport === "delivery" ? "" : "none";
    }
}

function renderCards(cards) {
    const container = document.getElementById("summaryCards");
    container.innerHTML = "";

    cards.forEach(card => {
        container.innerHTML += `
            <div class="col-lg-3 col-md-6">
                <div class="card shadow-sm summary-card">
                    <div class="card-body">
                        <small class="text-muted">${safe(card.label)}</small>
                        <h3 class="fw-bold mb-0">${safe(card.value)}</h3>
                    </div>
                </div>
            </div>
        `;
    });
}

function renderDeliveryReport(data) {
    document.getElementById("reportTitle").innerText = "Delivery KPI Report";
    document.getElementById("reportSubtitle").innerText = "Luzon target: 1–3 days | VizMin target: 5 days";

    renderCards([
        { label: "Total Deliveries", value: data.summary?.totalDeliveries ?? 0 },
        { label: "On-Time %", value: `${data.summary?.onTimePercent ?? 0}%` },
        { label: "Delayed %", value: `${data.summary?.delayedPercent ?? 0}%` },
        { label: "Average Delay", value: `${data.summary?.averageDeliveryDays ?? 0} days` }
    ]);

    document.getElementById("reportTableHead").innerHTML = `
        <tr>
            <th>Order No</th>
            <th>Customer</th>
            <th>Reference</th>
            <th>Route</th>
            <th>Region</th>
            <th>Delivery Date</th>
            <th>Date Delivered</th>
          <th>Variance</th>
            <th>Target</th>
            <th>Status</th>
        </tr>
    `;

    const items = data.items || [];

    document.getElementById("reportTableBody").innerHTML = items.length === 0
        ? emptyRow(10)
        : items.map(x => `
            <tr>
                <td>${safe(x.orderNo)}</td>
                <td>${safe(x.customerName)}</td>
                <td>${safe(x.transactionReference)}</td>
                <td>${safe(x.routeName)}</td>
                <td>${safe(x.region)}</td>
               <td>${formatDatePH(x.deliveryDate)}</td>
                <td>${formatDatePH(x.dateDelivered)}</td>
                <td>${formatVariance(x.deliveryDays)}</td>
                <td>${safe(x.targetDays)} days</td>
                <td>${statusBadge(x.kpiStatus)}</td>
            </tr>
        `).join("");

    lastReportData = data;
    renderPagination(data);
}

function formatVariance(days) {
    if (days === 0) return "On Time";
    if (days < 0) return `${Math.abs(days)} day(s) Early`;
    return `${days} day(s) Late`;
}


function renderPagination(data) {
    const pagination = document.getElementById("reportPagination");
    if (!pagination) return;

    const paginatedReports = ["delivery", "expiry", "inventory"];

    pagination.style.display = paginatedReports.includes(currentReport) ? "" : "none";

    if (!paginatedReports.includes(currentReport)) return;

    const totalRecords = data.totalRecords || 0;
    const totalPages = data.totalPages || 1;
    const page = data.page || 1;
    const size = data.pageSize || pageSize;

    const start = totalRecords === 0 ? 0 : ((page - 1) * size) + 1;
    const end = Math.min(page * size, totalRecords);

    document.getElementById("paginationInfo").innerText =
        `Showing ${start}-${end} of ${totalRecords}`;

    document.getElementById("pageNumberText").innerText =
        `Page ${page} of ${totalPages}`;

    document.getElementById("btnFirstPage").disabled = !data.hasPrevious;
    document.getElementById("btnPrevPage").disabled = !data.hasPrevious;
    document.getElementById("btnNextPage").disabled = !data.hasNext;
    document.getElementById("btnLastPage").disabled = !data.hasNext;
}

function renderNearExpiryReport(data) {
   // document.getElementById("reportPagination").style.display = "none";
    document.getElementById("reportTitle").innerText = "Near Expiry Report";
    document.getElementById("reportSubtitle").innerText = "Near expiry threshold: 3 months";

    renderCards([
        { label: "Total Lots", value: data.totalLots ?? 0 },
        { label: "Expired Lots", value: data.expiredLots ?? 0 },
        { label: "Near Expiry Lots", value: data.nearExpiryLots ?? 0 }
    ]);

    document.getElementById("reportTableHead").innerHTML = `
        <tr>
            <th>Product</th>
            <th>Lot No</th>
            <th>Warehouse</th>
            <th>Qty</th>
            <th>MFG</th>
            <th>EXP</th>
            <th>Months Left</th>
            <th>Status</th>
        </tr>
    `;

    const items = data.items || [];

    document.getElementById("reportTableBody").innerHTML = items.length === 0
        ? emptyRow(8)
        : items.map(x => `
            <tr>
                <td>${safe(x.productName)}</td>
                <td>${safe(x.lotNo)}</td>
                <td>${safe(x.branchName)}</td>
                <td>${formatQtyWithPack(x.quantity, x.uom, x.packQty, x.packUom)}</td>
                <td>${formatMonthYearPH(x.manufacturingDate)}</td>
                <td>${formatMonthYearPH(x.expirationDate)}</td>
                <td>${safe(x.monthsLeft ?? "")}</td>
                <td>${statusBadge(x.expiryStatus)}</td>
            </tr>
        `).join("");

    lastReportData = data;
    renderPagination(data);

}

function renderReturnReport(data) {
    document.getElementById("reportPagination").style.display = "none";
    document.getElementById("reportTitle").innerText = "Return Report";
    document.getElementById("reportSubtitle").innerText = "Returned products and quarantine/release status";

    renderCards([
        { label: "Total Returned Qty", value: formatNumber(data.summary?.totalReturnedQty ?? 0) },
        { label: "Top Reason", value: data.summary?.topReason || "-" },
        { label: "Top Customer", value: data.summary?.topCustomer || "-" }
    ]);

    document.getElementById("reportTableHead").innerHTML = `
        <tr>
            <th>Return No</th>
            <th>Date</th>
            <th>Customer</th>
            <th>Product</th>
            <th>Lot No</th>
            <th>Qty</th>
            <th>Reason</th>
            <th>Remarks</th>
            <th>Status</th>
            <th>Reference</th>
        </tr>
    `;

    const items = data.items || [];

    document.getElementById("reportTableBody").innerHTML = items.length === 0
        ? emptyRow(10)
        : items.map(x => `
            <tr>
                <td>${safe(x.returnNo)}</td>
                <td>${formatDatePH(x.returnDate)}</td>
                <td>${safe(x.customerName)}</td>
                <td>${safe(x.productName)}</td>
                <td>${safe(x.lotNo)}</td>
                <td>${formatQty(x.quantity, x.uom)}</td>
                <td>${safe(x.reason)}</td>
                <td>${safe(x.remarks)}</td>
                <td>${statusBadge(x.status)}</td>
                <td>${safe(x.linkedTransactionNo)}</td>
            </tr>
        `).join("");
}

function renderInventoryReport(data) {
  //  document.getElementById("reportPagination").style.display = "none";
    document.getElementById("reportTitle").innerText = "Inventory Report";
    document.getElementById("reportSubtitle").innerText = "Current stock snapshot by warehouse, product, and lot";

    renderCards([
        { label: "Total Stock Qty", value: formatNumber(data.totalStockQty ?? 0) },
        { label: "Total Lots", value: data.totalLots ?? 0 },
        { label: "Expired Lots", value: data.expiredLots ?? 0 },
        { label: "Near Expiry Lots", value: data.nearExpiryLots ?? 0 }
    ]);

    document.getElementById("reportTableHead").innerHTML = `
        <tr>
            <th>Product</th>
            <th>Warehouse</th>
            <th>Lot No</th>
            <th>Qty</th>
            <th>EXP</th>
            <th>Months Left</th>
            <th>Expiry Status</th>
            <th>Stock Status</th>
        </tr>
    `;

    const items = data.items || [];

    document.getElementById("reportTableBody").innerHTML = items.length === 0
        ? emptyRow(8)
        : items.map(x => `
            <tr>
                <td>${safe(x.productName)}</td>
                <td>${safe(x.branchName)}</td>
                <td>${safe(x.lotNo)}</td>
                <td>${formatQtyWithPack(x.quantity, x.uom, x.packQty, x.packUom)}</td>
                <td>${formatMonthYearPH(x.expirationDate)}</td>
                <td>${safe(x.monthsLeft ?? "")}</td>
                <td>${statusBadge(x.expiryStatus)}</td>
                <td>${statusBadge(x.stockStatus)}</td>
            </tr>
        `).join("");

    lastReportData = data;
    renderPagination(data);
}

function emptyRow(colspan) {
    return `
        <tr>
            <td colspan="${colspan}" class="text-center text-muted py-4">
                No records found.
            </td>
        </tr>
    `;
}

function formatDatePH(value) {
    if (!value) return "";

    return new Date(value).toLocaleDateString("en-PH", {
        timeZone: "Asia/Manila",
        year: "numeric",
        month: "short",
        day: "2-digit"
    });
}

function formatMonthYearPH(value) {
    if (!value) return "";

    return new Date(value).toLocaleDateString("en-PH", {
        timeZone: "Asia/Manila",
        year: "numeric",
        month: "short"
    });
}

function setPrintDate() {
    document.getElementById("printDate").innerText =
        "Generated: " + new Date().toLocaleString("en-PH", {
            timeZone: "Asia/Manila",
            year: "numeric",
            month: "short",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit"
        });
}

function formatQty(qty, uom) {
    return `${formatNumber(qty)} ${uom || ""}`.trim();
}

function formatQtyWithPack(qty, uom, packQty, packUom) {
    const qtyNum = Number(qty || 0);
    const packNum = Number(packQty || 0);

    const baseText = `${formatNumber(qtyNum)} ${uom || ""}`.trim();

    if (!packNum || packNum <= 0 || qtyNum <= 0) {
        return safe(baseText);
    }

    const packs = Math.floor(qtyNum / packNum);
    const loose = qtyNum % packNum;

    if (packs <= 0) {
        return safe(baseText);
    }

    return `
        <div>${safe(baseText)}</div>
        <small class="text-muted">
            ${packs} ${safe(packUom || "PACK")}${loose > 0 ? ` + ${formatNumber(loose)} ${safe(uom || "")}` : ""}
        </small>
    `;
}

function formatNumber(value) {
    return Number(value || 0).toLocaleString("en-PH", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    });
}

function statusBadge(status) {
    const s = String(status || "").toUpperCase();

    let cls = "bg-secondary";

    if (s === "ON TIME" || s === "SAFE" || s === "WITH STOCK" || s === "COMPLETED" || s === "RELEASED")
        cls = "bg-success";

    if (s === "DELAYED" || s === "NEAR" || s === "QUARANTINE" || s === "FOR INSPECTION")
        cls = "bg-warning text-dark";

    if (s === "EXPIRED" || s === "ZERO" || s === "CANCELLED")
        cls = "bg-danger";

    return `<span class="badge ${cls}">${safe(status)}</span>`;
}

function safe(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function safeAttr(value) {
    return safe(value);
}