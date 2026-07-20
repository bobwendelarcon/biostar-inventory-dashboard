



let dashboardLowStockItems = [];


//function updateDashboardInventoryAlerts(items) {
//    const list = document.getElementById("dashboardInventoryAlertsBody");
//    if (!list) return;

//    if (!items.length) {
//        list.innerHTML = `
//            <li class="list-group-item px-0 text-center text-muted">
//                No inventory alerts
//            </li>`;
//        return;
//    }

//    list.innerHTML = items.map(item => {
//        const alertType = (item.alertType || "").toUpperCase();

//        const badgeClass = alertType === "OUT OF STOCK"
//            ? "bg-danger"
//            : "bg-warning text-dark";

//        let detailText = "";

//        if (alertType === "PLANNING SHORTAGE") {
//            detailText = `(${formatNumber(item.availableQty)} / ${formatNumber(item.requiredQty)} ${escapeHtml(item.uom || "")}) → Short ${formatNumber(item.shortageQty)} ${escapeHtml(item.uom || "")}`;
//        } else {
//            detailText = `(${formatNumber(item.quantity)} ${escapeHtml(item.uom || "")} available)`;
//        }

//        return `
//            <li class="list-group-item d-flex justify-content-between px-0">
//                <span>
//                    ${escapeHtml(item.productName || "")}
//                    <small class="text-muted">${detailText}</small>
//                </span>
//                <span class="badge ${badgeClass}">
//                    ${escapeHtml(item.alertType || "")}
//                </span>
//            </li>`;
//    }).join("");
//}


let dashboardRefreshTimer = null;
        let isRefreshingDashboard = false;
   

        const REFRESH_INTERVAL = 3000; // 10 seconds
   



document.addEventListener("DOMContentLoaded", function () {
    refreshDashboardData();
    startDashboardAutoRefresh();

    document.getElementById("lowStockSearch")
        ?.addEventListener(
            "input",
            debounce(renderLowStockModal, 200)
        );

    document.getElementById("lowStockStatusFilter")
        ?.addEventListener(
            "change",
            renderLowStockModal
        );

    document.getElementById("lowStockCategoryFilter")
        ?.addEventListener(
            "change",
            renderLowStockModal
        );

});


function debounce(func, delay) {
    let timeout;

    return function (...args) {
        clearTimeout(timeout);

        timeout = setTimeout(
            () => func.apply(this, args),
            delay
        );
    };
}
function startDashboardAutoRefresh() {
    if (dashboardRefreshTimer) {
        clearInterval(dashboardRefreshTimer);
    }

    dashboardRefreshTimer = setInterval(function () {
        refreshDashboardData();
    }, REFRESH_INTERVAL);
}

async function refreshDashboardData() {
    if (isRefreshingDashboard) return;

    isRefreshingDashboard = true;

    try {
        const response = await fetch("/Dashboard/GetDashboardData?_=" + Date.now(), {
            method: "GET",
            headers: {
                "Accept": "application/json"
            },
            cache: "no-store"
        });

        if (!response.ok) {
            console.warn("Dashboard refresh failed:", response.status);
            return;
        }

        const data = await response.json();

        dashboardLowStockItems =
            Array.isArray(data.lowStockProducts)
                ? data.lowStockProducts
                : [];


        populateLowStockCategoryFilter();
        updateDashboardCards(data);
        updateDashboardChecklist(data.checklist || []);
        updateDashboardPartialOrders(data.partialOrders || []);
        updateDashboardTransactions(data.recentTransactions || []);

        // only call this if the function exists
        if (typeof updateDashboardReturns === "function") {
            updateDashboardReturns(data.recentReturns || []);
        }

        updateDashboardInventoryAlerts(data.inventoryAlerts || []);

        console.log("Dashboard refreshed:", new Date().toLocaleTimeString());

    } catch (error) {
        console.error("Dashboard refresh error:", error);
    } finally {
        isRefreshingDashboard = false;
    }
}

        function updateDashboardCards(data) {
            setText("openOrdersCount", data.dailyOrders);
        setText("readyForChecklistCount", data.readyForChecklist);
        setText("checklistQueueCount", data.checklistQueue);
        setText("releasedTodayCount", data.releasedToday);
        setText("partialDeliveryCount", data.partialDispatch);
        setText("lowStockCount", data.lowStock);
        setText("completedTodayCount", data.completedOrders);
    }

        function updateDashboardChecklist(items) {
        const tbody = document.getElementById("dashboardChecklistBody");
        if (!tbody) return;

        if (!items.length) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="4" class="text-center text-muted">No checklist data</td>
                </tr>`;
        return;
        }

        tbody.innerHTML = items.map(item => {
            const badgeClass = getChecklistBadgeClass(item.status);

        return `
        <tr>
            <td>${escapeHtml(item.checklistNo || "")}</td>
            <td>${formatDate(item.deliveryDate)}</td>
            <td>${escapeHtml(item.truckName || "")}</td>
            <td><span class="badge ${badgeClass}">${escapeHtml(item.status || "")}</span></td>
        </tr>`;
        }).join("");
    }

        function updateDashboardPartialOrders(items) {
        const tbody = document.getElementById("dashboardPartialOrdersBody");
        if (!tbody) return;

        if (!items.length) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="4" class="text-center text-muted">No partial orders</td>
                </tr>`;
        return;
        }

        tbody.innerHTML = items.map(item => `
        <tr>
            <td>${escapeHtml(item.orderNo || "")}</td>
            <td>${escapeHtml(item.customerName || "")}</td>
            <td>${formatNumber(item.remainingQty)}</td>
            <td><span class="badge bg-info text-dark">${escapeHtml(item.status || "")}</span></td>
        </tr>
        `).join("");
    }

        function updateDashboardTransactions(items) {
        const tbody = document.getElementById("dashboardTransactionsBody");
        if (!tbody) return;

        if (!items.length) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center text-muted">No recent transactions</td>
                </tr>`;
        return;
        }

        tbody.innerHTML = items.map(item => {
            const type = (item.type || "").toUpperCase();
        const badgeClass = type === "OUT" ? "bg-danger" : "bg-success";

            return `
<tr>
    <td>${formatDateTime(item.transactionDate)}</td>
    <td>${escapeHtml(item.customerName || "")}</td>
    <td>${formatReference(item)}</td>
    <td>${formatLot(item.lotNo)}</td>
   <td>
    <div>${escapeHtml(item.productName || "")}</div>
    ${item.productDescription
                    ? `<div class="text-muted small">
              ${escapeHtml(item.productDescription)}
           </div>`
                    : ""}
</td>
    <td>${formatNumber(item.quantity)} ${escapeHtml(item.uom || "")}</td>
    <td><span class="badge ${badgeClass}">${escapeHtml(item.type || "")}</span></td>
</tr>`;
        }).join("");
}


function openLowStockModal() {
    const modalElement =
        document.getElementById("lowStockModal");

    if (!modalElement) return;

    const search =
        document.getElementById("lowStockSearch");

    const statusFilter =
        document.getElementById("lowStockStatusFilter");

    const categoryFilter =
        document.getElementById("lowStockCategoryFilter");

    if (search) search.value = "";
    if (statusFilter) statusFilter.value = "";
    if (categoryFilter) categoryFilter.value = "";

    populateLowStockCategoryFilter();
    renderLowStockModal();

    bootstrap.Modal
        .getOrCreateInstance(modalElement)
        .show();
}

function renderLowStockModal() {
    const tbody = document.getElementById("lowStockModalTableBody");
    const resultCount = document.getElementById("lowStockResultCount");

    if (!tbody) return;

    const search =
        document.getElementById("lowStockSearch")
            ?.value.trim().toLowerCase() || "";

    const statusFilter =
        document.getElementById("lowStockStatusFilter")
            ?.value.trim().toUpperCase() || "";

    const categoryFilter =
        document.getElementById("lowStockCategoryFilter")
            ?.value.trim().toLowerCase() || "";

    const filtered = dashboardLowStockItems.filter(item => {
        const productText = [
            item.productId,
            item.productName,
            item.productDescription,
            item.categoryName
        ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

        const stockStatus =
            (item.stockStatus || "")
                .trim()
                .toUpperCase();

        const categoryName =
            (item.categoryName || "")
                .trim()
                .toLowerCase();

        const matchesSearch =
            !search || productText.includes(search);

        const matchesStatus =
            !statusFilter || stockStatus === statusFilter;

        const matchesCategory =
            !categoryFilter || categoryName === categoryFilter;

        return (
            matchesSearch &&
            matchesStatus &&
            matchesCategory
        );
    });

    if (resultCount) {
        resultCount.textContent =
            `${filtered.length} of ${dashboardLowStockItems.length} product(s)`;
    }

    if (filtered.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7"
                    class="text-center text-muted py-4">
                    No matching low-stock products.
                </td>
            </tr>
        `;

        return;
    }

    tbody.innerHTML = filtered.map(item => {
        const totalQty = Number(item.totalQty || 0);
        const stockLevel = Number(item.stockLevel || 0);
        const deficitQty = Number(item.deficitQty || 0);

        const stockStatus =
            (item.stockStatus || "LOW STOCK")
                .trim()
                .toUpperCase();

        const badgeClass =
            stockStatus === "OUT OF STOCK"
                ? "bg-danger"
                : "bg-warning text-dark";

        return `
            <tr>
                <td>
                    ${escapeHtml(item.categoryName || "Uncategorized")}
                </td>

                <td>
                    <div class="fw-semibold">
                        ${escapeHtml(item.productName || "-")}
                    </div>

                    ${item.productDescription
                ? `
                                <div class="small text-muted">
                                    ${escapeHtml(item.productDescription)}
                                </div>
                              `
                : ""
            }
                </td>

                <td class="text-end">
                    ${formatNumber(totalQty)}
                    ${escapeHtml(item.uom || "")}
                </td>

                <td class="text-end">
                    ${formatNumber(stockLevel)}
                    ${escapeHtml(item.uom || "")}
                </td>

                <td class="text-end text-danger fw-semibold">
                    ${formatNumber(deficitQty)}
                    ${escapeHtml(item.uom || "")}
                </td>

                <td>
                    <span class="badge ${badgeClass}">
                        ${escapeHtml(stockStatus)}
                    </span>
                </td>

                <td class="text-center">
                    <a
                        href="/Inventory?search=${encodeURIComponent(
                item.productName || ""
            )}"
                        class="btn btn-sm btn-outline-primary">
                        View Stock
                    </a>
                </td>
            </tr>
        `;
    }).join("");
}
function populateLowStockCategoryFilter() {
    const categoryFilter =
        document.getElementById("lowStockCategoryFilter");

    if (!categoryFilter) return;

    const selectedValue = categoryFilter.value;

    const categories = [
        ...new Set(
            dashboardLowStockItems
                .map(item => item.categoryName)
                .filter(Boolean)
        )
    ].sort((a, b) => a.localeCompare(b));

    categoryFilter.innerHTML = `
        <option value="">All Categories</option>
        ${categories.map(category => `
            <option value="${escapeHtml(category.toLowerCase())}">
                ${escapeHtml(category)}
            </option>
        `).join("")}
    `;

    categoryFilter.value = selectedValue;
}
function formatLot(lotNo) {
    if (!lotNo) return "-";
    return `<span class="text-muted">${escapeHtml(lotNo)}</span>`;
}
function formatReference(item) {
    let hasRef = false;
    let html = "";   // ADD THIS

    if (item.drNo) {
        hasRef = true;
        html += `<span class="badge bg-secondary">DR: ${escapeHtml(item.drNo)}</span>`;
    }

    if (item.trNo) {
        hasRef = true;
        html += `<span class="badge bg-dark">Tr#: ${escapeHtml(item.trNo)}</span>`;
    }

    if (item.invNo) {
        hasRef = true;
        html += `<span class="badge bg-dark">INV: ${escapeHtml(item.invNo)}</span>`;
    }

    if (item.poNo) {
        hasRef = true;
        html += `<span class="badge bg-warning text-dark">PO: ${escapeHtml(item.poNo)}</span>`;
    }

    if (item.orderNo) {
        hasRef = true;
        html += `<span class="badge bg-primary">DO: ${escapeHtml(item.orderNo)}</span>`;
    }

    if (item.checklistNo) {
        hasRef = true;
        html += `<span class="badge bg-info text-dark">DC: ${escapeHtml(item.checklistNo)}</span>`;
    }

    return hasRef ? html : `<span class="text-muted">-</span>`;
}
function updateDashboardInventoryAlerts(items) {
    const list = document.getElementById("dashboardInventoryAlertsBody");
    if (!list) return;

    if (!items.length) {
        list.innerHTML = `
            <li class="list-group-item px-0 text-center text-muted">
                No inventory alerts
            </li>`;
        return;
    }

    list.innerHTML = items.map(item => {
        const alertType = (item.alertType || "").toUpperCase();

        const badgeClass = alertType === "OUT OF STOCK"
            ? "bg-danger"
            : "bg-warning text-dark";

        let detailText = "";

        if (alertType === "PLANNING SHORTAGE") {
            detailText = `
                (${formatNumber(item.availableQty)} ${escapeHtml(item.uom || "")} available,
                ${formatNumber(item.reservedQty)} ${escapeHtml(item.uom || "")} reserved,
                ${formatNumber(item.requiredQty)} ${escapeHtml(item.uom || "")} required)
                → <span class="text-danger fw-semibold">Short ${formatNumber(item.shortageQty)} ${escapeHtml(item.uom || "")}</span>`;
        } else {
            detailText = `
                (${formatNumber(item.quantity)} ${escapeHtml(item.uom || "")} available /
                Stock Level: ${formatNumber(item.stockLevel)} ${escapeHtml(item.uom || "")})`;
        }

        return `
            <li class="list-group-item d-flex justify-content-between px-0">
                <span>
                    ${escapeHtml(item.productName || "")}
                    <small class="text-muted">${detailText}</small>
                </span>
                <span class="badge ${badgeClass}">
                    ${escapeHtml(item.alertType || "")}
                </span>
            </li>`;
    }).join("");
}

        function setText(id, value) {
        const el = document.getElementById(id);
        if (el) el.textContent = value ?? 0;
    }

        function getChecklistBadgeClass(status) {
        const s = (status || "").toUpperCase();

        if (s === "READY") return "bg-primary";
        if (s === "LOADING") return "bg-warning text-dark";
        if (s === "PARTIAL") return "bg-info text-dark";
        if (s === "COMPLETED") return "bg-success";

        return "bg-secondary";
    }

        function formatDate(value) {
        if (!value) return "-";
        const d = new Date(value);
        if (isNaN(d)) return "-";

        return d.toLocaleDateString("en-PH", {
            year: "numeric",
        month: "2-digit",
        day: "2-digit"
        });
    }

        //function formatDateTime(value) {
        //if (!value) return "-";
        //const d = new Date(value);
//if (isNaN(d)) return "-";
    //    return d.toLocaleString("en-PH", {
    //        year: "numeric",
    //    month: "2-digit",
    //    day: "2-digit",
    //    hour: "2-digit",
    //    minute: "2-digit"
    //    });
    //}
function formatDateTime(value) {
    if (!value) return "-";

    let dateValue = value;

    // If backend sends "2026-04-28T09:05:00" without Z,
    // treat it as UTC by adding Z.
    if (typeof dateValue === "string" && !dateValue.endsWith("Z")) {
        dateValue += "Z";
    }

    const d = new Date(dateValue);
    if (isNaN(d)) return "-";

    return d.toLocaleString("en-PH", {
        timeZone: "Asia/Manila",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true
    });
}
        function formatNumber(value) {
        const num = Number(value || 0);
        return num.toLocaleString("en-PH", {
            maximumFractionDigits: 2
        });
    }

        function escapeHtml(value) {
        return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
    }
 