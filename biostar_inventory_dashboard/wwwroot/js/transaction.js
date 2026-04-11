function formatDateOnly(created_at) {
    if (!created_at) return "-";

    const fixed = String(created_at).replace(" ", "T");
    const date = new Date(fixed);

    return date.toLocaleDateString("en-US", {
        timeZone: "Asia/Manila",
        year: "numeric",
        month: "long",
        day: "numeric"
    });
}

function formatTimeOnly(created_at) {
    if (!created_at) return "-";

    const fixed = String(created_at).replace(" ", "T");
    const date = new Date(fixed);

    return date.toLocaleTimeString("en-US", {
        timeZone: "Asia/Manila",
        hour: "numeric",
        minute: "2-digit",
        second: "2-digit",
        hour12: true
    });
}

let currentPage = 1;
let pageSize = 30;
let totalRecords = 0;
let lotSearchTimeout;

async function loadTransactions(page = 1) {
    try {
        currentPage = page;

        const lotNo = document.getElementById("lotNoFilter")?.value.trim() || "";
        const product = document.getElementById("productFilter")?.value.trim() || "";
        const type = document.getElementById("typeFilter")?.value || "";
        const from = document.getElementById("dateFromFilter")?.value || "";
        const to = document.getElementById("dateToFilter")?.value || "";
        const scannedBy = document.getElementById("scannedByFilter")?.value.trim() || "";
        const reference = document.getElementById("referenceFilter")?.value.trim() || "";
        const warehouse = document.getElementById("warehouseFilter")?.value || "";
        const order = document.getElementById("orderFilter")?.value || "desc";

        let url = `/Transactions/GetTransactions?page=${page}&pageSize=${pageSize}`;

        if (lotNo) url += `&lot_no=${encodeURIComponent(lotNo)}`;
        if (product) url += `&product=${encodeURIComponent(product)}`;
        if (type) url += `&type=${encodeURIComponent(type)}`;
        if (from) url += `&from=${encodeURIComponent(from)}`;
        if (to) url += `&to=${encodeURIComponent(to)}`;
        if (scannedBy) url += `&scanned_by=${encodeURIComponent(scannedBy)}`;
        if (reference) url += `&reference=${encodeURIComponent(reference)}`;
        if (warehouse) url += `&warehouse=${encodeURIComponent(warehouse)}`;
        if (order) url += `&order=${encodeURIComponent(order)}`;

        console.log("FILTER URL:", url);

        const response = await fetch(url);

        if (!response.ok) {
            const errText = await response.text();
            throw new Error("HTTP " + response.status + " - " + errText);
        }

        const result = await response.json();
        const data = result.data;
        totalRecords = Number(result.total) || 0;

        const tableBody = document.getElementById("transactionTable");
        tableBody.innerHTML = "";

        if (!data || data.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="13" class="text-center text-muted">
                        No transactions found.
                    </td>
                </tr>
            `;
            renderPagination(0);
            return;
        }

        data.forEach(item => {
            tableBody.innerHTML += `
                <tr>
                    <td>${item.lot_no ?? ""}</td>
                    <td>${item.product_name ?? ""}</td>
                    <td>${item.supplier_name ?? ""}</td>
                    <td>${item.customer_name ?? ""}</td>
                    <td>${formatDateOnly(item.created_at)}</td>
                    <td>${formatTimeOnly(item.created_at)}</td>
                    <td>${item.branch_id ?? ""}</td>
                    <td>${item.transaction_type ?? ""}</td>
                    <td>${item.quantity ?? ""}</td>
                    <td>${item.scanned_by ?? ""}</td>
                    <td>${item.dr_no ?? ""}</td>
                    <td>${item.inv_no ?? ""}</td>
                    <td>${item.po_no ?? ""}</td>
                </tr>
            `;
        });

        renderPagination(totalRecords);

    } catch (error) {
        document.getElementById("transactionTable").innerHTML = `
            <tr>
                <td colspan="13" class="text-center text-danger">
                    ${error.message}
                </td>
            </tr>
        `;
        console.error(error);
    }
}

function renderPagination(total) {
    const totalCount = Number(total) || 0;
    const totalPages = Math.ceil(totalCount / pageSize);

    const start = totalCount === 0 ? 0 : ((currentPage - 1) * pageSize) + 1;
    const end = Math.min(currentPage * pageSize, totalCount);

    const rangeText = document.getElementById("rangeText");
    if (rangeText) {
        rangeText.innerText = `${start}-${end} of ${totalCount.toLocaleString()}`;
    }

    const prevBtn = document.getElementById("prevBtn");
    const nextBtn = document.getElementById("nextBtn");

    if (prevBtn) prevBtn.disabled = currentPage === 1;
    if (nextBtn) nextBtn.disabled = currentPage >= totalPages || totalPages === 0;
}

function nextPage() {
    const totalPages = Math.ceil(totalRecords / pageSize);
    if (currentPage < totalPages) {
        currentPage++;
        loadTransactions(currentPage);
    }
}

function prevPage() {
    if (currentPage > 1) {
        currentPage--;
        loadTransactions(currentPage);
    }
}

document.addEventListener("DOMContentLoaded", function () {
    document.getElementById("prevBtn")?.addEventListener("click", prevPage);
    document.getElementById("nextBtn")?.addEventListener("click", nextPage);

    const applyBtn = document.getElementById("applyFilters");
    if (applyBtn) {
        applyBtn.addEventListener("click", function () {
            console.log("Apply Filters clicked");
            loadTransactions(1);
        });
    }

    

    const clearBtn = document.getElementById("clearFilters");
    if (clearBtn) {
        clearBtn.addEventListener("click", function () {
            const ids = [
                "lotNoFilter",
                "productFilter",
                "typeFilter",
                "dateFromFilter",
                "dateToFilter",
                "scannedByFilter",
                "referenceFilter",
                "warehouseFilter",
                "orderFilter"
            ];

            ids.forEach(id => {
                const el = document.getElementById(id);
                if (el) el.value = "";
            });

            const orderEl = document.getElementById("orderFilter");
            if (orderEl) orderEl.value = "desc";

            loadTransactions(1);
        });
    }

    document.getElementById("lotNoFilter")?.addEventListener("input", function () {
        clearTimeout(lotSearchTimeout);
        lotSearchTimeout = setTimeout(() => {
            loadTransactions(1);
        }, 500);
    });

    loadTransactions(1);

    setInterval(() => {
        loadTransactions(currentPage);
    }, 5000); // every 10 seconds
});