function formatMonthYear(timestamp) {
    if (!timestamp) return "";

    const options = {
        timeZone: "Asia/Manila",
        year: "numeric",
        month: "long"
    };

    if (typeof timestamp === "object" && timestamp.seconds) {
        const date = new Date(timestamp.seconds * 1000);
        return date.toLocaleDateString("en-US", options);
    }

    if (typeof timestamp === "string") {
        const date = new Date(timestamp);
        if (!isNaN(date.getTime())) {
            return date.toLocaleDateString("en-US", options);
        }
        return timestamp;
    }

    return "";
}
function getRemainingMonths(expiration_date) {
    if (!expiration_date) return "-";

    const today = new Date();
    const exp = new Date(String(expiration_date).replace(" ", "T"));

    let years = exp.getFullYear() - today.getFullYear();
    let months = exp.getMonth() - today.getMonth();

    let totalMonths = years * 12 + months;

    if (exp.getDate() < today.getDate()) {
        totalMonths--;
    }

    if (totalMonths < 0) return "Expired";

    return totalMonths + " mo";
}
function getRemainingMonthsDisplay(expiration_date) {
    if (!expiration_date) {
        return `<span class="badge bg-secondary">-</span>`;
    }

    const today = new Date();
    const exp = new Date(String(expiration_date).replace(" ", "T"));

    let years = exp.getFullYear() - today.getFullYear();
    let months = exp.getMonth() - today.getMonth();
    let totalMonths = years * 12 + months;

    if (exp.getDate() < today.getDate()) {
        totalMonths--;
    }

    if (totalMonths < 0) {
        return `<span class="badge bg-danger">Expired</span>`;
    }

    if (totalMonths <= 2) {
        return `<span class="badge bg-warning text-dark">${totalMonths} months left</span>`;
    }

    return `<span class="badge bg-success">${totalMonths} months left</span>`;
}
function getStatusBadge(quantity) {
    const qty = parseInt(quantity) || 0;

    if (qty <= 0) {
        return `<span class="badge bg-danger-subtle text-danger px-3 py-2 rounded-pill">Out of Stock</span>`;
    } else if (qty <= 5) {
        return `<span class="badge bg-warning-subtle text-warning px-3 py-2 rounded-pill">Low Stock</span>`;
    } else {
        return `<span class="badge bg-success-subtle text-success px-3 py-2 rounded-pill">In Stock</span>`;
    }
}
//<td>${item.date ?? ""}</td>

//<td>${item.product_id ?? ""}</td>

function formatPack(qty, packQty, packUom, baseUom) {
    if (!qty || !packQty) return "-";

    const fullPacks = Math.floor(qty / packQty);
    const remainder = qty % packQty;

    let result = "";

    if (fullPacks > 0) {
        result += `${fullPacks} ${packUom}`;
    }

    if (remainder > 0) {
        if (result !== "") result += " & "; // 🔥 CHANGE HERE
        result += `${remainder} ${baseUom}`;
    }


    return result || `0 ${baseUom}`;
}

async function loadInventory() {
    try {
        const response = await fetch("/Inventory/GetInventory");

        const rawText = await response.text();
        console.log("RAW RESPONSE:", rawText);

        if (!response.ok) {
            throw new Error("HTTP " + response.status);
        }

        const data = JSON.parse(rawText);

        const tableBody = document.getElementById("inventoryTable");
        tableBody.innerHTML = "";

        if (!data || data.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center text-muted">
                        No inventory data found.
                    </td>
                </tr>
            `;
            return;
        }

        data.forEach(item => {
            tableBody.innerHTML += `
        <tr>
            <td>${item.lot_no ?? ""}</td>
            <td>${item.description ?? ""}</td>
            <td>${(item.qty ?? 0) + " " + (item.uom ?? "")}</td>

            <td>
                ${formatPack(item.qty, item.pack_qty, item.pack_uom, item.uom)}
            </td>
            <td>${item.stock_level ?? 0}</td>

        
            <td>${formatMonthYear(item.manufacturing_date) +" - "+formatMonthYear(item.expiration_date)}</td>
            <td>${getRemainingMonthsDisplay(item.expiration_date)}</td>

            <td>${item.warehouse ?? ""}</td>
        </tr>
    `;
        });

    } catch (error) {
        document.getElementById("inventoryTable").innerHTML = `
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
    loadInventory();
     setInterval(loadInventory, 5000);
});