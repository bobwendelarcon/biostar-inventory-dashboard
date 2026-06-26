document.addEventListener("DOMContentLoaded", async function () {
    await loadPrintData();
});

async function loadPrintData() {
    try {
        const response = await fetch(`/DeliveryChecklist/GetChecklistDetails?id=${checklistId}`);
        const data = await response.json();

        const lines = data.lines ?? [];
        const rowsPerPage = 18;
        const totalPages = Math.max(1, Math.ceil(lines.length / rowsPerPage));

        let html = "";

        for (let page = 0; page < totalPages; page++) {
            const start = page * rowsPerPage;
            const pageLines = lines.slice(start, start + rowsPerPage);

            let rows = "";

            pageLines.forEach(line => {
                rows += generateRow(line);
            });

            // blank rows only for current page
            for (let i = pageLines.length; i < rowsPerPage; i++) {
                rows += generateRow(null);
            }

            html += generateChecklistPage(data, rows, page + 1, totalPages);
        }

        document.getElementById("printPages").innerHTML = html;

    } catch (error) {
        console.error("Print error:", error);
        alert("Failed to load print data.");
    }
}

function generateChecklistPage(data, rows, currentPage, totalPages) {
    return `
        <div class="print-page">

            <div class="checklist-header">
                <div>
                    <strong>BioStar</strong><br>
                    <small>Nutraceutical Products, Inc.</small>
                </div>

                <div class="title">
                    DELIVERY CHECKLIST
                </div>

                <div class="form-code">
                    FM-WH-WHC-03-R3.01.01<br>
                    Revision 1<br>
                    24 SEPTEMBER 2025<br>
                    Page ${currentPage} of ${totalPages}
                </div>
            </div>

            <table class="info-table">
                <tr>
                    <td>Date</td>
                    <td>${formatDate(data.delivery_date)}</td>
                    <td>Checker</td>
                    <td></td>
                </tr>
                <tr>
                    <td>Truck Number</td>
                    <td>${escapeHtml(data.truck_name ?? "-")}</td>
                    <td>Driver</td>
                    <td>${escapeHtml(data.driver_name ?? "-")}</td>
                </tr>
                <tr>
                    <td>Plate Number</td>
                    <td></td>
                    <td>Porter</td>
                    <td></td>
                </tr>
            </table>

            <table class="checklist-table">
                <thead>
                    <tr>
                        <th rowspan="2">Client</th>
                        <th rowspan="2">Products</th>
                        <th rowspan="2">Lot Number<br><small>(Mfg. Date / Exp Date)</small></th>
                        <th rowspan="2">Qty</th>
                        <th colspan="5">DOCUMENTS</th>
                        <th colspan="2">Did this loaded items matched with DR/SI?</th>
                        <th rowspan="2">Remarks</th>
                    </tr>
                    <tr>
                        <th>SI</th>
                        <th>DR</th>
                        <th>COA</th>
                        <th>CPR</th>
                        <th>MSDS</th>
                        <th>YES</th>
                        <th>NO</th>
                    </tr>
                </thead>
                <tbody>
                    ${rows}
                </tbody>
            </table>

           <div class="page-footer">

    <div class="bottom-checks">
        <div>1. Was the truck cleaned before loading? YES □ &nbsp;&nbsp; NO □</div>
        <div>2. Is the delivery area free from pests, odor, debris and contamination? YES □ &nbsp;&nbsp; NO □</div>
        <div>NOTE: Upon completion of loading of delivery products, are all doors locked? YES □ &nbsp;&nbsp; NO □</div>
    </div>

    <div class="signature-section">
        <div>HELPER'S SIGNATURE</div>
        <div>DRIVER'S SIGNATURE</div>
        <div>
            CHECKED BY: ___________________<br>
            VERIFIED BY: __________________
        </div>
    </div>

</div>

        </div>
    `;
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