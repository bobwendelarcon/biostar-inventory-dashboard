let canvassPage = 1;
const canvassPageSize = 10;

document.addEventListener("DOMContentLoaded", function () {
    loadCanvassList();

    document.getElementById("canvassSearch")?.addEventListener("input", function () {
        canvassPage = 1;
        loadCanvassList();
    });

    document.getElementById("canvassStatusFilter")?.addEventListener("change", function () {
        canvassPage = 1;
        loadCanvassList();
    });
});

async function loadCanvassList() {
    const tbody = document.getElementById("canvassListBody");
    const search = document.getElementById("canvassSearch")?.value ?? "";
    const status = document.getElementById("canvassStatusFilter")?.value ?? "";

    try {
        const response = await fetch(
            `/purchasing/canvassing/list?search=${encodeURIComponent(search)}&status=${encodeURIComponent(status)}&page=${canvassPage}&pageSize=${canvassPageSize}`
        );

        if (!response.ok) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center text-danger py-4">
                        Failed to load canvassing records.
                    </td>
                </tr>`;
            return;
        }

        const result = await response.json();
        const rows = result.data || [];

        renderCanvassRows(rows);
        renderCanvassPagination(result.totalRecords || 0);

    } catch (error) {
        console.error(error);

        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center text-danger py-4">
                    Error loading canvassing records.
                </td>
            </tr>`;
    }
}

function renderCanvassRows(rows) {
    const tbody = document.getElementById("canvassListBody");

    if (!rows.length) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center text-muted py-4">
                    No canvassing records found.
                </td>
            </tr>`;
        return;
    }

    tbody.innerHTML = rows.map(row => `
        <tr>
            <td>${escapeHtml(row.canvassNo ?? "")}</td>
            <td>${escapeHtml(row.mprfNo ?? "")}</td>
            <td>${escapeHtml(row.department ?? "")}</td>
            <td>${formatDate(row.canvassDate)}</td>
            <td>${statusBadge(row.status)}</td>
            <td>${renderPoProgress(row)}</td>
            <td>
                <div class="dropdown">
                    <button class="btn btn-sm btn-light border dropdown-toggle"
                            data-bs-toggle="dropdown">
                        Actions
                    </button>
                    <ul class="dropdown-menu">
                        <li>
                            <a class="dropdown-item"
                               href="/purchasing/canvassing/details-page/${row.canvassId}">
                                View Canvassing
                            </a>
                        </li>

                        ${row.status === "COMPLETED" ? `
                        <li>
                            <a class="dropdown-item"
                               href="/purchasing/purchase-orders/create/${row.canvassId}">
                                Create Remaining PO
                            </a>
                        </li>` : ""}
                    </ul>
                </div>
            </td>
        </tr>
    `).join("");
}

function renderCanvassPagination(totalRecords) {
    const info = document.getElementById("canvassRecordInfo");
    const container = document.getElementById("canvassPagination");

    const totalPages = Math.ceil(totalRecords / canvassPageSize);

    if (totalRecords === 0) {
        info.innerText = "Showing 0 records";
        container.innerHTML = "";
        return;
    }

    const start = (canvassPage - 1) * canvassPageSize + 1;
    const end = Math.min(canvassPage * canvassPageSize, totalRecords);

    info.innerText = `Showing ${start}-${end} of ${totalRecords} records`;

    if (totalPages <= 1) {
        container.innerHTML = "";
        return;
    }

    container.innerHTML = `
        <button class="btn btn-sm btn-light border me-1"
                ${canvassPage === 1 ? "disabled" : ""}
                onclick="changeCanvassPage(${canvassPage - 1})">
            Previous
        </button>

        <button class="btn btn-sm btn-light border"
                ${canvassPage === totalPages ? "disabled" : ""}
                onclick="changeCanvassPage(${canvassPage + 1})">
            Next
        </button>
    `;
}

function changeCanvassPage(page) {
    canvassPage = page;
    loadCanvassList();
}

function renderPoProgress(row) {
    const total = Number(row.totalRecommendedSuppliers || row.total_recommended_suppliers || 0);
    const created = Number(row.totalCreatedPoSuppliers || row.total_created_po_suppliers || 0);

    if (total === 0) {
        return `<span class="badge bg-secondary">No PO Yet</span>`;
    }

    if (created >= total) {
        return `<span class="badge bg-success">Complete</span>`;
    }

    return `
        <span class="badge bg-warning text-dark">
            ${created}/${total} POs Created
        </span>
        <div class="small text-muted">
            ${total - created} Remaining
        </div>
    `;
}

function statusBadge(status) {
    if (status === "OPEN") return `<span class="badge bg-primary">OPEN</span>`;
    if (status === "COMPLETED") return `<span class="badge bg-success">COMPLETED</span>`;

    return `<span class="badge bg-secondary">${escapeHtml(status ?? "")}</span>`;
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