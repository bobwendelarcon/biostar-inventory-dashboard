
//document.addEventListener("DOMContentLoaded", function () {
//    loadChecklistList();
//    initializeCreateChecklistModal();
//    initializeSelectAllOrders();

//    const btnReopen = document.getElementById("btnReopenChecklist");
//    if (btnReopen) {
//        btnReopen.addEventListener("click", async function () {
//            console.log("REOPEN CLICKED");

//            if (!window.currentChecklistId || window.currentChecklistId <= 0) {
//                alert("No checklist selected.");
//                return;
//            }

//            if (!confirm("Reopen this checklist and set status back to READY?")) {
//                return;
//            }

//            try {
//                const formData = new URLSearchParams();
//                formData.append("checklistId", window.currentChecklistId);

//                const response = await fetch('/DeliveryChecklist/ReopenChecklist', {
//                    method: 'POST',
//                    headers: {
//                        'Content-Type': 'application/x-www-form-urlencoded'
//                    },
//                    body: formData.toString()
//                });

//                const resultText = await response.text();
//                let result = null;

//                try {
//                    result = JSON.parse(resultText);
//                } catch {
//                    result = { message: resultText };
//                }

//                if (!response.ok) {
//                    throw new Error(result?.message || "Failed to reopen checklist.");
//                }

//                alert(result.message || "Checklist reopened successfully.");

//                const modalEl = document.getElementById("viewChecklistModal");
//                const modalInstance = bootstrap.Modal.getInstance(modalEl);
//                if (modalInstance) {
//                    modalInstance.hide();
//                }

//                await loadChecklistList();
//            } catch (error) {
//                console.error("Reopen error:", error);
//                alert(error.message || "Failed to reopen checklist.");
//            }
//        });

//        document.getElementById("filterDate")?.addEventListener("change", loadChecklistList);
//        document.getElementById("filterStatus")?.addEventListener("change", loadChecklistList);
//        document.getElementById("filterTruck")?.addEventListener("input", debounce(loadChecklistList, 500));
//        document.getElementById("filterSearch")?.addEventListener("input", debounce(loadChecklistList, 500));
//    }

//    const btnConfirm = document.getElementById("btnConfirmLoading");
//    if (btnConfirm) {
//        btnConfirm.addEventListener("click", function () {
//            confirmLoading();
//        });
//    }

//    const btnDelete = document.getElementById("btnDeleteChecklist");
//    if (btnDelete) {
//        btnDelete.addEventListener("click", function () {
//            if (!window.currentChecklistId || window.currentChecklistId <= 0) {
//                alert("No checklist selected.");
//                return;
//            }

//            deleteChecklist(window.currentChecklistId);
//        });
//    }

//    const btnPrint = document.getElementById("btnPrintChecklist");
//    if (btnPrint) {
//        btnPrint.addEventListener("click", function () {
//            openPrintPage();
//        });
//    }
//});

document.addEventListener("DOMContentLoaded", function () {

    // ✅ DEFAULT DATE = TODAY
    const today = new Date().toISOString().split('T')[0];
    const filterDate = document.getElementById("filterDate");

    if (filterDate && !filterDate.value) {
        filterDate.value = today;
    }
    loadChecklistList();
    initializeCreateChecklistModal();
    initializeSelectAllOrders();

    const btnReopen = document.getElementById("btnReopenChecklist");
    if (btnReopen) {
        btnReopen.addEventListener("click", async function () {
            console.log("REOPEN CLICKED");

            if (!window.currentChecklistId || window.currentChecklistId <= 0) {
                alert("No checklist selected.");
                return;
            }

            if (!confirm("Reopen this checklist and set status back to READY?")) {
                return;
            }

            try {
                const formData = new URLSearchParams();
                formData.append("checklistId", window.currentChecklistId);

                const response = await fetch('/DeliveryChecklist/ReopenChecklist', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    },
                    body: formData.toString()
                });

                const resultText = await response.text();
                let result = null;

                try {
                    result = JSON.parse(resultText);
                } catch {
                    result = { message: resultText };
                }

                if (!response.ok) {
                    throw new Error(result?.message || "Failed to reopen checklist.");
                }

                alert(result.message || "Checklist reopened successfully.");

                const modalEl = document.getElementById("viewChecklistModal");
                const modalInstance = bootstrap.Modal.getInstance(modalEl);
                if (modalInstance) {
                    modalInstance.hide();
                }

                await loadChecklistList();
            } catch (error) {
                console.error("Reopen error:", error);
                alert(error.message || "Failed to reopen checklist.");
            }
        });
    }

    //document.getElementById("filterDate")?.addEventListener("change", loadChecklistList);
    //document.getElementById("filterStatus")?.addEventListener("change", loadChecklistList);
    //document.getElementById("filterTruck")?.addEventListener("input", debounce(loadChecklistList, 500));
    //document.getElementById("filterSearch")?.addEventListener("input", debounce(loadChecklistList, 500));

    const btnConfirm = document.getElementById("btnConfirmLoading");
    if (btnConfirm) {
        btnConfirm.addEventListener("click", function () {
            confirmLoading();
        });
    }

    const btnDelete = document.getElementById("btnDeleteChecklist");
    if (btnDelete) {
        btnDelete.addEventListener("click", function () {
            if (!window.currentChecklistId || window.currentChecklistId <= 0) {
                alert("No checklist selected.");
                return;
            }

            deleteChecklist(window.currentChecklistId);
        });
    }

    const btnPrint = document.getElementById("btnPrintChecklist");
    if (btnPrint) {
        btnPrint.addEventListener("click", function () {
            openPrintPage();
        });
    }
});



function resetFilters() {
    document.getElementById("filterDate").value = "";
    document.getElementById("filterStatus").value = "";
    document.getElementById("filterTruck").value = "";
    document.getElementById("filterSearch").value = "";

    loadChecklistList();
}

function debounce(func, delay) {
    let timeout;
    return function () {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, arguments), delay);
    };
}
function applyFilters() {
    loadChecklistList();
}

//document.addEventListener("click", function (e) {
//    if (!e.target.closest("#btnReopenChecklist")) return;

//    console.log("REOPEN CLICKED");

//    if (!window.currentChecklistId || window.currentChecklistId <= 0) {
//        alert("No checklist selected.");
//        return;
//    }

//    if (!confirm("Reopen this checklist and set status back to READY?")) {
//        return;
//    }

//    fetch('/DeliveryChecklist/ReopenChecklist', {
//        method: 'POST',
//        headers: {
//            'Content-Type': 'application/x-www-form-urlencoded'
//        },
//        body: new URLSearchParams({
//            checklistId: window.currentChecklistId
//        })
//    })
//        .then(async res => {
//            const data = await res.json().catch(() => ({}));

//            if (!res.ok) {
//                throw new Error(data.message || "Failed to reopen checklist.");
//            }

//            alert(data.message || "Checklist reopened successfully.");

//            // close modal (Bootstrap 5)
//            const modalElement = document.getElementById('viewChecklistModal');
//            const modal = bootstrap.Modal.getInstance(modalElement);
//            if (modal) modal.hide();

//            loadChecklistList();
//        })
//        .catch(err => {
//            console.error(err);
//            alert(err.message);
//        });
//});
function setChecklistButtons(status) {
    const btnConfirm = document.getElementById("btnConfirmLoading");
    const btnDelete = document.getElementById("btnDeleteChecklist");
    const btnReopen = document.getElementById("btnReopenChecklist");

    btnConfirm.style.display = "none";
    btnDelete.style.display = "none";
    btnReopen.style.display = "none";

    status = (status || "").toUpperCase();

    if (status === "READY") {
        btnConfirm.style.display = "inline-block";
        btnDelete.style.display = "inline-block";
    } else if (status === "LOADING") {
        btnReopen.style.display = "inline-block";
    }
}
// ==========================
// MAIN CHECKLIST LIST
// ==========================
async function loadChecklistList() {
    const tableBody = document.getElementById("checklistTableBody");
    if (!tableBody) return;

    try {
        tableBody.innerHTML = `
            <tr>
                <td colspan="9" class="text-center text-muted py-4">Loading...</td>
            </tr>
        `;

        const date = document.getElementById("filterDate")?.value || "";
        const status = document.getElementById("filterStatus")?.value || "";
        const truck = document.getElementById("filterTruck")?.value || "";
        const search = document.getElementById("filterSearch")?.value || "";

        const query = new URLSearchParams();

        if (date) query.append("date", date);
        if (status) query.append("status", status);
        if (truck) query.append("truck", truck);
        if (search) query.append("search", search);

        const response = await fetch(`/DeliveryChecklist/GetChecklistList?${query.toString()}`);

        if (!response.ok) {
            throw new Error("Failed to load checklist list.");
        }

        const data = await response.json();
        console.log(data);

        if (!Array.isArray(data) || data.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="9" class="text-center text-muted py-4">No checklist found.</td>
                </tr>
            `;
            return;
        }

        let rows = "";

        data.forEach(item => {
            rows += `
                <tr>
                    <td>${escapeHtml(item.checklist_no ?? "")}</td>
                    <td>${formatDate(item.delivery_date)}</td>
                    <td>${escapeHtml(item.route_name ?? "-")}</td>
                    <td>${escapeHtml(item.truck_name ?? "-")}</td>
                    <td>${escapeHtml(item.driver_name ?? "-")}</td>
                    <td>${item.total_customers ?? 0}</td>
                    <td>${escapeHtml(item.createdBy ?? "-")}</td>
                    <td>${getStatusBadge(item.status)}</td>
                    <td class="text-center">
                        <div class="btn-group btn-group-sm">
                            <button class="btn btn-outline-primary" onclick="openViewChecklistModal(${item.checklist_id})">
                                View
                            </button>
                            <button class="btn btn-outline-danger" onclick="deleteChecklist(${item.checklist_id})">
                                Delete
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        });

        tableBody.innerHTML = rows;
    } catch (error) {
        console.error("Error loading checklist list:", error);
        tableBody.innerHTML = `
            <tr>
                <td colspan="9" class="text-center text-danger py-4">
                    Failed to load checklist.
                </td>
            </tr>
        `;
    }
}

    // 👉 your existing rendering logic here (NO CHANGE)
// ==========================
// CREATE CHECKLIST MODAL
// ==========================
function initializeCreateChecklistModal() {
    const modalElement = document.getElementById("createChecklistModal");
    if (!modalElement) return;

    modalElement.addEventListener("shown.bs.modal", async function () {
        await loadReadyForChecklist();

        const deliveryInput = document.getElementById("create_delivery_date");
        if (deliveryInput) {
            const today = new Date();
            const yyyy = today.getFullYear();
            const mm = String(today.getMonth() + 1).padStart(2, "0");
            const dd = String(today.getDate()).padStart(2, "0");
            const todayStr = `${yyyy}-${mm}-${dd}`;

            deliveryInput.min = todayStr;
            deliveryInput.value = todayStr;
        }
    });

    modalElement.addEventListener("hidden.bs.modal", function () {
        resetCreateChecklistForm();
    });
}

function initializeSelectAllOrders() {
    const selectAll = document.getElementById("selectAllOrders");
    if (!selectAll) return;

    selectAll.addEventListener("change", function () {
        const checkboxes = document.querySelectorAll(".checklist-line-checkbox");
        checkboxes.forEach(cb => {
            cb.checked = selectAll.checked;
        });
    });
}

async function loadReadyForChecklist() {
    const tableBody = document.getElementById("createChecklistTableBody");
    if (!tableBody) return;

    try {
        tableBody.innerHTML = `
            <tr>
                <td colspan="9" class="text-center text-muted py-3">Loading...</td>
            </tr>
        `;

        const response = await fetch("/DeliveryChecklist/GetReadyForChecklist");

        if (!response.ok) {
            throw new Error("Failed to load ready-for-checklist data.");
        }

        const data = await response.json();

        if (!Array.isArray(data) || data.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="9" class="text-center text-muted py-3">No ready orders found.</td>
                </tr>
            `;
            return;
        }

        let rows = "";

        data.forEach(item => {
            rows += `
                <tr>
                    <td>
                        <input 
                            type="checkbox" 
                            class="form-check-input checklist-line-checkbox"
                            data-order-id="${item.order_id}"
                            data-order-no="${escapeAttribute(item.order_no ?? "")}"
                            data-order-line-id="${item.order_line_id}"
                             data-customer-id="${escapeAttribute(item.customer_id ?? "")}"
                            data-customer-name="${escapeAttribute(item.customer_name ?? "")}"
                            data-product-id="${escapeAttribute(item.product_id ?? "")}"
                            data-product-name="${escapeAttribute(item.product_name ?? "")}"
                           
                            data-required-qty="${toNumber(item.required_qty)}"
                            data-allocated-qty="${toNumber(item.allocated_qty)}"
                           data-checklist-qty="${toNumber(item.allocated_qty)}"
                        >
                    </td>
                    <td>${escapeHtml(item.order_no ?? "")}</td>
                    <td>${escapeHtml(item.customer_name ?? "-")}</td>
                    <td>${escapeHtml(item.route_name ?? "-")}</td>
                    <td>${escapeHtml(item.product_name ?? "-")}</td>
                    <td>${toDisplayNumber(item.required_qty)}</td>
                    <td>${toDisplayNumber(item.allocated_qty)}</td>
                    <td>${formatDate(item.delivery_date)}</td>
                    <td>${getAllocationBadge(item.allocation_status)}</td>
                </tr>
            `;
        });

        tableBody.innerHTML = rows;

        const selectAll = document.getElementById("selectAllOrders");
        if (selectAll) {
            selectAll.checked = false;
        }
    } catch (error) {
        console.error("Error loading ready-for-checklist:", error);
        tableBody.innerHTML = `
            <tr>
                <td colspan="9" class="text-center text-danger py-3">
                    Failed to load ready orders.
                </td>
            </tr>
        `;
    }
}

async function submitCreateChecklist() {
    try {
        const deliveryDate = document.getElementById("create_delivery_date")?.value ?? "";
        const routeName = document.getElementById("create_route")?.value?.trim() ?? "";
        const truckName = document.getElementById("create_truck")?.value?.trim() ?? "";
        const driverName = document.getElementById("create_driver")?.value?.trim() ?? "";

        if (!deliveryDate) {
            alert("Delivery Date is required.");
            return;
        }

        const selectedCheckboxes = Array.from(document.querySelectorAll(".checklist-line-checkbox:checked"));

        if (selectedCheckboxes.length === 0) {
            alert("Please select at least one order line.");
            return;
        }

        const lines = selectedCheckboxes.map(cb => ({
            order_id: parseInt(cb.dataset.orderId || "0"),
            order_no: cb.dataset.orderNo || "",
            order_line_id: parseInt(cb.dataset.orderLineId || "0"),
         
            customer_name: cb.dataset.customerName || "",
            product_id: cb.dataset.productId || "",
            product_name: cb.dataset.productName || "",
           
            required_qty: parseFloat(cb.dataset.requiredQty || "0"),
            allocated_qty: parseFloat(cb.dataset.allocatedQty || "0"),
            checklist_qty: parseFloat(cb.dataset.checklistQty || "0")
        }));

        console.log("LINES:", lines);

        const payload = {
            delivery_date: `${deliveryDate}T00:00:00`,
            route_name: routeName,
            truck_name: truckName,
            driver_name: driverName,
            lines: lines
        };
        console.log("Create Checklist Payload:", payload);
        const response = await fetch("/DeliveryChecklist/CreateChecklist", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        const resultText = await response.text();
        let result = null;

        try {
            result = JSON.parse(resultText);
        } catch {
            result = { message: resultText };
        }

        if (!response.ok) {
            throw new Error(result?.message || resultText || "Failed to create checklist.");
        }

        alert(result?.message || "Checklist created successfully.");

        const modalElement = document.getElementById("createChecklistModal");
        const modalInstance = bootstrap.Modal.getInstance(modalElement);
        if (modalInstance) {
            modalInstance.hide();
        }

        await loadChecklistList();
    } catch (error) {
        console.error("Error creating checklist:", error);
        alert(error.message || "Failed to create checklist.");
    }
}

function resetCreateChecklistForm() {
    const deliveryDate = document.getElementById("create_delivery_date");
    const route = document.getElementById("create_route");
    const truck = document.getElementById("create_truck");
    const driver = document.getElementById("create_driver");
    const selectAll = document.getElementById("selectAllOrders");
    const tableBody = document.getElementById("createChecklistTableBody");

    if (deliveryDate) deliveryDate.value = "";
    if (route) route.value = "";
    if (truck) truck.value = "";
    if (driver) driver.value = "";
    if (selectAll) selectAll.checked = false;

    if (tableBody) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="9" class="text-center text-muted py-3">Loading...</td>
            </tr>
        `;
    }
}
 
// ==========================
// VIEW CHECKLIST DETAILS
// ==========================
async function openViewChecklistModal(id) {
    window.currentChecklistId = id;   // ✅ ADD THIS

    try {
        const response = await fetch(`/DeliveryChecklist/GetChecklistDetails?id=${id}`);

        if (!response.ok) {
            throw new Error("Failed to load checklist details.");
        }

        const data = await response.json();
        setChecklistButtons(data.status);
        document.getElementById("view_checklist_no").textContent = data.checklist_no ?? "-";
        document.getElementById("view_route").textContent = data.route_name ?? "-";
        document.getElementById("view_truck").textContent = data.truck_name ?? "-";
        document.getElementById("view_driver").textContent = data.driver_name ?? "-";

        const tbody = document.getElementById("viewChecklistLinesBody");

        if (!tbody) return;

        if (!Array.isArray(data.lines) || data.lines.length === 0) {
            tbody.innerHTML = `
        <tr>
            <td colspan="7" class="text-center text-muted">No data</td>
        </tr>
    `;
        } else {
            let rows = "";

            data.lines.forEach(line => {
                rows += `
            <tr>
                <td>${escapeHtml(line.customer_name ?? "-")}</td>
                <td>${escapeHtml(line.product_name ?? "-")}</td>
                <td>${escapeHtml(line.lot_no ?? "-")}</td>
                <td>${formatDate(line.manufacturing_date)}</td>
                <td>${formatDate(line.expiration_date)}</td>
                <td>${toDisplayNumber(line.checklist_qty)}</td>
                <td>${getStatusBadge(line.status)}</td>
            </tr>
        `;
            });

            tbody.innerHTML = rows;
        }

        const modal = new bootstrap.Modal(document.getElementById("viewChecklistModal"));
        modal.show();
    } catch (error) {
        console.error("Error loading checklist details:", error);
        alert("Failed to load checklist details.");
    }
}

// ==========================
// HELPERS
// ==========================
function formatDate(dateString) {
    if (!dateString) return "-";

    const date = new Date(dateString);

    if (isNaN(date.getTime())) {
        return "-";
    }

    return date.toLocaleDateString("en-PH", {
        year: "numeric",
        month: "long",
        day: "numeric"
    });
}

function getStatusBadge(status) {
    if (!status) return `<span class="badge bg-secondary">Unknown</span>`;

    const normalized = status.toString().toUpperCase();

    switch (normalized) {
        case "READY":
        case "READY_FOR_LOADING":
            return `<span class="badge bg-primary-subtle text-primary">Ready</span>`;

        case "LOADING":
            return `<span class="badge bg-info-subtle text-info">Loading</span>`;

        case "PARTIALLY_RELEASED":
        case "PARTIAL":
            return `<span class="badge bg-warning-subtle text-warning">Partial</span>`;

        case "COMPLETED":
        case "RELEASED":
            return `<span class="badge bg-success">Completed</span>`;

        case "CANCELLED":
            return `<span class="badge bg-danger">Cancelled</span>`;

        default:
            return `<span class="badge bg-secondary">${escapeHtml(status)}</span>`;
    }
}

function getAllocationBadge(status) {
    if (!status) return `<span class="badge bg-secondary">Unknown</span>`;

    const normalized = status.toString().toUpperCase();

    switch (normalized) {
        case "ALLOCATED":
            return `<span class="badge bg-primary-subtle text-primary">Allocated</span>`;

        case "PARTIALLY ALLOCATED":
            return `<span class="badge bg-warning-subtle text-warning">Partially Allocated</span>`;

        default:
            return `<span class="badge bg-secondary">${escapeHtml(status)}</span>`;
    }
}

function toNumber(value) {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? 0 : parsed;
}

function toDisplayNumber(value) {
    const num = toNumber(value);

    if (Number.isInteger(num)) {
        return num.toString();
    }

    return num.toFixed(2);
}

function escapeHtml(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
}

function escapeAttribute(value) {
    return escapeHtml(value);
}

function openPrintPage() {
    if (!window.currentChecklistId) return;

    window.open(`/DeliveryChecklist/Print/${window.currentChecklistId}`, '_blank');
}

//confirm loading

async function confirmLoading() {
    if (!window.currentChecklistId) {
        alert("No checklist selected.");
        return;
    }

    if (!confirm("Confirm loading? This will lock the checklist.")) {
        return;
    }

    try {
        const response = await fetch(`/DeliveryChecklist/ConfirmLoading?id=${window.currentChecklistId}`, {
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
            throw new Error(result?.message || resultText);
        }

        alert(result.message || "Checklist confirmed.");

        // reload list + close modal
        await loadChecklistList();
        location.reload();

    } catch (error) {
        console.error(error);
        alert(error.message || "Failed to confirm loading.");
    }
}

// delete
async function deleteChecklist(id) {
    if (!confirm("Are you sure you want to delete this checklist?")) {
        return;
    }

    try {
        const response = await fetch(`/DeliveryChecklist/DeleteChecklist?id=${id}`, {
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
            throw new Error(result?.message || resultText || "Failed to delete checklist.");
        }

        alert(result?.message || "Checklist deleted successfully.");

        await loadChecklistList();
    } catch (error) {
        console.error("Error deleting checklist:", error);
        alert(error.message || "Failed to delete checklist.");
    }

   

    
}