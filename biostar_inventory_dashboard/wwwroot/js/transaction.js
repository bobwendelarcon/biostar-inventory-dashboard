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
async function loadTransactions() {
    try {
        const response = await fetch("/Transactions/GetTransactions");


        if (!response.ok) {
            throw new Error("HTTP " + response.status);
        }

        const data = await response.json();

        const tableBody = document.getElementById("transactionTable");
        tableBody.innerHTML = "";

        if (!data || data.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center text-muted">
                        No transactions found.
                    </td>
                </tr>
            `;
            return;
        }

        data.forEach(item => {
            tableBody.innerHTML += `
                <tr>
                    <td>${item.transaction_id ?? ""}</td>
                   <td>${formatDateOnly(item.timestamp)}</td>
                   <td>${formatTimeOnly(item.timestamp)}</td>
                    <td>${item.branch_id ?? ""}</td>
                    <td>${item.product_id ?? ""}</td>
                    <td>${item.transaction_type ?? ""}</td>
                    <td>${item.lot_no ?? ""}</td>
                    <td>${item.quantity ?? ""}</td>
                    <td>${item.scanned_by ?? ""}</td>
                </tr>
            `;
        });

    } catch (error) {
        document.getElementById("transactionTable").innerHTML = `
            <tr>
                <td colspan="7" class="text-center text-danger">
                    ${error.message}
                </td>
            </tr>
        `;
        console.error(error);
    }
}

document.addEventListener("DOMContentLoaded", function () {
    loadTransactions();
    setInterval(loadTransactions, 2000);
});
