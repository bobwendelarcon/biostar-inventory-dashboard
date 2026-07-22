
let checklistAutoRefreshTimer = null;
let checklistModalInstance = null;

function isChecklistModalOpen() {
    const createModal = document.getElementById("createChecklistModal");
    const viewModal = document.getElementById("viewChecklistModal");

    const isCreateOpen = createModal?.classList.contains("show");
    const isViewOpen = viewModal?.classList.contains("show");

    return isCreateOpen || isViewOpen;
}

function startChecklistAutoRefresh() {
    if (checklistAutoRefreshTimer) {
        clearInterval(checklistAutoRefreshTimer);
    }

    checklistAutoRefreshTimer = setInterval(async function () {
        if (isChecklistModalOpen()) {
            console.log("Auto refresh skipped: modal is open");
            return;
        }

        await loadChecklistList({ silent: true });
    }, 5000); // 5 seconds
}

document.addEventListener("DOMContentLoaded", function () {

    // ✅ DEFAULT DATE = TODAY
  

    const today = getPHDateInputValue();
    const filterDate = document.getElementById("filterDate");

    const filterActiveOnly =
        document.getElementById("filterActiveOnly");

    if (filterDate && !filterDate.value) {
        filterDate.value = today;
    }

    if (filterActiveOnly) {
        filterActiveOnly.checked = true;
    }

    loadChecklistList();
    initializeCreateChecklistModal();
    initializeSelectAllOrders();
    startChecklistAutoRefresh();
    initializeCustomerSearch();


    const activeOnly =
        document.getElementById("filterActiveOnly");

    activeOnly?.addEventListener("change", function () {
        updateActiveFilterState();
        loadChecklistList();
    });

    updateActiveFilterState();



    document.getElementById("editChecklistTripModal")
        ?.addEventListener("hidden.bs.modal", function () {

            document
                .getElementById("viewChecklistModal")
                ?.classList.remove("modal-parent-dim");

            cleanupBootstrapModal();
        });

    document.getElementById("completeLineModal")
        ?.addEventListener("hidden.bs.modal", function () {

            document
                .getElementById("viewChecklistModal")
                .classList.remove("modal-parent-dim");

        });


    document.getElementById("addChecklistCustomerModal")
        ?.addEventListener("hidden.bs.modal", function () {

            document
                .getElementById("viewChecklistModal")
                ?.classList.remove("modal-parent-dim");

            cleanupBootstrapModal();
        });


    document.getElementById("viewChecklistModal")
        ?.addEventListener("hidden.bs.modal", cleanupBootstrapModal);

    document.getElementById("completeLineModal")
        ?.addEventListener("hidden.bs.modal", cleanupBootstrapModal);


  
    document.getElementById("editChecklistLotModal")
        ?.addEventListener("hidden.bs.modal", function () {

            document
                .getElementById("viewChecklistModal")
                ?.classList.remove("modal-parent-dim");

        });


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

    //const btnConfirm = document.getElementById("btnConfirmLoading");
    //if (btnConfirm) {
    //    btnConfirm.addEventListener("click", function () {
    //        confirmLoading();
    //    });
    //}

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


async function saveChecklistTripInfo() {
    const checklistId = Number(
        document.getElementById(
            "edit_trip_checklist_id"
        )?.value || 0
    );

    const routeName =
        document.getElementById(
            "edit_trip_route"
        )?.value.trim() || "";

    const truckName =
        document.getElementById(
            "edit_trip_truck"
        )?.value.trim() || "";

    const driverName =
        document.getElementById(
            "edit_trip_driver"
        )?.value.trim() || "";

    if (checklistId <= 0) {
        alert("Invalid checklist.");
        return;
    }

    if (!routeName) {
        alert("Route is required.");
        return;
    }

    if (!truckName) {
        alert("Truck is required.");
        return;
    }

    if (!driverName) {
        alert("Driver is required.");
        return;
    }

    const button =
        document.getElementById(
            "btnSaveChecklistTrip"
        );

    if (button) {
        button.disabled = true;
    }

    try {
        const response = await fetch(
            "/DeliveryChecklist/UpdateTripInfo",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    checklist_id: checklistId,
                    route_name: routeName,
                    truck_name: truckName,
                    driver_name: driverName
                })
            }
        );

        const responseText =
            await response.text();

        let result;

        try {
            result = JSON.parse(responseText);
        } catch {
            result = {
                message: responseText
            };
        }

        if (!response.ok ||
            result.success === false) {
            throw new Error(
                result.message ||
                "Failed to update trip information."
            );
        }

        alert(
            result.message ||
            "Trip information updated successfully."
        );

        bootstrap.Modal.getInstance(
            document.getElementById(
                "editChecklistTripModal"
            )
        )?.hide();

        await openViewChecklistModal(checklistId);
        await loadChecklistList();

    } catch (error) {
        console.error(
            "Update checklist trip info:",
            error
        );

        alert(
            error.message ||
            "Failed to update trip information."
        );
    } finally {
        if (button) {
            button.disabled = false;
        }
    }
}

function getPHDateInputValue() {
    return new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Manila",
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
    }).format(new Date());
}


function resetFilters() {
    const today = getPHDateInputValue();

    document.getElementById("filterDate").value = today;
    document.getElementById("filterStatus").value = "";
    document.getElementById("filterTruck").value = "";
    document.getElementById("filterSearch").value = "";
    document.getElementById("filterActiveOnly").checked = true;

    updateActiveFilterState();
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



//function setChecklistButtons(status) {
//    const btnConfirm = document.getElementById("btnConfirmLoading");
//    const btnDelete = document.getElementById("btnDeleteChecklist");
//    const btnReopen = document.getElementById("btnReopenChecklist");

//    btnConfirm.style.display = "none";
//    btnDelete.style.display = "none";
//    btnReopen.style.display = "none";

//    status = (status || "").toUpperCase();

//    if (status === "READY") {
//        btnConfirm.style.display = "inline-block";
//        btnDelete.style.display = "inline-block";
//    } else if (status === "LOADING") {
//        btnReopen.style.display = "inline-block";
//    }
//}
async function deleteChecklistLine(checklistLineId) {
    if (!confirm("Delete this checklist line?")) return;

    const response = await fetch(`/DeliveryChecklist/DeleteChecklistLine?checklistLineId=${checklistLineId}`, {
        method: "POST"
    });

    const result = await response.json();

    if (!result.success) {
        alert(result.message || "Failed to delete line.");
        return;
    }

    alert(result.message || "Checklist line deleted.");

    if (window.currentChecklistId) {
        await openViewChecklistModal(
            window.currentChecklistId
        );

        await loadChecklistList();
    }
    else {
        await loadChecklistList();
    }
}
function setChecklistButtons(status) {
    const btnDelete = document.getElementById("btnDeleteChecklist");
    const btnPrint = document.getElementById("btnPrintChecklist");

    status = (status || "").toUpperCase();

    if (btnPrint) btnPrint.style.display = "inline-block";

    if (btnDelete) {
        btnDelete.style.display = status === "READY"
            ? "inline-block"
            : "none";
    }
}
// ==========================
// MAIN CHECKLIST LIST
// ==========================
async function loadChecklistList(options = {}) {
    const tableBody = document.getElementById("checklistTableBody");
    if (!tableBody) return;

    const silent = options.silent === true;

    try {
        if (!silent) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="9" class="text-center text-muted py-4">Loading...</td>
                </tr>
            `;
        }

        const date = document.getElementById("filterDate")?.value || "";
        const status = document.getElementById("filterStatus")?.value || "";
        const truck = document.getElementById("filterTruck")?.value || "";
        const search = document.getElementById("filterSearch")?.value || "";
        const activeOnly =
            document.getElementById("filterActiveOnly")?.checked === true;

        const query = new URLSearchParams();


        if (!activeOnly && date && !search) {
            query.append("date", date);
        }

        if (!activeOnly && status) {
            query.append("status", status);
        }

        if (activeOnly) {
            query.append("activeOnly", "true");
        }

        if (truck) {
            query.append("truck", truck);
        }

        if (search) {
            query.append("search", search);
        }

        const response = await fetch(`/DeliveryChecklist/GetChecklistList?${query.toString()}`);

        if (!response.ok) {
            throw new Error("Failed to load checklist list.");
        }

        const result = await response.json();
        const data = Array.isArray(result) ? result : (result.data || []);

        if (search && data.length > 0) {
            const foundDate = data[0].delivery_date;

            if (foundDate) {
                document.getElementById("filterDate").value = foundDate.substring(0, 10);
            }
        }

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
                    <td>
    <div>${escapeHtml(item.checklist_no ?? "")}</div>
    ${item.dr_numbers
                    ? `<div class="text-muted small">DR: ${escapeHtml(item.dr_numbers)}</div>`
                    : ""}
</td>
                    <td>${formatDate(item.delivery_date)}</td>
                    <td>${escapeHtml(item.route_name ?? "-")}</td>
                    <td>${escapeHtml(item.truck_name ?? "-")}</td>
                    <td>${escapeHtml(item.driver_name ?? "-")}</td>
                    <td>${item.total_customers ?? 0}</td>
                    <td>${escapeHtml(item.createdBy ?? "-")}</td>
                    <td>${getStatusBadge(item.status)}</td>
                    
                    <td class="text-center">
    <div class="btn-group btn-group-sm">
        <button class="btn btn-outline-primary"
                onclick="openViewChecklistModal(${item.checklist_id})">
            View
        </button>

        <button class="btn btn-outline-danger"
                onclick="deleteChecklist(${item.checklist_id})">
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

        if (!silent) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="9" class="text-center text-danger py-4">
                        Failed to load checklist.
                    </td>
                </tr>
            `;
        }
    }
}

function updateActiveFilterState() {
    const activeOnly =
        document.getElementById("filterActiveOnly");

    const date =
        document.getElementById("filterDate");

    const status =
        document.getElementById("filterStatus");

    const isActive = activeOnly?.checked === true;

    if (date) {
        date.disabled = isActive;
    }

    if (status) {
        status.disabled = isActive;
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

            const minDate = new Date(today);
            minDate.setDate(today.getDate() - 5);

            const minYyyy = minDate.getFullYear();
            const minMm = String(minDate.getMonth() + 1).padStart(2, "0");
            const minDd = String(minDate.getDate()).padStart(2, "0");
            const minDateStr = `${minYyyy}-${minMm}-${minDd}`;

            deliveryInput.min = minDateStr;
            deliveryInput.value = todayStr;
        }
    });

    modalElement.addEventListener("hidden.bs.modal", function () {
        resetCreateChecklistForm();
        cleanupBootstrapModal();
    });
}

function initializeSelectAllOrders() {
    const selectAll =
        document.getElementById("selectAllOrders");

    if (!selectAll) return;

    selectAll.addEventListener("change", function () {
        const visibleRows = Array.from(
            document.querySelectorAll(
                ".create-checklist-order-row"
            )
        ).filter(row => row.style.display !== "none");

        visibleRows.forEach(row => {
            const checkbox =
                row.querySelector(".checklist-line-checkbox");

            if (checkbox) {
                checkbox.checked = selectAll.checked;
            }
        });
    });

    document.addEventListener("change", function (event) {
        if (
            event.target.classList.contains(
                "checklist-line-checkbox"
            )
        ) {
            updateSelectAllOrdersState();
        }
    });
}
function initializeCustomerSearch() {
    const searchInput = document.getElementById("create_customer_search");
    const clearButton = document.getElementById("btnClearCustomerSearch");

    if (searchInput) {
        searchInput.addEventListener(
            "input",
            debounce(filterCreateChecklistCustomers, 200)
        );
    }

    if (clearButton) {
        clearButton.addEventListener("click", function () {
            if (searchInput) {
                searchInput.value = "";
                searchInput.focus();
            }

            filterCreateChecklistCustomers();
        });
    }
}

function filterCreateChecklistCustomers() {
    const searchInput =
        document.getElementById("create_customer_search");

    const resultText =
        document.getElementById("customerSearchResultText");

    const searchValue =
        (searchInput?.value || "").trim().toLowerCase();

    const rows = Array.from(
        document.querySelectorAll(".create-checklist-order-row")
    );

    let visibleCount = 0;

    rows.forEach(row => {
        const customerName =
            (row.dataset.customerName || "").toLowerCase();

        const isMatch =
            searchValue === "" ||
            customerName.includes(searchValue);

        row.style.display = isMatch ? "" : "none";

        if (isMatch) {
            visibleCount++;
        }
    });

    if (resultText) {
        if (rows.length === 0) {
            resultText.textContent = "";
        } else if (searchValue === "") {
            resultText.textContent =
                `${rows.length} order line(s) available`;
        } else {
            resultText.textContent =
                `${visibleCount} of ${rows.length} order line(s) shown`;
        }
    }

    updateSelectAllOrdersState();
}

function updateSelectAllOrdersState() {
    const selectAll =
        document.getElementById("selectAllOrders");

    if (!selectAll) return;

    const visibleCheckboxes = Array.from(
        document.querySelectorAll(
            ".create-checklist-order-row:not([style*='display: none']) " +
            ".checklist-line-checkbox"
        )
    );

    if (visibleCheckboxes.length === 0) {
        selectAll.checked = false;
        selectAll.indeterminate = false;
        return;
    }

    const checkedCount =
        visibleCheckboxes.filter(cb => cb.checked).length;

    selectAll.checked =
        checkedCount === visibleCheckboxes.length;

    selectAll.indeterminate =
        checkedCount > 0 &&
        checkedCount < visibleCheckboxes.length;
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
        <tr class="create-checklist-order-row"
            data-customer-name="${escapeAttribute(item.customer_name ?? "")}">
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
                            data-product-description="${escapeAttribute(item.product_description ?? "")}"

                            data-uom="${escapeAttribute(item.uom ?? "")}"
data-pack-uom="${escapeAttribute(item.pack_uom ?? "")}"
data-pack-qty="${toNumber(item.pack_qty)}"
                           
                            data-required-qty="${toNumber(item.required_qty)}"
                            data-allocated-qty="${toNumber(item.allocated_qty)}"
                           data-checklist-qty="${toNumber(item.allocated_qty)}"
                        >
                    </td>
                    <td>${escapeHtml(item.order_no ?? "")}</td>
                    <td>${escapeHtml(item.customer_name ?? "-")}</td>
                    <td>${escapeHtml(item.route_name ?? "-")}</td>
                    <td>
    <div>${escapeHtml(item.product_name ?? "-")}</div>
    ${item.product_description
                    ? `<div class="text-muted small">${escapeHtml(item.product_description)}</div>`
                    : ""}
</td>
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


        filterCreateChecklistCustomers();


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
            product_description: cb.dataset.productDescription || "",
            uom: cb.dataset.uom || "",
            pack_uom: cb.dataset.packUom || "",
            pack_qty: parseFloat(cb.dataset.packQty || "0") || null,
           
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
    const customerSearch =
        document.getElementById("create_customer_search");

    const customerSearchResult =
        document.getElementById("customerSearchResultText");

    if (customerSearch) customerSearch.value = "";
    if (customerSearchResult) customerSearchResult.textContent = "";
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
        window.currentChecklistDetails = data;
        window.currentChecklistLines = data.lines || [];
        setChecklistButtons(data.status);
        setChecklistTripEditButton(data.status);
        document.getElementById("view_checklist_no").textContent = data.checklist_no ?? "-";
        document.getElementById("view_route").textContent = data.route_name ?? "-";
        document.getElementById("view_truck").textContent = data.truck_name ?? "-";
        document.getElementById("view_driver").textContent = data.driver_name ?? "-";

        const tbody = document.getElementById("viewChecklistLinesBody");

        if (!tbody) return;

        if (!Array.isArray(data.lines) || data.lines.length === 0) {
            tbody.innerHTML = `
        <tr>
            <td colspan="9" class="text-center text-muted">No data</td>
        </tr>
    `;
        } else {
            //let rows = "";

//            data.lines.forEach(line => {
//                rows += `
//<tr>
//    <td>${escapeHtml(line.customer_name ?? "-")}</td>

//    <td>
//        <div>${escapeHtml(line.product_name ?? "-")}</div>
//        ${line.product_description
//                        ? `<div class="text-muted small">${escapeHtml(line.product_description)}</div>`
//                        : ""}
//    </td>

//    <td>
//        ${escapeHtml(line.branch_name ?? "-")}
//    </td>

//    <td>${escapeHtml(line.lot_no ?? "-")}</td>

//    <td>${formatDate(line.manufacturing_date)}</td>

//    <td>${formatDate(line.expiration_date)}</td>

//    <td>${formatChecklistQty(line)}</td>

//   <td>${getStatusBadge(line.status)}</td>

//<td class="text-center">
//    ${(line.status || "").toUpperCase() === "READY" ? `
//        <div class="btn-group btn-group-sm">
//            <button class="btn btn-outline-warning"
//        onclick="editChecklistLine(${line.checklist_line_id || line.line_id})">
//    Replace Lot
//</button>

//            <button class="btn btn-outline-success"
//                    onclick="openCompleteLineModal(${line.checklist_line_id || line.line_id})">
//                Complete
//            </button>
//        </div>
//    ` : `
//        <span class="text-success small">
//            <i class="bi bi-check-circle"></i> Completed
//        </span>
//    `}
//</td>
//</tr>

//`;
            //            });


            let rows = "";

            const customers = {};

            data.lines.forEach(line => {
                const customerKey = line.customer_name || "NO CUSTOMER";

                if (!customers[customerKey]) {
                    customers[customerKey] = {
                        customer_name: line.customer_name || "-",
                        lines: []
                    };
                }

                customers[customerKey].lines.push(line);
            });

            Object.values(customers).forEach((customer, customerIndex) => {

                const readyCount = customer.lines.filter(x =>
                    (x.status || "").toUpperCase() === "READY"
                ).length;

                const completedCount = customer.lines.length - readyCount;

                const isFullyCompleted = readyCount === 0;

                rows += `
<tr class="${isFullyCompleted ? "table-success" : "table-dark"}">
    <td colspan="9">
       <div class="d-flex justify-content-between align-items-center mb-2">
    <div>
        <div class="fw-bold">
            ${isFullyCompleted ? "✓ " : ""}
            ${escapeHtml(customer.customer_name)}
        </div>

        <small>
            Ready: ${readyCount} |
            Completed: ${completedCount}
        </small>
    </div>

    <div class="d-flex gap-2 align-items-center">

        ${isFullyCompleted ? `
            <span class="badge bg-success">
                Customer Fully Delivered
            </span>
        ` : ""}

        ${completedCount === 0 ? `
            <button type="button"
                    class="btn btn-outline-danger btn-sm"
                    onclick="removeChecklistCustomer(
                        '${escapeAttribute(customer.customer_name)}'
                    )">
                <i class="bi bi-person-dash"></i>
                Remove Customer
            </button>
        ` : `
            <button type="button"
                    class="btn btn-outline-secondary btn-sm"
                    disabled
                    title="Completed lines cannot be removed">
                <i class="bi bi-lock"></i>
                Cannot Remove
            </button>
        `}
    </div>
</div>

        ${readyCount > 0 ? `
            <div class="row g-2 align-items-end">
                <div class="col-md-3">
                    <label class="small">DR No *</label>
                    <input type="text"
                           class="form-control form-control-sm"
                           id="cust_dr_${customerIndex}"
                           oninput="toggleCompleteCustomerButton(${customerIndex})">
                </div>

                <div class="col-md-3">
                    <label class="small">Invoice No</label>
                    <input type="text"
                           class="form-control form-control-sm"
                           id="cust_inv_${customerIndex}">
                </div>

                <div class="col-md-3">
                    <label class="small">PO No</label>
                    <input type="text"
                           class="form-control form-control-sm"
                           id="cust_po_${customerIndex}">
                </div>

                <div class="col-md-3">
                    <button id="btnCompleteCustomer_${customerIndex}"
                            class="btn btn-success btn-sm w-100"
                            disabled
                            onclick="completeCustomer('${escapeAttribute(customer.customer_name)}', ${customerIndex})">
                        Complete Ready Lines
                    </button>
                </div>
            </div>
        ` : ""}
    </td>
</tr>`;

                const products = {};

                customer.lines.forEach(line => {
                    const productKey = `${line.product_id || ""}|${line.product_name || ""}|${line.product_description || ""}`;

                    if (!products[productKey]) {
                        products[productKey] = {
                            product_name: line.product_name || "-",
                            product_description: line.product_description || "",
                            uom: line.uom || "",
                            lines: [],
                            total_qty: 0
                        };
                    }

                    products[productKey].lines.push(line);
                    products[productKey].total_qty += Number(line.checklist_qty || 0);
                });

                Object.values(products).forEach(product => {

                    rows += `
            <tr class="table-secondary">
                <td colspan="9">
                    <div class="fw-bold">${escapeHtml(product.product_name)}</div>
                    ${product.product_description
                            ? `<div class="text-muted small">${escapeHtml(product.product_description)}</div>`
                            : ""
                        }
                </td>
            </tr>
        `;

                    product.lines.forEach(line => {
                        rows += `
                <tr>
                    <td></td>

                    <td>
                        <span class="text-muted small">Lot item</span>
                    </td>

                    <td>${escapeHtml(line.branch_name ?? "-")}</td>

                    <td>
                        <div>${escapeHtml(line.lot_no ?? "-")}</div>
                        ${line.dr_no
                                ? `<div class="text-muted small">DR: ${escapeHtml(line.dr_no)}</div>`
                                : ""
                            }
                    </td>

                    <td>${formatDate(line.manufacturing_date)}</td>
                    <td>${formatDate(line.expiration_date)}</td>
                    <td>${formatChecklistQty(line)}</td>
                    <td>${getStatusBadge(line.status)}</td>

                    <td class="text-center">
                        ${(line.status || "").toUpperCase() === "READY" ? `
                            <div class="btn-group btn-group-sm">
                                <button class="btn btn-outline-warning"
                                        onclick="editChecklistLine(${line.checklist_line_id || line.line_id})">
                                    Replace Lot
                                </button>

                                <button class="btn btn-outline-success"
                                        onclick="openCompleteLineModal(${line.checklist_line_id || line.line_id})">
                                    Complete
                                </button>

                                <button class="btn btn-sm btn-outline-danger"
                                         onclick="deleteChecklistLine(${line.checklist_line_id})">
                                    Delete
                                </button>


                            </div>
                        ` : `
                            <span class="text-success small">
                                <i class="bi bi-check-circle"></i> Completed
                            </span>
                        `}
                    </td>
                </tr>
            `;
                    });

                    rows += `
            <tr class="table-light">
                <td colspan="6" class="text-end fw-bold">
                    Total for ${escapeHtml(product.product_name)}:
                </td>
                <td class="fw-bold">
                    ${toDisplayNumber(product.total_qty)} ${escapeHtml(product.uom)}
                </td>
                <td colspan="2"></td>
            </tr>
        `;
                });
            });

            tbody.innerHTML = rows;

          
        }

        checklistModalInstance = bootstrap.Modal.getOrCreateInstance(
            document.getElementById("viewChecklistModal")
        );

        checklistModalInstance.show();
    } catch (error) {
        console.error("Error loading checklist details:", error);
        alert("Failed to load checklist details.");
    }
}

function openEditChecklistTripModal() {
    const data = window.currentChecklistDetails;

    if (!data || !window.currentChecklistId) {
        alert("No checklist selected.");
        return;
    }

    document.getElementById(
        "edit_trip_checklist_id"
    ).value = window.currentChecklistId;

    document.getElementById(
        "edit_trip_route"
    ).value = data.route_name || "";

    document.getElementById(
        "edit_trip_truck"
    ).value = data.truck_name || "";

    document.getElementById(
        "edit_trip_driver"
    ).value = data.driver_name || "";

    document
        .getElementById("viewChecklistModal")
        ?.classList.add("modal-parent-dim");

    bootstrap.Modal.getOrCreateInstance(
        document.getElementById(
            "editChecklistTripModal"
        ),
        {
            backdrop: false,
            keyboard: true
        }
    ).show();
}

function setChecklistTripEditButton(status) {
    const button =
        document.getElementById(
            "btnEditChecklistTrip"
        );

    if (!button) return;

    const normalizedStatus =
        (status || "").trim().toUpperCase();

    const editableStatuses = [
        "READY",
        "LOADING",
        "PARTIALLY_COMPLETED",
        "PARTIAL"
    ];

    button.style.display =
        editableStatuses.includes(normalizedStatus)
            ? "inline-block"
            : "none";
}

async function openAddChecklistCustomerModal() {
    if (!window.currentChecklistId) {
        alert("No checklist selected.");
        return;
    }

    const parentModal =
        document.getElementById("viewChecklistModal");

    parentModal?.classList.add("modal-parent-dim");

    const modalElement =
        document.getElementById("addChecklistCustomerModal");

    bootstrap.Modal.getOrCreateInstance(
        modalElement,
        {
            backdrop: false,
            keyboard: true
        }
    ).show();

    document.getElementById(
        "addChecklistCustomerSearch"
    ).value = "";

    await loadAvailableCustomersForChecklist();
}
async function loadAvailableCustomersForChecklist() {
    const tbody =
        document.getElementById(
            "addChecklistCustomerTableBody"
        );

    if (!tbody) return;

    tbody.innerHTML = `
        <tr>
            <td colspan="9"
                class="text-center text-muted py-3">
                Loading...
            </td>
        </tr>
    `;

    try {
        const response = await fetch(
            `/DeliveryChecklist/GetAvailableLinesForChecklist` +
            `?checklistId=${window.currentChecklistId}`
        );

        const resultText = await response.text();

        let data;

        try {
            data = JSON.parse(resultText);
        } catch {
            throw new Error(
                resultText ||
                "Invalid server response."
            );
        }

        if (!response.ok) {
            throw new Error(
                data?.message ||
                "Failed to load available customers."
            );
        }

        if (!Array.isArray(data) || data.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="9"
                        class="text-center text-muted py-3">
                        No available allocated order lines found.
                    </td>
                </tr>
            `;

            updateAddChecklistCustomerResult();
            return;
        }

        let rows = "";

        data.forEach(item => {
            rows += `
                <tr class="add-checklist-customer-row"
                    data-customer-name="${escapeAttribute(
                item.customer_name ?? ""
            )
                }">

                    <td>
                        <input type="checkbox"
                               class="form-check-input
                                      add-checklist-line-checkbox"

                               data-order-id="${item.order_id
                }"

                               data-order-no="${escapeAttribute(
                    item.order_no ?? ""
                )
                }"

                               data-order-line-id="${item.order_line_id
                }"

                               data-customer-id="${escapeAttribute(
                    item.customer_id ?? ""
                )
                }"

                               data-customer-name="${escapeAttribute(
                    item.customer_name ?? ""
                )
                }"

                               data-product-id="${escapeAttribute(
                    item.product_id ?? ""
                )
                }"

                               data-product-name="${escapeAttribute(
                    item.product_name ?? ""
                )
                }"

                               data-product-description="${escapeAttribute(
                    item.product_description ?? ""
                )
                }"

                               data-uom="${escapeAttribute(
                    item.uom ?? ""
                )
                }"

                               data-pack-uom="${escapeAttribute(
                    item.pack_uom ?? ""
                )
                }"

                               data-pack-qty="${toNumber(item.pack_qty)
                }"

                               data-required-qty="${toNumber(item.required_qty)
                }"

                               data-allocated-qty="${toNumber(item.allocated_qty)
                }"

                               data-checklist-qty="${toNumber(item.allocated_qty)
                }">
                    </td>

                    <td>
                        ${escapeHtml(item.order_no ?? "")}
                    </td>

                    <td>
                        ${escapeHtml(item.customer_name ?? "-")}
                    </td>

                    <td>
                        ${escapeHtml(item.route_name ?? "-")}
                    </td>

                    <td>
                        <div>
                            ${escapeHtml(
                    item.product_name ?? "-"
                )}
                        </div>

                        ${item.product_description
                    ? `
                                <div class="text-muted small">
                                    ${escapeHtml(
                        item.product_description
                    )}
                                </div>
                              `
                    : ""}
                    </td>

                    <td>
                        ${toDisplayNumber(item.required_qty)}
                    </td>

                    <td>
                        ${toDisplayNumber(item.allocated_qty)}
                    </td>

                    <td>
                        ${formatDate(item.delivery_date)}
                    </td>

                    <td>
                        ${getAllocationBadge(
                        item.allocation_status
                    )}
                    </td>
                </tr>
            `;
        });

        tbody.innerHTML = rows;

        const selectAll =
            document.getElementById(
                "selectAllAddChecklistLines"
            );

        if (selectAll) {
            selectAll.checked = false;
            selectAll.indeterminate = false;
        }

        filterAddChecklistCustomers();

    } catch (error) {
        console.error(
            "Load available checklist customers:",
            error
        );

        tbody.innerHTML = `
            <tr>
                <td colspan="9"
                    class="text-center text-danger py-3">
                    ${escapeHtml(
            error.message ||
            "Failed to load available customers."
        )}
                </td>
            </tr>
        `;
    }
}
document.addEventListener("input", function (event) {
    if (
        event.target.id ===
        "addChecklistCustomerSearch"
    ) {
        filterAddChecklistCustomers();
    }
});

function filterAddChecklistCustomers() {
    const search =
        document.getElementById(
            "addChecklistCustomerSearch"
        )?.value.trim().toLowerCase() || "";

    const rows = Array.from(
        document.querySelectorAll(
            ".add-checklist-customer-row"
        )
    );

    let visibleCount = 0;

    rows.forEach(row => {
        const customer =
            (row.dataset.customerName || "")
                .toLowerCase();

        const visible =
            !search || customer.includes(search);

        row.style.display = visible ? "" : "none";

        if (visible) {
            visibleCount++;
        }
    });

    updateAddChecklistCustomerResult(
        visibleCount,
        rows.length,
        search
    );
}

function updateAddChecklistCustomerResult(
    visibleCount = 0,
    totalCount = 0,
    search = ""
) {
    const text =
        document.getElementById(
            "addChecklistCustomerResultText"
        );

    if (!text) return;

    if (totalCount === 0) {
        text.textContent = "No available lines";
    } else if (!search) {
        text.textContent =
            `${totalCount} order line(s) available`;
    } else {
        text.textContent =
            `${visibleCount} of ${totalCount} ` +
            `order line(s) shown`;
    }
}

function clearAddChecklistCustomerSearch() {
    const input =
        document.getElementById(
            "addChecklistCustomerSearch"
        );

    if (input) {
        input.value = "";
        input.focus();
    }

    filterAddChecklistCustomers();
}
async function submitAddChecklistCustomers() {
    if (!window.currentChecklistId) {
        alert("No checklist selected.");
        return;
    }

    const selected = Array.from(
        document.querySelectorAll(
            ".add-checklist-line-checkbox:checked"
        )
    );

    if (selected.length === 0) {
        alert(
            "Please select at least one order line."
        );
        return;
    }

    const lines = selected.map(cb => ({
        order_id:
            parseInt(cb.dataset.orderId || "0"),

        order_no:
            cb.dataset.orderNo || "",

        order_line_id:
            parseInt(cb.dataset.orderLineId || "0"),

        customer_id:
            cb.dataset.customerId || "",

        customer_name:
            cb.dataset.customerName || "",

        product_id:
            cb.dataset.productId || "",

        product_name:
            cb.dataset.productName || "",

        product_description:
            cb.dataset.productDescription || "",

        uom:
            cb.dataset.uom || "",

        pack_uom:
            cb.dataset.packUom || "",

        pack_qty:
            parseFloat(cb.dataset.packQty || "0") ||
            null,

        required_qty:
            parseFloat(
                cb.dataset.requiredQty || "0"
            ),

        allocated_qty:
            parseFloat(
                cb.dataset.allocatedQty || "0"
            ),

        checklist_qty:
            parseFloat(
                cb.dataset.checklistQty || "0"
            )
    }));

    if (
        !confirm(
            `Add ${lines.length} order line(s) ` +
            `to this checklist?`
        )
    ) {
        return;
    }

    const button =
        document.getElementById(
            "btnConfirmAddChecklistCustomer"
        );

    if (button) {
        button.disabled = true;
    }

    try {
        const response = await fetch(
            "/DeliveryChecklist/AddLinesToChecklist",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    checklist_id:
                        window.currentChecklistId,
                    lines: lines
                })
            }
        );

        const resultText = await response.text();

        let result;

        try {
            result = JSON.parse(resultText);
        } catch {
            result = {
                message: resultText
            };
        }

        if (!response.ok || result.success === false) {
            throw new Error(
                result.message ||
                "Failed to add customer."
            );
        }

        alert(
            result.message ||
            "Customer added successfully."
        );

        bootstrap.Modal.getInstance(
            document.getElementById(
                "addChecklistCustomerModal"
            )
        )?.hide();

        await openViewChecklistModal(
            window.currentChecklistId
        );

        await loadChecklistList();

    } catch (error) {
        console.error(
            "Add checklist customer:",
            error
        );

        alert(
            error.message ||
            "Failed to add customer."
        );
    } finally {
        if (button) {
            button.disabled = false;
        }
    }
}
async function removeChecklistCustomer(customerName) {
    if (!window.currentChecklistId) {
        alert("No checklist selected.");
        return;
    }

    const customerLines =
        window.currentChecklistLines?.filter(
            line =>
                (line.customer_name || "") ===
                customerName
        ) || [];

    if (customerLines.length === 0) {
        alert("Customer lines were not found.");
        return;
    }

    const completedLines =
        customerLines.filter(
            line =>
                (line.status || "")
                    .toUpperCase() !== "READY"
        );

    if (completedLines.length > 0) {
        alert(
            "This customer cannot be removed because " +
            "one or more lines are already completed."
        );
        return;
    }

    if (
        !confirm(
            `Remove ${customerName} and all ` +
            `${customerLines.length} associated line(s) ` +
            `from this checklist?`
        )
    ) {
        return;
    }

    try {
        const response = await fetch(
            "/DeliveryChecklist/RemoveCustomerFromChecklist",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    checklist_id:
                        window.currentChecklistId,
                    customer_name:
                        customerName
                })
            }
        );

        const resultText = await response.text();

        let result;

        try {
            result = JSON.parse(resultText);
        } catch {
            result = {
                message: resultText
            };
        }

        if (!response.ok || result.success === false) {
            throw new Error(
                result.message ||
                "Failed to remove customer."
            );
        }

        alert(
            result.message ||
            "Customer removed successfully."
        );

        if (result.checklist_deleted === true) {
            bootstrap.Modal.getInstance(
                document.getElementById(
                    "viewChecklistModal"
                )
            )?.hide();

            window.currentChecklistId = null;

            await loadChecklistList();
            return;
        }

        await openViewChecklistModal(
            window.currentChecklistId
        );

        await loadChecklistList();

    } catch (error) {
        console.error(
            "Remove checklist customer:",
            error
        );

        alert(
            error.message ||
            "Failed to remove customer."
        );
    }
}
async function completeCustomer(customerName, customerIndex) {
    const drNo = document.getElementById(`cust_dr_${customerIndex}`)?.value.trim() || "";
    const invNo = document.getElementById(`cust_inv_${customerIndex}`)?.value.trim() || "";
    const poNo = document.getElementById(`cust_po_${customerIndex}`)?.value.trim() || "";

    if (!drNo) {
        alert("DR No is required.");
        return;
    }

    if (!confirm(`Complete all READY lines for ${customerName}?`)) {
        return;
    }

    const payload = {
        checklist_id: window.currentChecklistId,
        customer_name: customerName,
        adjusted_by: window.currentUserName || window.currentUserId || "UNKNOWN",
        dr_no: drNo,
        inv_no: invNo,
        po_no: poNo,
        remarks: ""
    };

    const response = await fetch("/DeliveryChecklist/CompleteCustomer", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
    });

    const result = await response.json();

    if (!response.ok || result.success === false) {
        alert(result.message || "Failed to complete customer.");
        return;
    }

    alert(result.message || "Customer completed.");

    await openViewChecklistModal(window.currentChecklistId);
    await loadChecklistList();
}
function toggleCompleteCustomerButton(customerIndex) {
    const drNo = document.getElementById(`cust_dr_${customerIndex}`)?.value.trim() || "";
    const btn = document.getElementById(`btnCompleteCustomer_${customerIndex}`);

    if (btn) {
        btn.disabled = drNo === "";
    }
}
async function submitCompleteLine() {
    const line = window.currentCompleteLine;

    if (!line) {
        alert("No checklist line selected.");
        return;
    }

    const payload = {
        checklist_id: window.currentChecklistId,
        checklist_line_id: Number(document.getElementById("complete_line_id").value),

        product_id: line.product_id,
        lot_no: line.lot_no,
        branch_id: line.branch_id,

        adjustment_type: "DEDUCT",
        quantity: Number(document.getElementById("complete_quantity_out").value),
        adjusted_by: window.currentUserName || window.currentUserId || "UNKNOWN",

        reference_type: "DELIVERY_CHECKLIST",
        dr_no: document.getElementById("complete_dr_no").value.trim(),
        inv_no: document.getElementById("complete_inv_no").value.trim(),
        po_no: document.getElementById("complete_po_no").value.trim(),
        remarks: document.getElementById("complete_remarks").value.trim()
    };

    if (!payload.quantity || payload.quantity <= 0) {
        alert("Quantity Out must be greater than zero.");
        return;
    }

    if (!payload.dr_no) {
        alert("DR No is required.");
        return;
    }

    if (!confirm("Save and complete this checklist line?")) {
        return;
    }

    const response = await fetch("/DeliveryChecklist/CompleteLine", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
    });

    const result = await response.json();

    if (!response.ok || result.success === false) {
        throw new Error(result.message || "Failed to complete checklist line.");
    }

    alert(result.message || "Checklist line completed.");

    bootstrap.Modal.getInstance(document.getElementById("completeLineModal"))?.hide();

    await openViewChecklistModal(window.currentChecklistId);
    await loadChecklistList();
}
async function editChecklistLine(lineId) {
    console.log("Replace lot clicked:", lineId);

    const line = window.currentChecklistLines?.find(x =>
        Number(x.checklist_line_id || x.line_id) === Number(lineId)
    );

    if (!line) {
        alert("Line not found.");
        return;
    }

    window.currentEditChecklistLine = line;

    document.getElementById("editLotChecklistLineId").value = lineId;
    document.getElementById("editLotProductText").textContent =
        `${line.product_name || ""} - Current Lot: ${line.lot_no || "-"}`;

    document.getElementById("editLotRequiredQty").innerText =
        `${toDisplayNumber(line.checklist_qty)} ${line.uom || ""}`;

    document.getElementById("editLotTotalAllocation").innerText =
        `0 ${line.uom || ""}`;

    document.getElementById("editLotRemainingQty").innerText =
        `${toDisplayNumber(line.checklist_qty)} ${line.uom || ""}`;

    document.getElementById("editLotReason").value = "";

    const tbody = document.getElementById("editChecklistLotTableBody");
    tbody.innerHTML = `
        <tr>
            <td colspan="8" class="text-center text-muted">Loading...</td>
        </tr>
    `;

    document.activeElement?.blur();

    document
        .getElementById("viewChecklistModal")
        ?.classList.add("modal-parent-dim");

    bootstrap.Modal.getOrCreateInstance(
        document.getElementById("editChecklistLotModal"),
        {
            backdrop: false,
            keyboard: true
        }
    ).show();

    try {
        const response = await fetch(`/DeliveryChecklist/GetAvailableLotsForChecklistLine?checklistLineId=${lineId}`);

        if (!response.ok) {
            throw new Error("Failed to load available lots.");
        }

        const data = await response.json();

        if (!Array.isArray(data) || data.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center text-muted">No available lots found.</td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = `
            <tr class="table-primary">
                <td colspan="8">
                    <div class="d-flex justify-content-between">
                        <div>
                            <strong>${escapeHtml(line.product_name || "-")}</strong>
                            ${line.product_description
                ? `<div class="small text-muted">${escapeHtml(line.product_description)}</div>`
                : ""}
                            <div class="small">
                                Current Lot:
                                <strong>${escapeHtml(line.lot_no || "-")}</strong>
                            </div>
                        </div>

                        <div class="text-end">
                            <div>
                                Checklist Qty:
                                <strong>${toDisplayNumber(line.checklist_qty)} ${escapeHtml(line.uom || "")}</strong>
                            </div>
                            <div>
                                Current Warehouse:
                                <strong>${escapeHtml(line.branch_name || line.branch_id || "-")}</strong>
                            </div>
                        </div>
                    </div>
                </td>
            </tr>
        `;

        data.forEach(lot => {
            const maxQty = Number(lot.available_qty || 0);

            tbody.innerHTML += `
                <tr>
                    <td>${escapeHtml(lot.lot_no || "")}</td>
                    <td>${escapeHtml(lot.branch_name || lot.branch_id || "")}</td>
                    <td>${formatDate(lot.manufacturing_date)}</td>
                    <td>${formatDate(lot.expiration_date)}</td>
                    <td>${toDisplayNumber(lot.on_hand_qty)}</td>
                    <td>${toDisplayNumber(lot.reserved_qty)}</td>
                    <td>${toDisplayNumber(lot.available_qty)}</td>
                    <td style="width:140px;">
                        <input type="number"
                               class="form-control edit-lot-qty-input"
                               min="0"
                               max="${maxQty}"
                               step="0.01"
                               value="0"
                               data-lot-no="${escapeAttribute(lot.lot_no || "")}"
                               data-branch-id="${escapeAttribute(lot.branch_id || "")}"
                               data-max="${maxQty}">
                    </td>
                </tr>
            `;
        });

        computeEditLotTotal();

    } catch (error) {
        console.error("Replace lot load error:", error);

        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center text-danger">
                    ${escapeHtml(error.message || "Failed to load available lots.")}
                </td>
            </tr>
        `;
    }
}


document.addEventListener("input", function (e) {
    if (!e.target.classList.contains("edit-lot-qty-input")) return;

    const max = Number(e.target.dataset.max || 0);
    let value = Number(e.target.value || 0);

    if (value > max) {
        e.target.value = max;
    }

    computeEditLotTotal();
});

async function saveChecklistLotReplacement() {
    const line = window.currentEditChecklistLine;

    if (!line) {
        alert("No checklist line selected.");
        return;
    }

    const required = Number(line.checklist_qty || 0);
    let total = 0;

    const lots = [];

    document.querySelectorAll(".edit-lot-qty-input").forEach(input => {
        const qty = Number(input.value || 0);

        if (qty > 0) {
            total += qty;

            lots.push({
                lot_no: input.dataset.lotNo,
                branch_id: input.dataset.branchId,
                qty: qty
            });
        }
    });

    if (lots.length === 0) {
        alert("Please allocate at least one lot.");
        return;
    }

    if (Math.abs(total - required) > 0.0001) {
        alert(`Total allocation must equal checklist qty.\nRequired: ${required}\nTotal: ${total}`);
        return;
    }

    const reason = document.getElementById("editLotReason").value.trim();

    if (!reason) {
        alert("Please enter replacement reason.");
        return;
    }

    const payload = {
        checklist_line_id: Number(line.checklist_line_id || line.line_id),
        reason: reason,
        lots: lots
    };

    const response = await fetch("/DeliveryChecklist/ReplaceChecklistLots", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
    });

    const result = await response.json();

    if (!response.ok || result.success === false) {
        alert(result.message || "Failed to save replacement.");
        return;
    }

    alert(result.message || "Replacement saved.");

    bootstrap.Modal.getInstance(document.getElementById("editChecklistLotModal"))?.hide();

    await openViewChecklistModal(window.currentChecklistId);
}

function computeEditLotTotal() {
    const line = window.currentEditChecklistLine;
    if (!line) return;

    const required = Number(line.checklist_qty || 0);
    let total = 0;

    document.querySelectorAll(".edit-lot-qty-input").forEach(input => {
        total += Number(input.value || 0);
    });

    const remaining = Math.max(required - total, 0);
    const uom = line.uom || "";

    document.getElementById("editLotTotalAllocation").innerText =
        `${toDisplayNumber(total)} ${uom}`;

    document.getElementById("editLotRemainingQty").innerText =
        `${toDisplayNumber(remaining)} ${uom}`;
}


//async function selectChecklistLot(lotNo, branchId) {
//    const checklistLineId = Number(document.getElementById("editLotChecklistLineId").value);

//    if (!confirm(`Use lot ${lotNo} for this checklist line?`)) return;

//    const payload = {
//        checklist_line_id: checklistLineId,
//        lot_no: lotNo,
//        branch_id: branchId
//    };

//    const response = await fetch("/DeliveryChecklist/UpdateChecklistLineLot", {
//        method: "POST",
//        headers: { "Content-Type": "application/json" },
//        body: JSON.stringify(payload)
//    });

//    const result = await response.json();

//    if (!response.ok || result.success === false) {
//        alert(result.message || "Failed to update lot.");
//        return;
//    }

//    alert(result.message || "Lot updated.");

//    bootstrap.Modal.getInstance(document.getElementById("editChecklistLotModal"))?.hide();
//    await openViewChecklistModal(window.currentChecklistId);
//}


function openCompleteLineModal(lineId) {
  
    const line = window.currentChecklistLines?.find(x =>
        Number(x.checklist_line_id || x.line_id) === Number(lineId)
    );

    if (!line) {
        alert("Line not found.");
        return;
    }

    // IMPORTANT
    window.currentCompleteLine = line;

    document.getElementById("complete_line_id").value = lineId;

    document.getElementById("complete_line_id").value = lineId;
    document.getElementById("complete_customer_text").textContent = line.customer_name || "-";
    document.getElementById("complete_product_text").textContent = line.product_name || "-";
    document.getElementById("complete_product_description_text").textContent =
        line.product_description || "";
    document.getElementById("complete_warehouse_text").textContent = line.branch_name || "-";
    document.getElementById("complete_lot_no_text").textContent = line.lot_no || "-";
    document.getElementById("complete_available_qty_text").textContent = formatChecklistQty(line);

    document.getElementById("complete_quantity_out").value = Number(line.checklist_qty || 0);

    document.getElementById("complete_dr_no").value = "";
    document.getElementById("complete_inv_no").value = "";
    document.getElementById("complete_po_no").value = "";
    document.getElementById("complete_remarks").value = "";

    const modalEl = document.getElementById("completeLineModal");

    let modal = bootstrap.Modal.getInstance(modalEl);

    if (!modal) {
        modal = new bootstrap.Modal(modalEl);
    }

    document
        .getElementById("viewChecklistModal")
        .classList.add("modal-parent-dim");

    modal.show();
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

function formatChecklistQty(line) {
    const qty = Number(line.checklist_qty || 0);
    const packQty = Number(line.pack_qty || 0);
    const packUom = (line.pack_uom || "").toUpperCase();
    const uom = line.uom || "";

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

    return escapeHtml(`${qtyText} ${uom} = (${breakdown})`.trim());
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
        cleanupBootstrapModal();

    } catch (error) {
        console.error("Error deleting checklist:", error);
        alert(error.message || "Failed to delete checklist.");
        cleanupBootstrapModal();
    }
}

function cleanupBootstrapModal() {
    document.body.classList.remove("modal-open");
    document.body.style.removeProperty("overflow");
    document.body.style.removeProperty("padding-right");

    document.querySelectorAll(".modal-backdrop").forEach(x => x.remove());

    document.getElementById("replacementBackdrop")?.remove();
}