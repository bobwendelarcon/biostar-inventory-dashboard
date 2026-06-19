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

        const lines = data.lines ?? [];

        lines.forEach(line => {
            rows += generateRow(line);
        });

        // add blank rows like the paper form
        const totalRows = 15;

        for (let i = lines.length; i < totalRows; i++) {
            rows += generateRow(null);
        }

        tbody.innerHTML = rows;

    } catch (error) {
        console.error("Print error:", error);
        alert("Failed to load print data.");
    }
}

//function generateRow(line) {
//    return `
//        <tr>
//            <td>${line?.customer_name ?? ""}</td>
//            <td>${line?.product_name ?? ""}</td>
//            <td>
//                ${line?.lot_no ?? ""}<br/>
//                ${line ? formatDate(line.manufacturing_date) : ""}<br/>
//                ${line ? formatDate(line.expiration_date) : ""}
//            </td>
//            <td>${line?.checklist_qty ?? ""}</td>

//            <td></td>
//            <td></td>
//            <td></td>
//            <td></td>
//            <td></td>

//            <td></td>
//            <td></td>

//            <td></td>
//        </tr>
//    `;
//}

function generateRow(line) {
    const productHtml = line
        ? `
            <div>${escapeHtml(line.product_name ?? "")}</div>
            ${line.product_description
            ? `<div class="sub-text">${escapeHtml(line.product_description)}</div>`
            : ""}
          `
        : "";

    const lotHtml = line
        ? `
            <div>
                ${escapeHtml(line.lot_no ?? "")}
                ${line.branch_name
            ? ` (${escapeHtml(line.branch_name)})`
            : line.branch_id
                ? ` (${escapeHtml(line.branch_id)})`
                : ""}
            </div>
            <div class="sub-text">
                ${formatDate(line.manufacturing_date)} - ${formatDate(line.expiration_date)}
            </div>
          `
        : "";

    return `
        <tr>
            <td>${escapeHtml(line?.customer_name ?? "")}</td>
            <td>${productHtml}</td>
            <td>${lotHtml}</td>
           <td>
    ${line
            ? `${line.checklist_qty} ${line.uom ?? ""}`
            : ""}
</td>

            <td></td>
            <td></td>
            <td></td>
            <td></td>
            <td></td>

            <td></td>
            <td></td>

            <td></td>
        </tr>
    `;
}
function escapeHtml(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
}
function formatDate(dateString) {
    if (!dateString) return "";
    const d = new Date(dateString);
    return d.toLocaleDateString("en-PH");
}