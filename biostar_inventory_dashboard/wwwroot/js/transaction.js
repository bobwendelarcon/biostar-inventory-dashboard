function formatDateOnly(timestamp) {
    if (!timestamp) return "-";

    const fixed = String(timestamp).replace(" ", "T");
    const date = new Date(fixed);

    return date.toLocaleDateString("en-US", {
        timeZone: "Asia/Manila", // 🔥 FIX
        year: "numeric",
        month: "long",
        day: "numeric"
    });
}
function formatTimeOnly(timestamp) {
    if (!timestamp) return "-";

    const fixed = String(timestamp).replace(" ", "T");
    const date = new Date(fixed);

    return date.toLocaleTimeString("en-US", {
        timeZone: "Asia/Manila", // 🔥 FIX
        hour: "numeric",
        minute: "2-digit",
        second: "2-digit",
        hour12: true
    });
}
//async function loadTransactions() {
//    try {
//        const response = await fetch("/Transactions/GetTransactions");


//        if (!response.ok) {
//            throw new Error("HTTP " + response.status);
//        }

//        const data = await response.json();

//        const tableBody = document.getElementById("transactionTable");
//        tableBody.innerHTML = "";

//        if (!data || data.length === 0) {
//            tableBody.innerHTML = `
//                <tr>
//                    <td colspan="7" class="text-center text-muted">
//                        No transactions found.
//                    </td>
//                </tr>
//            `;
//            return;
//        }

//        data.forEach(item => {
//            tableBody.innerHTML += `
//                <tr>
//                    <td>${item.transaction_id ?? ""}</td>
//                   <td>${formatDateOnly(item.timestamp)}</td>
//                   <td>${formatTimeOnly(item.timestamp)}</td>
//                    <td>${item.branch_id ?? ""}</td>
//                    <td>${item.product_id ?? ""}</td>
//                    <td>${item.transaction_type ?? ""}</td>
//                    <td>${item.lot_no ?? ""}</td>
//                    <td>${item.quantity ?? ""}</td>
//                    <td>${item.scanned_by ?? ""}</td>
//                </tr>
//            `;
//        });

//    } catch (error) {
//        document.getElementById("transactionTable").innerHTML = `
//            <tr>
//                <td colspan="7" class="text-center text-danger">
//                    ${error.message}
//                </td>
//            </tr>
//        `;
//        console.error(error);
//    }
//}

document.addEventListener("DOMContentLoaded", function () {
    loadTransactions();
  //  setInterval(loadTransactions, 2000);
});

let currentPage = 1;
let pageSize = 30;
let totalRecords = 0;

//<td>${item.transaction_id ?? ""}</td>
//<td>${item.product_id ?? ""}</td>
async function loadTransactions(page = 1) {
    try {
        currentPage = page;

        //const response = await fetch(`/Transactions/GetAll?page=${page}&pageSize=${pageSize}`);
        const response = await fetch(`/Transactions/GetTransactions?page=${page}&pageSize=${pageSize}`);

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
                    <td colspan="9" class="text-center text-muted">
                        No transactions found.
                    </td>
                </tr>
            `;
            return;
        }

        data.forEach(item => {
            tableBody.innerHTML += `
                <tr>
              
                    <td>${item.lot_no ?? ""}</td>
                    <td>${item.product_name ?? ""}</td>
                    <td>${"Biostar, Nutriproduct Inc."}</td>
                     <td>${item.partner_id ?? ""}</td>
                    <td>${formatDateOnly(item.timestamp)}</td>
                    <td>${formatTimeOnly(item.timestamp)}</td>
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

        renderPagination(result.total);

    } catch (error) {
        document.getElementById("transactionTable").innerHTML = `
            <tr>
                <td colspan="9" class="text-center text-danger">
                    ${error.message}
                </td>
            </tr>
        `;
        console.error(error);
    }
}
document.addEventListener("DOMContentLoaded", function () {
    document.getElementById("prevBtn")?.addEventListener("click", prevPage);
    document.getElementById("nextBtn")?.addEventListener("click", nextPage);
    loadTransactions(1);
});

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
    const totalCountText = document.getElementById("rangeText")?.innerText || "";
    currentPage++;
    loadTransactions(currentPage);
}
function prevPage() {
    if (currentPage > 1) {
        currentPage--;
        loadTransactions(currentPage);
    }
}



