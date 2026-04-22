document.addEventListener("DOMContentLoaded", async function () {
    await loadPrintData();
});

async function loadPrintData() {
    try {
        const response = await fetch(`/DeliveryChecklist/GetChecklistDetails?id=${checklistId}`);
        const data = await response.json();

        document.getElementById("print_date").innerText = formatDate(data.delivery_date);
        document.getElementById("print_truck").innerText = data.truck_name ?? "-";
        document.getElementById("print_driver").innerText = data.driver_name ?? "-";

        const tbody = document.getElementById("printBody");

        let rows = "";

        data.lines.forEach(line => {
            rows += `
                <tr>
                    <td>${line.customer_name ?? "-"}</td>
                    <td>${line.product_name ?? "-"}</td>
                    <td>
                        ${line.lot_no ?? "-"}<br/>
                        MFG: ${formatDate(line.manufacturing_date)}<br/>
                        EXP: ${formatDate(line.expiration_date)}
                    </td>
                    <td>${line.checklist_qty}</td>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td></td>
                </tr>
            `;
        });

        tbody.innerHTML = rows;

    } catch (error) {
        console.error("Print error:", error);
        alert("Failed to load print data.");
    }
}

function formatDate(dateString) {
    if (!dateString) return "-";
    const d = new Date(dateString);
    return d.toLocaleDateString("en-PH");
}