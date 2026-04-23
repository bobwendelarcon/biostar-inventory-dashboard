let dailyOrderAutoRefresh = null;
let isTypingFilter = false;

document.addEventListener("DOMContentLoaded", function () {
    loadDailyOrders();
    startDailyOrderAutoRefresh();

    document.getElementById("searchInput")?.addEventListener("input", function () {
        isTypingFilter = true;

        clearTimeout(window.dailyOrderTypingTimeout);
        window.dailyOrderTypingTimeout = setTimeout(() => {
            isTypingFilter = false;
        }, 1000);
    });

    const btnFilter = document.getElementById("btnFilter");
    if (btnFilter) {
        btnFilter.addEventListener("click", function () {
            loadDailyOrders();
        });
    }

    document.getElementById("addOrderModal")?.addEventListener("shown.bs.modal", stopDailyOrderAutoRefresh);
    document.getElementById("addOrderModal")?.addEventListener("hidden.bs.modal", startDailyOrderAutoRefresh);

    document.getElementById("editOrderModal")?.addEventListener("shown.bs.modal", stopDailyOrderAutoRefresh);
    document.getElementById("editOrderModal")?.addEventListener("hidden.bs.modal", startDailyOrderAutoRefresh);

    document.getElementById("viewOrderModal")?.addEventListener("shown.bs.modal", stopDailyOrderAutoRefresh);
    document.getElementById("viewOrderModal")?.addEventListener("hidden.bs.modal", startDailyOrderAutoRefresh);

    document.getElementById("addOrderModal")?.addEventListener("shown.bs.modal", async function () {
        await loadAddOrderCategories();
        await loadCustomers();
        await loadBranches();
        // ✅ DISABLE PAST DATES (Delivery Date)
        const deliveryInput = document.getElementById("addDeliveryDate");
        //addDateOrdered
        const dateOrderedInput = document.getElementById("addDateOrdered");
        //editDeliveryDate
        const editDeliveryDateInput = document.getElementById("editDeliveryDate");

        if (deliveryInput) {
            const today = new Date();
            const yyyy = today.getFullYear();
            const mm = String(today.getMonth() + 1).padStart(2, '0');
            const dd = String(today.getDate()).padStart(2, '0');

            const todayStr = `${yyyy}-${mm}-${dd}`;

            deliveryInput.min = todayStr;     // ❌ disable yesterday
            deliveryInput.value = todayStr;   // ✔ default today (optional but recommended)

        }
        if (dateOrderedInput) {
            const today = new Date();
            const yyyy = today.getFullYear();
            const mm = String(today.getMonth() + 1).padStart(2, '0');
            const dd = String(today.getDate()).padStart(2, '0');

            const todayStr = `${yyyy}-${mm}-${dd}`;

           // dateOrderedInput.min = todayStr;     // ❌ disable yesterday
            dateOrderedInput.value = todayStr;   // ✔ default today (optional but recommended)

        }
        if (editDeliveryDateInput) {
            const today = new Date();
            const yyyy = today.getFullYear();
            const mm = String(today.getMonth() + 1).padStart(2, '0');
            const dd = String(today.getDate()).padStart(2, '0');

            const todayStr = `${yyyy}-${mm}-${dd}`;

             editDeliveryDateInput.min = todayStr;     // ❌ disable yesterday
            editDeliveryDateInput.value = todayStr;   // ✔ default today (optional but recommended)

        }
    });

    document.getElementById("addLineCategory")?.addEventListener("change", loadAddOrderProducts);
    document.getElementById("addLineProductSearch")?.addEventListener("input", loadAddOrderProducts);
    document.getElementById("addLineProduct")?.addEventListener("change", updateSelectedProductInfo);
    document.getElementById("btnAddSelectedProductLine")?.addEventListener("click", addSelectedProductLine);

    const floatingMenu = document.getElementById("floatingActionMenu");

    document.addEventListener("click", function (e) {
        const actionBtn = e.target.closest(".btn-open-action-menu");

        // open menu
        if (actionBtn) {
            e.preventDefault();
            e.stopPropagation();

            const encodedMenu = actionBtn.dataset.menu || "";
            const menuHtml = decodeURIComponent(encodedMenu);

            floatingMenu.innerHTML = menuHtml;
            floatingMenu.classList.remove("d-none");

            const rect = actionBtn.getBoundingClientRect();
            const menuWidth = 170;
            const menuHeight = floatingMenu.offsetHeight || 180;
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;

            let left = rect.left;
            let top = rect.bottom + 4;

            if (left + menuWidth > viewportWidth - 10) {
                left = viewportWidth - menuWidth - 10;
            }

            if (top + menuHeight > viewportHeight - 10) {
                top = rect.top - menuHeight - 4;
            }

            if (top < 10) top = 10;

            floatingMenu.style.left = `${left}px`;
            floatingMenu.style.top = `${top}px`;

            return;
        }

        // click inside menu
        if (e.target.closest("#floatingActionMenu")) {
            return;
        }

        // click outside menu
        floatingMenu.classList.add("d-none");
        floatingMenu.innerHTML = "";
    });

    document.getElementById("btnSaveEditOrder")?.addEventListener("click", saveEditOrder);

    document.getElementById("btnModalRerunAllocation")?.addEventListener("click", async function () {
        if (!window.currentOrderId) return;

        await allocateOrder(window.currentOrderId);
        await openViewModal(window.currentOrderId); // refresh modal
    });

    document.getElementById("btnModalSendToDispatch")?.addEventListener("click", async function () {
        if (!window.currentOrderId) {
            alert("No order selected.");
            return;
        }

        await markReadyForDispatch(window.currentOrderId);
        await openViewModal(window.currentOrderId); // refresh modal
        await loadDailyOrders(); // refresh table
    });

    document.addEventListener("click", async function (e) {
        if (e.target.closest(".dropdown-item")) {
            e.preventDefault();
        }

        const viewBtn = e.target.closest(".btn-view-order");
        const editBtn = e.target.closest(".btn-edit-order");
        const deleteBtn = e.target.closest(".btn-delete-order");
        const allocateBtn = e.target.closest(".btn-allocate-order");
        const dispatchBtn = e.target.closest(".btn-dispatch-order");

        if (viewBtn) {
            const orderId = viewBtn.dataset.id;
            await openViewModal(orderId);

            const floatingMenu = document.getElementById("floatingActionMenu");
            if (floatingMenu) {
                floatingMenu.classList.add("d-none");
                floatingMenu.innerHTML = "";
            }
        }

        if (editBtn) {
            const orderId = editBtn.dataset.id;
            await openEditModal(orderId);
        }

        if (deleteBtn) {
            const orderId = deleteBtn.dataset.id;
            await deleteOrder(orderId);
        }

        if (allocateBtn) {
            const orderId = allocateBtn.dataset.id;
            await allocateOrder(orderId);
        }

        if (dispatchBtn) {
            const orderId = dispatchBtn.dataset.id;
            await markReadyForDispatch(orderId);
        }
    });
});
async function loadBranches() {
    try {
        const select = document.getElementById("addSourceBranch");
        if (!select) return;

        select.innerHTML = `<option value="">Loading branches...</option>`;

        const response = await fetch("/DailyOrder/GetBranches");
        if (!response.ok) {
            throw new Error("Failed to load branches.");
        }

        const data = await response.json();

        if (!data || data.length === 0) {
            select.innerHTML = `<option value="">No branches found</option>`;
            return;
        }

        let options = `<option value="">Select source branch</option>`;

        data.forEach(item => {
            options += `
                <option value="${item.branch_id}">
                    ${item.branch_name}
                </option>
            `;
        });

        select.innerHTML = options;
    } catch (error) {
        console.error("Error loading branches:", error);
    }
}
function startDailyOrderAutoRefresh() {
    stopDailyOrderAutoRefresh();

    dailyOrderAutoRefresh = setInterval(() => {

        if (document.hidden) return;

        const addOrderModalOpen = document.getElementById("addOrderModal")?.classList.contains("show");
        const editOrderModalOpen = document.getElementById("editOrderModal")?.classList.contains("show");
        const viewOrderModalOpen = document.getElementById("viewOrderModal")?.classList.contains("show");

        if (addOrderModalOpen || editOrderModalOpen || viewOrderModalOpen) return;

        if (isTypingFilter) return;

        loadDailyOrders();

    }, 30000);
}

function stopDailyOrderAutoRefresh() {
    if (dailyOrderAutoRefresh) {
        clearInterval(dailyOrderAutoRefresh);
        dailyOrderAutoRefresh = null;
    }
}

async function openEditModal(orderId) {
    try {
        const response = await fetch(`/DailyOrder/GetOrderDetails?orderId=${orderId}`);
        if (!response.ok) throw new Error(await response.text());

        const data = await response.json();

        document.getElementById("editOrderId").value = data.orderId || "";
        document.getElementById("editCustomerName").value = data.customerName || "";
        document.getElementById("editClassName").value = data.className || "";
        document.getElementById("editRouteName").value = data.routeName || "";
        document.getElementById("editDeliveryDate").value = toInputDate(data.deliveryDate);
        document.getElementById("editSpecialInstructions").value = data.specialInstructions || "";

        const modalEl = document.getElementById("editOrderModal");
        let modal = bootstrap.Modal.getInstance(modalEl);

        if (!modal) {
            modal = new bootstrap.Modal(modalEl);
        }

        modal.show();
    } catch (err) {
        console.error(err);
        alert("Failed to load order for editing.");
    }
}

async function saveEditOrder() {
    const orderId = document.getElementById("editOrderId").value;

    const payload = {
        customerName: document.getElementById("editCustomerName").value.trim(),
        className: document.getElementById("editClassName").value.trim(),
        routeName: document.getElementById("editRouteName").value.trim(),
        deliveryDate: document.getElementById("editDeliveryDate").value || null,
        specialInstructions: document.getElementById("editSpecialInstructions").value.trim()
    };

    if (!payload.customerName) {
        alert("Customer is required.");
        return;
    }

    try {
        const response = await fetch(`/DailyOrder/UpdateOrder?orderId=${orderId}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) throw new Error(await response.text());

        const result = await response.json();
        alert(result.message || "Order updated successfully.");

        const modalEl = document.getElementById("editOrderModal");
        const modal = bootstrap.Modal.getInstance(modalEl);
        if (modal) modal.hide();

        await loadDailyOrders();

        if (window.currentOrderId && String(window.currentOrderId) === String(orderId)) {
            await openViewModal(orderId);
        }
    } catch (err) {
        console.error(err);
        alert("Failed to update order.");
    }
}

//function toInputDate(dateStr) {
//    if (!dateStr) return "";
//    const date = new Date(dateStr);
//    if (isNaN(date.getTime())) return "";
//    return date.toISOString().split("T")[0];
//}

function toInputDate(dateStr) {
    if (!dateStr) return "";

    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "";

    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');

    return `${yyyy}-${mm}-${dd}`;
}

async function loadDailyOrders() {
    const className = document.getElementById("classFilter")?.value || "";
    const year = document.getElementById("yearFilter")?.value || "";
    const month = document.getElementById("monthFilter")?.value || "";
    const status = document.getElementById("statusFilter")?.value || "";
    const search = document.getElementById("searchInput")?.value || "";

    const params = new URLSearchParams();

    if (className) params.append("className", className);
    if (year) params.append("year", year);
    if (month) params.append("month", month);
    if (status) params.append("status", status);
    if (search) params.append("search", search);

    document.getElementById("lastUpdatedText").textContent =
        "Last updated: " + new Date().toLocaleTimeString();

    try {
        const response = await fetch(`/DailyOrder/GetOrders?${params.toString()}`);
        if (!response.ok) throw new Error(await response.text());

        //const data = await response.json();
        //renderDailyOrderTable(data);

        const result = await response.json();

        renderDailyOrderSummary(result.summary);
        renderDailyOrderTable(result.data || []);


    } catch (err) {
        console.error(err);
        document.getElementById("dailyOrderTableBody").innerHTML = `
            <tr>
                <td colspan="16" class="text-center text-danger py-4">
                    Failed to load orders.
                </td>
            </tr>
        `;
    }
}

function renderDailyOrderSummary(summary) {
    document.getElementById("summaryTotalOrders").textContent = summary?.totalOrders ?? 0;
    document.getElementById("summaryForAllocation").textContent = summary?.forAllocation ?? 0;
    document.getElementById("summaryAllocated").textContent = summary?.allocated ?? 0;
    document.getElementById("summaryPartial").textContent = summary?.partial ?? 0;
    document.getElementById("summaryReadyDispatch").textContent = summary?.readyDispatch ?? 0;
    document.getElementById("summaryPartiallyDelivered").textContent = summary?.partiallyDelivered ?? 0;
    document.getElementById("summaryOverdue").textContent = summary?.overdue ?? 0;
    document.getElementById("summaryCompleted").textContent = summary?.completed ?? 0;
}
function renderDailyOrderTable(data) {
    const tbody = document.getElementById("dailyOrderTableBody");
    tbody.innerHTML = "";

    if (!data || data.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="18" class="text-center text-muted py-4">
                    No orders found.
                </td>
            </tr>
        `;
        return;
    }

    data.forEach(order => {
        let menuItems = `
            <button type="button" class="floating-action-item btn-view-order" data-id="${order.orderId}">View</button>
            <button type="button" class="floating-action-item btn-edit-order" data-id="${order.orderId}">Edit</button>
            <button type="button" class="floating-action-item btn-delete-order text-danger" data-id="${order.orderId}">Delete</button>
        `;

        if (order.status === "For Allocation" || order.status === "Partially Allocated") {
            menuItems += `
                <button type="button" class="floating-action-item btn-allocate-order text-info" data-id="${order.orderId}">Allocate</button>
            `;
        }

        if (order.status === "Allocated" || order.status === "Partially Allocated") {
            menuItems += `
                <button type="button" class="floating-action-item btn-dispatch-order text-success" data-id="${order.orderId}">Dispatch</button>
            `;
        }

        const actionButtons = `
            <button type="button"
                    class="btn btn-outline-secondary btn-sm btn-open-action-menu"
                    data-id="${order.orderId}"
                    data-menu='${encodeURIComponent(menuItems)}'>
                Actions
            </button>
        `;

        tbody.innerHTML += `
            <tr>
                <td>${safe(order.className)}</td>
                <td>${safe(order.year)}</td>
                <td>${safe(order.month)}</td>
                <td>${safe(order.orderNo)}</td>
                <td>${safe(order.customerName)}</td>
                <td>${safe(order.productName)}</td>
                <td>${formatQtyWithPack(order.requiredQty, order.uom, order.packQty, order.packUom)}</td>
<td>${formatQtyWithPack(order.allocatedQty, order.uom, order.packQty, order.packUom)}</td>
<td>${formatQtyWithPack(order.remainingQty, order.uom, order.packQty, order.packUom)}</td>
<td>${formatQtyWithPack(order.dispatchedQty, order.uom, order.packQty, order.packUom)}</td>
                <td>${renderAllocationBadge(order.allocationStatus)}</td>
                <td>${formatDate(order.dateOrdered)}</td>
                <td>${formatDate(order.deliveryDate)}</td>
                <td>${formatDate(order.dateDelivered)}</td>
                <td>${getAgingBadge(order.agingDays)}</td>
                <td>${renderStatusBadge(order.status)}</td>
                <td>${safe(order.specialInstructions || "-")}</td>
                <td class="text-center">
                    ${actionButtons}
                </td>
            </tr>
        `;
    });
}

function getAgingBadge(days) {
    if (days <= 0) return `<span class="text-success">${days}</span>`;
    if (days <= 2) return `<span class="text-warning">${days}</span>`;
    return `<span class="text-danger fw-bold">${days}</span>`;
}

async function openViewModal(orderId) {
    window.currentOrderId = orderId;

    try {
        const response = await fetch(`/DailyOrder/GetOrderDetails?orderId=${orderId}`);
        if (!response.ok) throw new Error(await response.text());

        const data = await response.json();

        document.getElementById("modalOrderNo").textContent = data.orderNo || "-";
        document.getElementById("modalCustomerName").textContent = data.customerName || "-";
        document.getElementById("modalDeliveryDate").textContent = formatDate(data.deliveryDate);
        document.getElementById("modalSourceBranch").textContent = data.sourceBranchName || data.sourceBranchId || "-";
        document.getElementById("modalStatusBadge").innerHTML = renderStatusBadge(data.status);





        renderModalLineSummary(data.lines || []);
        renderModalLotAllocations(data.lines || []);

        const editBtn = document.querySelector("#viewOrderModal .btn-edit-order");
        if (editBtn) {
            editBtn.dataset.id = orderId;
        }

        const modalEl = document.getElementById("viewOrderModal");
        let modal = bootstrap.Modal.getInstance(modalEl);

        if (!modal) {
            modal = new bootstrap.Modal(modalEl);
        }

        modal.show();
    } catch (err) {
        console.error("openViewModal error:", err);
        alert("Failed to load order details: " + err.message);
    }
}

function renderModalLineSummary(lines) {
    const tbody = document.getElementById("modalLineSummaryBody");
    tbody.innerHTML = "";

    if (!lines.length) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center text-muted">No order lines found.</td>
            </tr>
        `;
        return;
    }

    lines.forEach(line => {
        tbody.innerHTML += `
            <tr>
                <td>${safe(line.productName)}</td>
               <td>${formatQtyWithPack(line.requiredQty, line.uom, line.packQty, line.packUom)}</td>
<td>${formatQtyWithPack(line.allocatedQty, line.uom, line.packQty, line.packUom)}</td>
<td>${formatQtyWithPack(line.availableBeforeAllocation, line.uom, line.packQty, line.packUom)}</td>
                <td>${renderAllocationBadge(line.allocationResult)}</td>
            </tr>
        `;
    });
}

function renderModalLotAllocations(lines) {
    const tbody = document.getElementById("modalLotAllocationBody");
    tbody.innerHTML = "";

    const allocations = lines.flatMap(line => line.allocations || []);

    if (!allocations.length) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9" class="text-center text-muted">No FEFO allocation yet.</td>
            </tr>
        `;
        return;
    }

    allocations.forEach(item => {
        tbody.innerHTML += `
            <tr>
            <td>${safe(item.branchId || "-")}</td>
                <td>${safe(item.lotNo)}</td>
                <td>${formatDate(item.manufacturingDate)}</td>
                <td>${formatDate(item.expirationDate)}</td>
              <td>${formatQtyWithPack(item.onHandQty, item.uom, item.packQty, item.packUom)}</td>
<td>${formatQtyWithPack(item.reservedQty, item.uom, item.packQty, item.packUom)}</td>
<td>${formatQtyWithPack(item.availableQty, item.uom, item.packQty, item.packUom)}</td>
<td>${formatQtyWithPack(item.allocatedQty, item.uom, item.packQty, item.packUom)}</td>
                <td>${renderPriorityBadge(item.priorityRank)}</td>
            </tr>
        `;
    });
}

async function allocateOrder(orderId) {
    if (!confirm("Run FEFO allocation for this order?")) return;

    try {
        const response = await fetch(`/DailyOrder/AllocateOrder?orderId=${orderId}`, {
            method: "POST"
        });

        const resultText = await response.text();
        let result = null;

        try {
            result = JSON.parse(resultText);
        } catch {
            result = { message: resultText };
        }

        if (!response.ok) {
            throw new Error(result?.message || resultText || "Failed to allocate order.");
        }

        alert(result.message || "Allocation completed.");
        await loadDailyOrders();

        if (window.currentOrderId && String(window.currentOrderId) === String(orderId)) {
            await openViewModal(orderId);
        }
    } catch (err) {
        console.error("allocateOrder error:", err);
        alert(err.message || "Failed to allocate order.");
    }
}

async function markReadyForDispatch(orderId) {
    if (!confirm("Mark this order as Ready for Dispatch?")) return;

    try {
        const response = await fetch(`/DailyOrder/MarkReadyForDispatch?orderId=${orderId}`, {
            method: "POST"
        });

        if (!response.ok) throw new Error(await response.text());

        const result = await response.json();
        alert(result.message || "Order is now ready for dispatch.");
        loadDailyOrders();
    } catch (err) {
        console.error(err);
        alert("Failed to mark order as ready for dispatch.");
    }
}

function renderAllocationBadge(status) {
    const value = status || "";
    if (value === "Fully Allocated")
        return `<span class="badge bg-success-subtle text-success">Fully Allocated</span>`;
    if (value === "Partial")
        return `<span class="badge bg-warning-subtle text-warning">Partial</span>`;
    return `<span class="badge bg-danger-subtle text-danger">Not Allocated</span>`;
}

function renderStatusBadge(status) {
    const value = status || "";
    if (value === "Completed")
        return `<span class="badge bg-success-subtle text-success">Completed</span>`;
    if (value === "Ready for Dispatch")
        return `<span class="badge bg-primary-subtle text-primary">Ready for Dispatch</span>`;
    if (value === "Allocated")
        return `<span class="badge bg-success-subtle text-success">Allocated</span>`;
    if (value === "Partially Allocated")
        return `<span class="badge bg-warning-subtle text-warning">Partially Allocated</span>`;
    if (value === "Overdue")
        return `<span class="badge bg-danger-subtle text-danger">Overdue</span>`;
    return `<span class="badge bg-secondary-subtle text-secondary">${safe(value || "Draft")}</span>`;
}

function renderPriorityBadge(rank) {
    if (rank === 1)
        return `<span class="badge bg-success-subtle text-success">1st FEFO</span>`;
    return `<span class="badge bg-light text-dark border">Next</span>`;
}

function formatDate(dateStr) {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "-";

    return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric"
    });
}

function formatQty(value) {
    if (value === null || value === undefined) return "0";
    return Number(value).toLocaleString("en-US", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    });
}

function formatQtyValue(value) {
    if (value === null || value === undefined) return "0";

    return Number(value).toLocaleString("en-US", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    });
}

function formatPackBreakdown(qty, packQty, packUom, uom) {
    const qtyNum = Number(qty || 0);
    const packQtyNum = Number(packQty || 0);
    const packLabel = (packUom || "").toUpperCase();
    const uomLabel = uom || "";

    if (!packQtyNum || packQtyNum <= 0) {
        return "-";
    }

    const packs = Math.floor(qtyNum / packQtyNum);
    const remainder = qtyNum % packQtyNum;

    if (packs > 0 && remainder > 0) {
        return `${packs} ${packLabel} + ${formatQtyValue(remainder)} ${uomLabel}`.trim();
    } else if (packs > 0) {
        return `${packs} ${packLabel}`.trim();
    } else {
        return `${formatQtyValue(remainder)} ${uomLabel}`.trim();
    }
}

function formatQtyWithPack(qty, uom, packQty, packUom) {
    const qtyText = `${formatQtyValue(qty)} ${uom || ""}`.trim();
    const packText = formatPackBreakdown(qty, packQty, packUom, uom);

    return `
    <div class="qty-pack-cell">
        <div>${safe(qtyText)}</div>
        <small class="text-muted">${safe(packText)}</small>
    </div>
`;
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

async function deleteOrder(orderId) {
    if (!confirm("Are you sure you want to delete this order?")) return;

    try {
        const response = await fetch(`/DailyOrder/DeleteOrder?orderId=${orderId}`, {
            method: "DELETE"
        });

        if (!response.ok) throw new Error(await response.text());

        const result = await response.json();
        alert(result.message || "Order deleted successfully.");
        await loadDailyOrders();
    } catch (err) {
        console.error(err);
        alert("Failed to delete order.");
    }
}

document.addEventListener("shown.bs.dropdown", function (e) {
    const dropdown = e.target.closest(".table-action-dropdown");
    if (!dropdown) return;

    const toggleBtn = dropdown.querySelector('[data-bs-toggle="dropdown"]');
    const menu = dropdown.querySelector(".dropdown-menu");
    if (!toggleBtn || !menu) return;

    document.body.appendChild(menu);
    menu.dataset.floating = "true";

    const rect = toggleBtn.getBoundingClientRect();
    const menuWidth = menu.offsetWidth || 180;
    const viewportWidth = window.innerWidth;

    let left = rect.right - menuWidth;
    if (left < 8) left = 8;
    if (left + menuWidth > viewportWidth - 8) {
        left = viewportWidth - menuWidth - 8;
    }

    menu.style.position = "fixed";
    menu.style.top = `${rect.bottom + 4}px`;
    menu.style.left = `${left}px`;
    menu.style.zIndex = "2000";
    menu.style.display = "block";
});

document.addEventListener("hide.bs.dropdown", function (e) {
    const dropdown = e.target.closest(".table-action-dropdown");
    if (!dropdown) return;

    const menu = document.body.querySelector(".dropdown-menu[data-floating='true']");
    if (!menu) return;

    menu.style.position = "";
    menu.style.top = "";
    menu.style.left = "";
    menu.style.zIndex = "";
    menu.style.display = "";
    menu.removeAttribute("data-floating");

    dropdown.appendChild(menu);
});

document.getElementById("btnAddOrderLine")?.addEventListener("click", addOrderLineRow);
document.getElementById("btnSaveAddOrder")?.addEventListener("click", saveAddOrder);

document.addEventListener("click", function (e) {
    const removeLineBtn = e.target.closest(".btn-remove-line");
    if (removeLineBtn) {
        const row = removeLineBtn.closest("tr");
        const tbody = document.getElementById("addOrderLinesBody");

        if (tbody.querySelectorAll("tr").length === 1) {
            row.querySelector(".line-product-id").value = "";
            row.querySelector(".line-product-name").value = "";
            row.querySelector(".line-required-qty").value = "";
            return;
        }

        row.remove();
    }
});

function addOrderLineRow() {
    const tbody = document.getElementById("addOrderLinesBody");
    tbody.insertAdjacentHTML("beforeend", `
        <tr>
            <td>
                <input type="text" class="form-control line-product-id" placeholder="e.g. FP0004" />
            </td>
            <td>
                <input type="text" class="form-control line-product-name" placeholder="e.g. Fenbendazole FP" />
            </td>
            <td>
                <input type="number" class="form-control line-required-qty" min="0.01" step="0.01" />
            </td>
            <td class="text-center">
                <button type="button" class="btn btn-outline-danger btn-sm btn-remove-line">Remove</button>
            </td>
        </tr>
    `);
}

async function saveAddOrder() {
    const customerSelect = document.getElementById("addCustomerName");
    const customerId = customerSelect?.value || "";
    const customerName = customerSelect?.selectedOptions[0]?.text || "";
    const sourceBranchId = document.getElementById("addSourceBranch")?.value || "";
    const className = document.getElementById("addClassName")?.value.trim() || "";
    const routeName = document.getElementById("addRouteName")?.value.trim() || "";
    const dateOrdered = document.getElementById("addDateOrdered")?.value || null;
    const deliveryDate = document.getElementById("addDeliveryDate")?.value || null;
    const createdBy = document.getElementById("addCreatedBy")?.value.trim() || "admin";
    const specialInstructions = document.getElementById("addSpecialInstructions")?.value.trim() || "";

    const lineRows = Array.from(document.querySelectorAll("#addOrderLinesBody tr"))
        .filter(row => !row.querySelector("td[colspan]"));

    const lines = lineRows.map(row => {
        const productId = row.querySelector(".line-product-id")?.value || "";
        const productName = row.querySelector(".line-product-name-hidden")?.value || "";
        const packQty = parseFloat(row.querySelector(".line-pack-qty")?.value || "0");
        const qtyInput = parseFloat(row.querySelector(".line-required-qty-input")?.value || "0");
        const uomType = row.querySelector(".line-uom-type")?.value || "BASE";

        let requiredQty = qtyInput;



        if (uomType === "PACK" && packQty > 0) {
            requiredQty = qtyInput * packQty;
        }

        return {
            productId,
            productName,
            requiredQty
        };
    }).filter(x => x.productId && x.productName && x.requiredQty > 0);

    if (!customerId) {
        alert("Customer is required.");
        return;
    }

    if (lines.length === 0) {
        alert("Please add at least one valid order line.");
        return;
    }

    if (!sourceBranchId) {
        alert("Source branch is required.");
        return;
    }

    const payload = {
        customerId,
        customerName,
        className,
        routeName,
        dateOrdered,
        deliveryDate,
        specialInstructions,
        createdBy,
        sourceBranchId,
        lines
    };

    try {
        const response = await fetch("/DailyOrder/CreateOrder", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(await response.text());
        }

        const result = await response.json();
        alert(result.message || "Order created successfully.");

        const modalEl = document.getElementById("addOrderModal");
        let modal = bootstrap.Modal.getInstance(modalEl);
        if (modal) {
            modal.hide();
        }

        resetAddOrderForm();
        await loadDailyOrders();
    } catch (err) {
        console.error("saveAddOrder error:", err);
        alert("Failed to create order: " + err.message);
    }
}

async function loadCustomers() {
    try {
        const select = document.getElementById("addCustomerName");
        if (!select) return;

        select.innerHTML = `<option value="">Loading...</option>`;

        const response = await fetch("/DailyOrder/GetCustomers");

        if (!response.ok) {
            throw new Error("Failed to load customers.");
        }

        const data = await response.json();

        // ✅ FILTER ONLY CUSTOMERS
        const customers = data.filter(x => x.partner_type === "CUSTOMER");

        if (customers.length === 0) {
            select.innerHTML = `<option value="">No customers found</option>`;
            return;
        }

        let options = `<option value="">Select Customer</option>`;

        customers.forEach(item => {
            options += `
                <option value="${item.partner_id}">
                    ${item.partner_name}
                </option>
            `;
        });

        select.innerHTML = options;

    } catch (error) {
        console.error("Error loading customers:", error);
    }
}
function resetAddOrderForm() {
    document.getElementById("addCustomerName").value = "";
    document.getElementById("addClassName").value = "";
    document.getElementById("addRouteName").value = "";
    document.getElementById("addDateOrdered").value = "";
    document.getElementById("addDeliveryDate").value = "";
    document.getElementById("addSpecialInstructions").value = "";
    document.getElementById("addLineProductSearch").value = "";
    document.getElementById("addLineProductInfo").textContent = "";
    document.getElementById("addSourceBranch").value = "";

    const productSelect = document.getElementById("addLineProduct");
    if (productSelect) {
        productSelect.innerHTML = `<option value="">Select product</option>`;
    }

    document.getElementById("addOrderLinesBody").innerHTML = `
        <tr>
            <td colspan="5" class="text-center text-muted">No order lines added yet.</td>
        </tr>
    `;
}


let categoryOptionsCache = [];

async function loadAddOrderCategories() {
    try {
        const response = await fetch("/DailyOrder/GetCategories");
        if (!response.ok) throw new Error(await response.text());

        categoryOptionsCache = await response.json();
        console.log("categories loaded:", categoryOptionsCache);

        const categorySelect = document.getElementById("addLineCategory");
        if (!categorySelect) {
            console.error("addLineCategory not found");
            return;
        }

        categorySelect.innerHTML = `<option value="">Select category</option>`;

        categoryOptionsCache.forEach(c => {
            categorySelect.innerHTML += `
                <option value="${safe(c.catg_id)}">${safe(c.catg_name)}</option>
            `;
        });

    } catch (err) {
        console.error("loadAddOrderCategories error:", err);
        alert("Failed to load categories: " + err.message);
    }
}

async function loadAddOrderProducts() {
    const categoryId = document.getElementById("addLineCategory").value || "";
    const search = document.getElementById("addLineProductSearch").value || "";

    try {
        const response = await fetch(`/DailyOrder/GetProductsLookup?categoryId=${encodeURIComponent(categoryId)}&search=${encodeURIComponent(search)}`);
        if (!response.ok) throw new Error(await response.text());

        const products = await response.json();
        const productSelect = document.getElementById("addLineProduct");

        productSelect.innerHTML = `<option value="">Select product</option>`;

        products.forEach(p => {
            productSelect.innerHTML += `
                <option value="${safe(p.productId)}"
                        data-name="${safe(p.productName)}"
                        data-uom="${safe(p.uom || "")}"
                        data-pack-uom="${safe(p.packUom || "")}"
                        data-pack-qty="${safe(p.packQty || 0)}">
                    ${safe(p.productName)}
                </option>
            `;
        });

        updateSelectedProductInfo();
    } catch (err) {
        console.error(err);
        alert("Failed to load products.");
    }
}
function updateSelectedProductInfo() {
    const productSelect = document.getElementById("addLineProduct");
    const selected = productSelect.options[productSelect.selectedIndex];
    const info = document.getElementById("addLineProductInfo");

    if (!selected || !selected.value) {
        info.textContent = "";
        return;
    }

    const uom = selected.dataset.uom || "-";
    const packUom = selected.dataset.packUom || "-";
    const packQty = selected.dataset.packQty || "0";

    if (packUom !== "-" && Number(packQty) > 0) {
        info.textContent = `Base UOM: ${uom} | Pack UOM: ${packUom} | 1 ${packUom} = ${packQty} ${uom}`;
    } else {
        info.textContent = `Base UOM: ${uom}`;
    }
}
function addSelectedProductLine() {
    const productSelect = document.getElementById("addLineProduct");
    const selected = productSelect.options[productSelect.selectedIndex];

    if (!selected || !selected.value) {
        alert("Please select a product.");
        return;
    }

    const productId = selected.value;
    const productName = selected.dataset.name || selected.text;
    const uom = selected.dataset.uom || "";
    const packUom = selected.dataset.packUom || "";
    const packQty = parseFloat(selected.dataset.packQty || "0");

    const tbody = document.getElementById("addOrderLinesBody");

    const emptyRow = tbody.querySelector("td[colspan='5']");
    if (emptyRow) {
        tbody.innerHTML = "";
    }

    tbody.insertAdjacentHTML("beforeend", `
        <tr>
            <td>
                <div class="fw-semibold">${safe(productName)}</div>
                <small class="text-muted">
                    ID: ${safe(productId)}
                    ${uom ? `| Base: ${safe(uom)}` : ""}
                    ${packUom ? `| Pack: ${safe(packUom)}` : ""}
                    ${packQty > 0 ? `| Pack Qty: ${packQty}` : ""}
                </small>

                <input type="hidden" class="line-product-id" value="${safe(productId)}" />
                <input type="hidden" class="line-product-name-hidden" value="${safe(productName)}" />
                <input type="hidden" class="line-uom" value="${safe(uom)}" />
                <input type="hidden" class="line-pack-uom" value="${safe(packUom)}" />
                <input type="hidden" class="line-pack-qty" value="${packQty}" />
            </td>

            <td>
                <input type="number" class="form-control line-required-qty-input" min="0.01" step="0.01" value="1" />
            </td>

            <td>
                <select class="form-select line-uom-type">
                    <option value="BASE">Base UOM${uom ? ` (${safe(uom)})` : ""}</option>
                    ${packUom && packQty > 0 ? `<option value="PACK">Pack${packUom ? ` (${safe(packUom)})` : ""}</option>` : ""}
                </select>
            </td>

            <td>
                <span class="line-base-qty-display">1 ${safe(uom || "")}</span>
            </td>

            <td class="text-center">
                <button type="button" class="btn btn-outline-danger btn-sm btn-remove-line">Remove</button>
            </td>
        </tr>
    `);

    const row = tbody.lastElementChild;
    bindLineQtyConversion(row);
}

function bindLineQtyConversion(row) {
    const qtyInput = row.querySelector(".line-required-qty-input");
    const uomType = row.querySelector(".line-uom-type");
    const baseQtyDisplay = row.querySelector(".line-base-qty-display");
    const uom = row.querySelector(".line-uom").value || "";
    const packQty = parseFloat(row.querySelector(".line-pack-qty").value || "0");

    function recalc() {
        const inputQty = parseFloat(qtyInput.value || "0");
        let baseQty = inputQty;

        if (uomType.value === "PACK" && packQty > 0) {
            baseQty = inputQty * packQty;
        }

        baseQtyDisplay.textContent = `${baseQty} ${uom}`;
    }

    qtyInput.addEventListener("input", recalc);
    uomType.addEventListener("change", recalc);

    recalc();
}
