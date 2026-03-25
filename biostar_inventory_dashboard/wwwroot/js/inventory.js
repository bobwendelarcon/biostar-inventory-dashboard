function formatDate(timestamp) {
    if (!timestamp) return "";

    if (typeof timestamp === "object" && timestamp.seconds) {
        const date = new Date(timestamp.seconds * 1000);
        return date.toLocaleString();
    }

    if (typeof timestamp === "string") {
        const date = new Date(timestamp);
        if (!isNaN(date.getTime())) {
            return date.toLocaleString();
        }
        return timestamp;
    }

    return "";
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

                    <td>${item.uom ?? ""}</td>
                     <td>${item.qty ?? 0}</td>
                      <td>${item.stock_level ?? 0}</td>
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