






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
            detailText = `(${formatNumber(item.availableQty)} / ${formatNumber(item.requiredQty)} ${escapeHtml(item.uom || "")}) → Short ${formatNumber(item.shortageQty)} ${escapeHtml(item.uom || "")}`;
        } else {
            detailText = `(${formatNumber(item.quantity)} ${escapeHtml(item.uom || "")} available)`;
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


let dashboardRefreshTimer = null;
        let isRefreshingDashboard = false;
   

        const REFRESH_INTERVAL = 3000; // 10 seconds
   



document.addEventListener("DOMContentLoaded", function () {
    refreshDashboardData();
    startDashboardAutoRefresh();
});

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
    <td>${escapeHtml(item.productName || "")}</td>
    <td>${formatNumber(item.quantity)} ${escapeHtml(item.uom || "")}</td>
    <td><span class="badge ${badgeClass}">${escapeHtml(item.type || "")}</span></td>
</tr>`;
        }).join("");
}
function formatLot(lotNo) {
    if (!lotNo) return "-";
    return `<span class="text-muted">${escapeHtml(lotNo)}</span>`;
}
function formatReference(item) {
    let html = `<div class="d-flex flex-wrap gap-1">`;

    if (item.drNo) {
        html += `<span class="badge bg-secondary">DR: ${escapeHtml(item.drNo)}</span>`;
    }

    if (item.invNo) {
        html += `<span class="badge bg-dark">INV: ${escapeHtml(item.invNo)}</span>`;
    }

    if (item.poNo) {
        html += `<span class="badge bg-warning text-dark">PO: ${escapeHtml(item.poNo)}</span>`;
    }

    if (item.orderNo) {
        html += `<span class="badge bg-primary">DO: ${escapeHtml(item.orderNo)}</span>`;
    }

    if (item.checklistNo) {
        html += `<span class="badge bg-info text-dark">DC: ${escapeHtml(item.checklistNo)}</span>`;
    }

    html += `</div>`;

    return html;
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
                (${formatNumber(item.availableQty)} ${escapeHtml(item.uom || "")} stock,
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
 