let mprfListCache = [];
let currentPage = 1;
const pageSize = 10;

let mprfAutoRefreshTimer = null;
const mprfAutoRefreshSeconds = 30;

document.addEventListener("DOMContentLoaded", function () {
    const mprfTableBody = document.getElementById("mprfTableBody");
    const mprfLinesBody = document.getElementById("mprfLinesBody");

    if (mprfTableBody) {
        loadMprfList();
        startMprfAutoRefresh();
    }

    if (mprfLinesBody) {
        const pageMode = document.getElementById("pageMode")?.value;
        const mprfId = document.getElementById("mprfId")?.value;

        if (pageMode === "EDIT" && mprfId) {
            loadMprfForEdit(mprfId);
        } else {
            setDefaultDates();
            addLine();
        }
    }



    document.getElementById("searchMprf")?.addEventListener("input", function () {
        currentPage = 1;
        renderMprfList();
    });

    document.getElementById("statusFilter")?.addEventListener("change", function () {
        currentPage = 1;
        renderMprfList();
    });



});

function startMprfAutoRefresh() {
    if (mprfAutoRefreshTimer) {
        clearInterval(mprfAutoRefreshTimer);
    }

    console.log("MPRF auto refresh started");

    mprfAutoRefreshTimer = setInterval(() => {
        console.log("Refreshing MPRF list...");

        if (document.querySelector(".modal.show")) return;
        if (document.querySelector(".dropdown-menu.show")) return;

        loadMprfList(false);

    }, 5000);
}



async function loadMprfForEdit(id) {
    try {
        const response = await fetch(`/purchasing/mprf/${id}`);

        if (!response.ok) {
            alert("Failed to load MPRF.");
            window.location.href = "/purchasing/mprf";
            return;
        }

        const data = await response.json();

        document.getElementById("mprfNo").value = data.mprf_no ?? "";
        document.getElementById("category").value = data.category ?? "";
        document.getElementById("requestDate").value = toInputDate(data.request_date);
        document.getElementById("week").value = data.week ?? "";

        const tbody = document.getElementById("mprfLinesBody");
        tbody.innerHTML = "";

        if (!data.lines || data.lines.length === 0) {
            addLine();
            return;
        }

        data.lines.forEach(line => {
            addLine();

            const row = tbody.lastElementChild;

            row.querySelector(".material-id").value = line.material_id ?? "";
            row.querySelector(".material-search").value = formatMaterial(line);
            row.querySelector(".classification").value = formatClassification(line);
            row.querySelector(".qty-on-hand").value = line.qty_on_hand ?? 0;
            row.querySelector(".uom").value = line.uom ?? "";
            row.querySelector(".line-remarks").value = line.remarks ?? "";
        });

    } catch (error) {
        console.error(error);
        alert("Error loading MPRF.");
        window.location.href = "/purchasing/mprf";
    }
}

function toInputDate(value) {
    if (!value) return "";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "";

    return date.toISOString().split("T")[0];
}

function setDefaultDates() {
    const today = new Date().toISOString().split("T")[0];
    document.getElementById("requestDate").value = today;

    updateWeek();

    document
        .getElementById("requestDate")
        .addEventListener("change", updateWeek);
}

function updateWeek() {
    const dateValue = document.getElementById("requestDate").value;
    if (!dateValue) return;

    const day = new Date(dateValue).getDate();

    let week = "";

    if (day <= 7) week = "1st";
    else if (day <= 14) week = "2nd";
    else if (day <= 21) week = "3rd";
    else if (day <= 28) week = "4th";
    else week = "5th";

    const weekInput = document.getElementById("week");

    if (!weekInput.value.trim()) {
        weekInput.value = week;
    }
}

// =========================
// MPRF LIST
// =========================

//async function loadMprfList() {
//    const tbody = document.getElementById("mprfTableBody");

//    try {
//        const response = await fetch("/purchasing/mprf/list");
//        const data = await response.json();

//        if (!data || data.length === 0) {
//            tbody.innerHTML = `
//                <tr>
//                    <td colspan="7" class="text-center text-muted py-4">
//                        No MPRF requests found.
//                    </td>
//                </tr>`;
//            return;
//        }

//        tbody.innerHTML = data.map(item => `
//            <tr>


//                <td>${escapeHtml(item.mprf_no ?? "")}</td>
//                <td>${formatDate(item.request_date)}</td>
//                <td>${escapeHtml(item.week ?? "")}</td>
//                <td>${escapeHtml(item.category ?? "")}</td>
//                <td>${escapeHtml(item.requested_by_name ?? "-")}</td>
//                <td>${statusBadge(item.status)}</td>
//                 <td class="text-center">
//    <div class="dropdown">
//        <button class="btn btn-sm btn-light border dropdown-toggle"
//                type="button"
//                data-bs-toggle="dropdown"
//                data-bs-boundary="viewport"
//                data-bs-container="body">
//            Actions
//        </button>

//        <ul class="dropdown-menu dropdown-menu-end shadow">
//            <li>
//                <button class="dropdown-item" onclick="viewMprf(${item.mprf_id})">
//                    View
//                </button>
//            </li>

//            ${item.can_edit === true ? `
//                <li>
//                    <button class="dropdown-item" onclick="editMprf(${item.mprf_id})">
//                        Edit
//                    </button>
//                </li>

//                <li>
//                    <button class="dropdown-item text-success" onclick="submitMprf(${item.mprf_id})">
//                        Submit
//                    </button>
//                </li>

//                <li><hr class="dropdown-divider"></li>

//                <li>
//                    <button class="dropdown-item text-danger" onclick="deleteMprf(${item.mprf_id})">
//                        Delete
//                    </button>
//                </li>
//            ` : ""}
//        </ul>
//    </div>
//</td>



//            </tr>
//        `).join("");

//    } catch (error) {
//        console.error(error);
//        tbody.innerHTML = `
//            <tr>
//                <td colspan="7" class="text-center text-danger py-4">
//                    Failed to load MPRF requests.
//                </td>
//            </tr>`;
//    }
//}


async function loadMprfList(resetPage = true) {
    const tbody = document.getElementById("mprfTableBody");

    try {
        const response = await fetch("/purchasing/mprf/list?t=" + Date.now(), {
            cache: "no-store"
        });

        const data = await response.json();

        mprfListCache = Array.isArray(data) ? data : [];

        if (resetPage) {
            currentPage = 1;
        }

        updateMprfSummary();
        renderMprfList();

    } catch (error) {
        console.error(error);
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center text-danger py-4">
                    Failed to load MPRF requests.
                </td>
            </tr>`;
    }
}

function getFilteredMprfList() {
    const search = document.getElementById("searchMprf")?.value.toLowerCase() ?? "";
    const status = document.getElementById("statusFilter")?.value ?? "";

    return mprfListCache.filter(item => {
        const matchesSearch =
            String(item.mprf_no ?? "").toLowerCase().includes(search) ||
            String(item.category ?? "").toLowerCase().includes(search) ||
            String(item.requested_by_name ?? "").toLowerCase().includes(search);

        const matchesStatus = !status || item.status === status;

        return matchesSearch && matchesStatus;
    });
}

function renderMprfList() {
    const tbody = document.getElementById("mprfTableBody");
    const data = getFilteredMprfList();
    updateRecordInfo(data.length);

    if (data.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center text-muted py-4">
                    No MPRF requests found.
                </td>
            </tr>`;
        renderPagination(0);
        return;
    }

    const start = (currentPage - 1) * pageSize;
    const pagedData = data.slice(start, start + pageSize);

    tbody.innerHTML = pagedData.map(item => `
        <tr>
            <td>${escapeHtml(item.mprf_no ?? "")}</td>
            <td>${formatDate(item.request_date)}</td>
            <td>${escapeHtml(item.week ?? "")}</td>
            <td>${escapeHtml(item.category ?? "")}</td>
            <td>${escapeHtml(item.requested_by_name ?? "-")}</td>
            <td>${statusBadge(item.status)}</td>
            <td class="text-center">
                <div class="dropdown">
                    <button class="btn btn-sm btn-light border dropdown-toggle"
                            type="button"
                            data-bs-toggle="dropdown">
                        Actions
                    </button>

                    <ul class="dropdown-menu dropdown-menu-end shadow">
                        <li>
                            <button class="dropdown-item" onclick="viewMprf(${item.mprf_id})">
                                View
                            </button>
                        </li>

                        ${item.can_edit === true ? `
                            <li>
                                <button class="dropdown-item" onclick="editMprf(${item.mprf_id})">
                                    Edit
                                </button>
                            </li>

                            <li>
                                <button class="dropdown-item text-success" onclick="submitMprf(${item.mprf_id})">
                                    Submit
                                </button>
                            </li>

                            <li><hr class="dropdown-divider"></li>

                            <li>
                                <button class="dropdown-item text-danger" onclick="deleteMprf(${item.mprf_id})">
                                    Delete
                                </button>
                            </li>
                        ` : ""}
                    </ul>
                </div>
            </td>
        </tr>
    `).join("");

    renderPagination(data.length);
}

function updateRecordInfo(totalRecords) {
    const info = document.getElementById("mprfRecordInfo");
    if (!info) return;

    if (totalRecords === 0) {
        info.innerText = "Showing 0 records";
        return;
    }

    const start = (currentPage - 1) * pageSize + 1;
    const end = Math.min(currentPage * pageSize, totalRecords);

    info.innerText = `Showing ${start}-${end} of ${totalRecords} records`;
}

function renderPagination(totalRecords) {
    const container = document.getElementById("mprfPagination");
    if (!container) return;

    const totalPages = Math.ceil(totalRecords / pageSize);

    if (totalPages <= 1) {
        container.innerHTML = "";
        return;
    }

    container.innerHTML = `
        <div class="text-muted small">
            Showing page ${currentPage} of ${totalPages} (${totalRecords} records)
        </div>

        <div>
            <button class="btn btn-sm btn-light border me-1"
                    ${currentPage === 1 ? "disabled" : ""}
                    onclick="changeMprfPage(${currentPage - 1})">
                Previous
            </button>

            <button class="btn btn-sm btn-light border"
                    ${currentPage === totalPages ? "disabled" : ""}
                    onclick="changeMprfPage(${currentPage + 1})">
                Next
            </button>
        </div>
    `;
}

function changeMprfPage(page) {
    currentPage = page;
    renderMprfList();
}


function updateMprfSummary() {
    document.getElementById("draftCount").innerText =
        mprfListCache.filter(x => x.status === "DRAFT").length;

    document.getElementById("returnedCount").innerText =
        mprfListCache.filter(x => x.status === "RETURNED").length;

    document.getElementById("submittedCount").innerText =
        mprfListCache.filter(x => x.status === "SUBMITTED").length;

    document.getElementById("reviewedCount").innerText =
        mprfListCache.filter(x => x.status === "REVIEWED").length;

    document.getElementById("rejectedCount").innerText =
        mprfListCache.filter(x => x.status === "REJECTED").length;
}

async function viewMprf(id) {
    try {
        const response = await fetch(`/purchasing/mprf/${id}`);

        if (!response.ok) {
            alert("Failed to load MPRF.");
            return;
        }

        const data = await response.json();

        document.getElementById("viewMprfNo").value = data.mprf_no ?? "";
        document.getElementById("viewRequestDate").value = formatDate(data.request_date);
        document.getElementById("viewWeek").value = data.week ?? "";
        document.getElementById("viewCategory").value = data.category ?? "";
        document.getElementById("viewRequestedBy").value =
            data.requested_by_name ?? data.requested_by ?? "-";

        document.getElementById("viewStatus").innerHTML = statusBadge(data.status);

        const viewPoButton = document.getElementById("viewPoButton");
        const relatedPOs = data.related_purchase_orders || [];

        if (relatedPOs.length > 0) {
            const latestPo = relatedPOs[0];

            document.getElementById("viewPoNo").value =
                latestPo.poNo ?? "-";

            document.getElementById("viewPrintedPoNo").value =
                latestPo.printedPoNo ?? "-";

            document.getElementById("viewPoStatus").innerHTML =
                statusBadge(latestPo.status);

            document.getElementById("viewPoAmount").value =
                latestPo.totalAmount != null
                    ? formatMoney(latestPo.totalAmount)
                    : "-";

            if (viewPoButton) {
                viewPoButton.classList.remove("d-none");
                viewPoButton.href =
                    `/purchasing/purchase-orders/details/${latestPo.poId}`;
            }
        } else {
            document.getElementById("viewPoNo").value = "No PO yet";
            document.getElementById("viewPoStatus").innerHTML =
                `<span class="badge bg-secondary">NO PO</span>`;
            document.getElementById("viewPoAmount").value = "-";

            if (viewPoButton) {
                viewPoButton.classList.add("d-none");
                viewPoButton.href = "#";
            }
        }

        const reviewRemarksBox = document.getElementById("viewReviewRemarksBox");
        const reviewRemarks = document.getElementById("viewReviewRemarks");

        if (data.review_remarks && data.review_remarks.trim() !== "") {
            reviewRemarksBox.classList.remove("d-none");
            reviewRemarks.innerText = data.review_remarks;
        } else {
            reviewRemarksBox.classList.add("d-none");
            reviewRemarks.innerText = "";
        }

        const tbody = document.getElementById("viewMprfLinesBody");

        if (!data.lines || data.lines.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="9" class="text-center text-muted py-4">
                        No material lines found.
                    </td>
                </tr>`;
        } else {
            tbody.innerHTML = data.lines.map((line, index) => `
                <tr>
                    <td>${index + 1}</td>
                    <td>${escapeHtml(formatMaterial(line))}</td>
                    <td>${escapeHtml(formatClassification(line))}</td>
                    <td>${formatNumber(line.qty_on_hand)}</td>
                    <td>${escapeHtml(line.uom ?? "")}</td>
                    <td>${escapeHtml(line.remarks ?? "")}</td>
                    <td>${line.purchasing_qty != null ? formatNumber(line.purchasing_qty) : "-"}</td>
                    <td>${itemDecisionBadge(line.item_decision)}</td>
                    <td>${escapeHtml(line.purchasing_remarks ?? "-")}</td>
                </tr>
            `).join("");
        }

        const modal = new bootstrap.Modal(document.getElementById("mprfViewModal"));
        modal.show();

    } catch (error) {
        console.error(error);
        alert("Error loading MPRF.");
    }
}

function formatMoney(value) {
    return Number(value ?? 0).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}
function itemDecisionBadge(decision) {
        if (decision === "APPROVED")
            return `<span class="badge bg-success">Approved</span>`;

        if (decision === "REJECTED")
            return `<span class="badge bg-danger">Rejected</span>`;

        return `<span class="badge bg-secondary">Pending</span>`;
    }

function toggleMprfMenu(event, id, canEdit) {
    event.preventDefault();
    event.stopPropagation();

    const menu = document.getElementById("mprfFloatingMenu");
    const rect = event.currentTarget.getBoundingClientRect();

    menu.innerHTML = `
        <button type="button" onclick="viewMprf(${id})">View</button>

        ${canEdit ? `
            <button type="button" onclick="editMprf(${id})">Edit</button>
            <button type="button" class="text-success" onclick="submitMprf(${id})">Submit</button>
            <button type="button" class="text-danger" onclick="deleteMprf(${id})">Delete</button>
        ` : ""}
    `;

    menu.style.top = `${rect.bottom + 4}px`;
    menu.style.left = `${rect.left}px`;

    menu.classList.toggle("d-none");
}

document.addEventListener("click", function () {
    const menu = document.getElementById("mprfFloatingMenu");
    if (menu) menu.classList.add("d-none");
});
function formatNumber(value) {
    const number = Number(value ?? 0);

    if (Number.isNaN(number)) return "0";

    return number.toLocaleString(undefined, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 4
    });
}

function formatClassification(line) {
    const category = line.category_name ?? "";
    const subcategory = line.subcategory_name ?? "";

    if (subcategory)
        return `${category} (${subcategory})`;

    return category;
}

function formatMaterial(line) {
    const code = line.material_code ?? "";
    const name = line.material_name ?? "";

    if (code && name) return `${code} - ${name}`;
    if (name) return name;
    if (code) return code;

    return `Material ID: ${line.material_id ?? ""}`;
}

function editMprf(id) {
    window.location.href = `/purchasing/mprf/edit/${id}`;
}

// =========================
// MPRF LINES
// =========================

function addLine() {
    const tbody = document.getElementById("mprfLinesBody");

    const row = document.createElement("tr");

    row.innerHTML = `
        <td>
            <input type="hidden" class="material-id">

            <input type="text"
                   class="form-control material-search"
                   placeholder="Search material code or name..."
                   autocomplete="off"
                   oninput="searchMaterial(this)"
                    onfocus="searchMaterial(this)"
       onkeydown="handleMaterialKeydown(event, this)">
        </td>

         <td>
        <input type="text"
               class="form-control classification"
               readonly />
    </td>

      <td style="width:200px;">
    <input type="number"
           class="form-control qty-on-hand"
           min="0"
           step="0.0001"
           value="0"
           readonly>
</td>

<td style="width:100px;">
    <input type="text"
           class="form-control uom"
           readonly>
</td>

        <td>
            <input type="text"
                   class="form-control line-remarks"
                   placeholder="Remarks">
        </td>

        <td>
            <button class="btn btn-sm btn-danger"
                    onclick="removeLine(this)">
                Remove
            </button>
        </td>
    `;

    tbody.appendChild(row);
}


let materialKeyboardIndex = -1;

function handleMaterialKeydown(event, input) {
    const portal = getMaterialPortal();
    const items = Array.from(portal.querySelectorAll("button"));

    if (portal.style.display === "none" || items.length === 0) return;

    if (event.key === "ArrowDown") {
        event.preventDefault();
        materialKeyboardIndex++;

        if (materialKeyboardIndex >= items.length) {
            materialKeyboardIndex = 0;
        }

        setActiveMaterialItem(items);
    }

    if (event.key === "ArrowUp") {
        event.preventDefault();
        materialKeyboardIndex--;

        if (materialKeyboardIndex < 0) {
            materialKeyboardIndex = items.length - 1;
        }

        setActiveMaterialItem(items);
    }

    if (event.key === "Enter") {
        event.preventDefault();

        if (materialKeyboardIndex >= 0 && items[materialKeyboardIndex]) {
            items[materialKeyboardIndex].click();
        }
    }

    if (event.key === "Escape") {
        portal.style.display = "none";
        materialKeyboardIndex = -1;
    }
}

function setActiveMaterialItem(items) {
    items.forEach(x => x.classList.remove("active"));

    const activeItem = items[materialKeyboardIndex];

    if (activeItem) {
        activeItem.classList.add("active");
        activeItem.scrollIntoView({
            block: "nearest"
        });
    }
}

function removeLine(button) {
    const row = button.closest("tr");
    row.remove();

    const tbody = document.getElementById("mprfLinesBody");

    if (tbody.children.length === 0) {
        addLine();
    }
}

// =========================
// MATERIAL SEARCH PORTAL
// =========================

let searchTimers = new WeakMap();
let activeMaterialInput = null;

function getMaterialPortal() {
    let portal = document.getElementById("materialSearchPortal");

    if (!portal) {
        portal = document.createElement("div");
        portal.id = "materialSearchPortal";
        portal.className = "material-results-portal list-group";
        portal.style.display = "none";
        document.body.appendChild(portal);
    }

    return portal;
}

function positionMaterialPortal(input) {
    const portal = getMaterialPortal();
    const rect = input.getBoundingClientRect();

    portal.style.left = `${rect.left}px`;
    portal.style.top = `${rect.bottom + 4}px`;
    portal.style.width = `${Math.max(rect.width, 520)}px`;
}

function searchMaterial(input) {
    activeMaterialInput = input;

    const row = input.closest("tr");
    row.querySelector(".material-id").value = "";
    row.querySelector(".classification").value = "";
    row.querySelector(".uom").value = "";

    const search = input.value.trim();
    const portal = getMaterialPortal();

    if (search.length < 2) {
        portal.style.display = "none";
        portal.innerHTML = "";
        return;
    }


    positionMaterialPortal(input);

    portal.style.display = "block";
    portal.innerHTML = `
        <div class="list-group-item text-muted small">
            Searching...
        </div>`;

    if (searchTimers.has(input)) {
        clearTimeout(searchTimers.get(input));
    }

    const timer = setTimeout(async () => {
        await fetchMaterialResults(input, search);
    }, 300);

    searchTimers.set(input, timer);
    console.log("Searching:", search);
}

// =========================
// ACTION MENU
// =========================

// =========================
// ACTION MENU
// =========================



document.addEventListener("click", function (event) {
    if (!event.target.closest("#mprfActionMenu")) {
        closeMprfActionMenu();
    }
});






window.addEventListener("scroll", function () {
    closeMprfActionMenu();
}, true);

async function fetchMaterialResults(input, search) {

    const portal = getMaterialPortal();

    try {

        const response = await fetch(
            `/purchasing/mprf/materials/lookup?search=${encodeURIComponent(search)}`
        );

        const materials = await response.json();

        console.log("Materials:", materials);

        if (!Array.isArray(materials) || materials.length === 0) {

            portal.innerHTML = `
                <div class="list-group-item text-muted small">
                    No materials found.
                </div>`;

            return;
        }

        portal.innerHTML = "";
        materialKeyboardIndex = -1;

        materials.forEach(m => {

            const btn = document.createElement("button");

            btn.type = "button";
            btn.className = "list-group-item list-group-item-action";

            btn.innerHTML = `
                <div class="fw-bold">
                    ${escapeHtml(m.material_code)}
                </div>

                <div>
                    ${escapeHtml(m.material_name)}
                </div>

                <small class="text-muted">
                    ${escapeHtml(m.category_name ?? "")}
                    /
                    ${escapeHtml(m.subcategory_name ?? "")}
                </small>
            `;

            btn.addEventListener("click", function () {

                selectMaterial(input, {
                    material_id: m.material_id,
                    material_code: m.material_code,
                    material_name: m.material_name,
                    category_name: m.category_name,
                    subcategory_name: m.subcategory_name,
                    uom: m.uom
                });

            });

            portal.appendChild(btn);

        });

        portal.style.display = "block";

    }
    catch (error) {

        console.error(error);

        portal.innerHTML = `
            <div class="list-group-item text-danger small">
                Failed to search materials.
            </div>`;
    }

    
}

function selectMaterial(input, material) {

    const row = input.closest("tr");

    row.querySelector(".material-id").value =
        material.material_id;

    row.querySelector(".material-search").value =
        `${material.material_code} - ${material.material_name}`;

    const classification =
        material.subcategory_name
            ? `${material.category_name} (${material.subcategory_name})`
            : material.category_name;

    row.querySelector(".classification").value =
        classification;

    row.querySelector(".uom").value =
        material.uom || "";

    const portal = getMaterialPortal();
    portal.style.display = "none";
}

document.addEventListener("click", function (event) {
    if (!event.target.closest(".material-search") &&
        !event.target.closest("#materialSearchPortal")) {
        const portal = getMaterialPortal();
        portal.style.display = "none";
    }
});

window.addEventListener("scroll", function () {
    const portal = getMaterialPortal();
    portal.style.display = "none";
}, true);

// =========================
// SAVE
// =========================

async function saveMprf() {
    const lines = [];

    document.querySelectorAll("#mprfLinesBody tr").forEach(row => {
        const materialId = parseInt(row.querySelector(".material-id").value || "0");
        const qtyOnHand = parseFloat(row.querySelector(".qty-on-hand").value || "0");
        const uom = row.querySelector(".uom").value;
        const remarks = row.querySelector(".line-remarks").value.trim();

        if (materialId > 0) {
            lines.push({
                material_id: materialId,
                qty_on_hand: qtyOnHand,
                requested_qty: 0,
                uom: uom,
                remarks: remarks
            });
        }
    });

    if (lines.length === 0) {
        alert("Please add at least one material.");
        return;
    }

    const payload = {
        mprf_no: document.getElementById("mprfNo").value.trim(),
        category: document.getElementById("category").value.trim(),
        request_date: document.getElementById("requestDate").value,
        week: document.getElementById("week").value.trim(),
      
        lines: lines
    };

    if (!payload.category) {
        alert("Category / Requesting Department is required.");
        return;
    }

    const pageMode = document.getElementById("pageMode")?.value;
    const mprfId = document.getElementById("mprfId")?.value;

    const url = pageMode === "EDIT"
        ? `/purchasing/mprf/update/${mprfId}`
        : "/purchasing/mprf/create";

    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        const error = await response.text();
        alert(error || "Failed to save MPRF.");
        return;
    }

    alert(pageMode === "EDIT"
        ? "MPRF updated successfully."
        : "MPRF saved successfully.");
    window.location.href = "/purchasing/mprf";
}

// =========================
// ACTIONS
// =========================

async function submitMprf(id) {
    if (!confirm("Submit this MPRF?")) return;

    const response = await fetch(`/purchasing/mprf/${id}/submit`, {
        method: "POST"
    });

    if (!response.ok) {
        const error = await response.text();
        alert(error || "Failed to submit MPRF.");
        return;
    }

    loadMprfList();
}

async function deleteMprf(id) {
    if (!confirm("Delete this MPRF?")) return;

    const response = await fetch(`/purchasing/mprf/delete/${id}`, {
        method: "POST"
    });

    if (!response.ok) {
        const error = await response.text();
        alert(error || "Failed to delete MPRF.");
        return;
    }

    loadMprfList();
}

// =========================
// HELPERS
// =========================

function statusBadge(status) {

    if (status === "DRAFT")
        return `<span class="badge bg-secondary">DRAFT</span>`;

    if (status === "SUBMITTED")
        return `<span class="badge bg-primary">SUBMITTED</span>`;

    if (status === "REVIEWED")
        return `<span class="badge bg-info">REVIEWED</span>`;

    if (status === "RETURNED")
        return `<span class="badge bg-warning text-dark">RETURNED</span>`;

    if (status === "REJECTED")
        return `<span class="badge bg-danger">REJECTED</span>`;

    if (status === "CANVASSING")
        return `<span class="badge bg-success">CANVASSING</span>`;

    if (status === "FOR_APPROVAL")
        return `<span class="badge bg-info text-dark">FOR APPROVAL</span>`;

    if (status === "APPROVED")
        return `<span class="badge bg-success">APPROVED</span>`;

    if (status === "CANCELLED")
        return `<span class="badge bg-danger">CANCELLED</span>`;

    if (status === "CLOSED")
        return `<span class="badge bg-dark">CLOSED</span>`;

    if (status === "PO_CREATED")
        return `<span class="badge bg-success">PO CREATED</span>`;

    return `<span class="badge bg-light text-dark">${escapeHtml(status ?? "")}</span>`;
}

function formatDate(value) {
    if (!value) return "-";
    return new Date(value).toLocaleDateString();
}

function closeMprfActionMenu() {
    const menu = document.getElementById("mprfFloatingMenu");

    if (menu) {
        menu.classList.add("d-none");
    }
}

function escapeHtml(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}