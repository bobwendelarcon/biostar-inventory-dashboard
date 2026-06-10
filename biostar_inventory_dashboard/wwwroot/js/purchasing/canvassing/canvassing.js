let currentCanvassId = null;
let currentCanvassStatus = "";

document.addEventListener("DOMContentLoaded", function () {
    const canvassId = document.getElementById("canvassId")?.value;

    if (canvassId) {
        currentCanvassId = canvassId;
        loadCanvassing(canvassId);
    }
});

async function loadCanvassing(canvassId) {

    const response = await fetch(`/purchasing/canvassing/details/${canvassId}`);

    if (!response.ok) {
        alert("Failed to load canvassing details.");
        return;
    }

    const data = await response.json();

    document.getElementById("canvassNo").value = data.header.canvassNo ?? "";
    document.getElementById("mprfNo").value = data.header.mprfNo ?? "";
    document.getElementById("department").value = data.header.department ?? "";
    document.getElementById("status").value = data.header.status ?? "";
    currentCanvassStatus = data.header.status ?? "";

    if (data.header.status === "OPEN" || data.header.status === "COMPLETED") {

        document.getElementById("createPoContainer").innerHTML = `
            <button class="btn btn-warning"
                    onclick="createPo()">
                Create PO
            </button>
        `;
    }
    else {
        document.getElementById("createPoContainer").innerHTML = "";
    }

    renderMaterials(data.lines ?? []);
    await loadPoProgress();

}

async function loadPoProgress() {
    const box = document.getElementById("poProgressBox");

    if (!box || !currentCanvassId) return;

    const status = document.getElementById("status").value;

    // Since you removed Complete Canvassing requirement,
    // allow PO progress to show for OPEN and COMPLETED.
    if (status !== "OPEN" && status !== "COMPLETED") {
        box.classList.add("d-none");
        return;
    }

    const response = await fetch(
        `/purchasing/purchase-orders/create-options/${currentCanvassId}`
    );

    if (!response.ok) {
        box.className = "alert alert-danger mt-3";
        box.innerHTML = "Failed to load PO progress.";
        return;
    }

    const data = await response.json();

    const remaining = data.suppliers || [];
    const existing = data.existing_po_suppliers || [];

    box.classList.remove("d-none");

    const existingHtml = existing.map(po => `
        <div class="mb-1">
            ✓ PO already created:
            <strong>${po.poNo}</strong>
            <span class="badge bg-warning text-dark">${po.status}</span>

            ${po.status === "DRAFT" ? `
                <a class="btn btn-sm btn-outline-primary ms-2"
                   href="/purchasing/purchase-orders/edit/${po.poId}">
                    Edit PO
                </a>
            ` : `
                <a class="btn btn-sm btn-outline-secondary ms-2"
                   href="/purchasing/purchase-orders/details/${po.poId}">
                    View PO
                </a>
            `}
        </div>
    `).join("");

    const remainingHtml = remaining.map(s => `
        <div class="mb-1">
            ⚠ ${s.supplierName} - ${s.lineCount} material(s)
            <a class="btn btn-sm btn-primary ms-2"
               href="/purchasing/purchase-orders/create/${currentCanvassId}?supplierId=${s.supplierId}">
                Create PO
            </a>
        </div>
    `).join("");

    if (existing.length === 0 && remaining.length === 0) {
        box.className = "alert alert-secondary mt-3";
        box.innerHTML = "No recommended supplier available for PO creation.";
        return;
    }

    if (remaining.length === 0) {
        box.className = "alert alert-success mt-3";
        box.innerHTML = `
            <b>PO Status:</b><br>
            ${existingHtml}
        `;
        return;
    }

    box.className = "alert alert-warning mt-3";
    box.innerHTML = `
        <b>PO Status:</b><br>
        ${existingHtml}
        ${remainingHtml}
    `;
}

function renderMaterials(lines) {
    const container = document.getElementById("materialsContainer");

    if (!lines.length) {
        container.innerHTML = `
            <div class="card border-0 shadow-sm mb-4">
                <div class="card-body text-center text-muted py-4">
                    No approved materials found for canvassing.
                </div>
            </div>`;
        return;
    }

    container.innerHTML = lines.map(line => {
        const materialDisplay =
            `${line.materialCode ?? ""} - ${line.materialName ?? ""}`;

        return `
            <div class="card border-0 shadow-sm mb-4">
                <div class="card-header bg-white d-flex justify-content-between align-items-center">
                    <div>
                        <div class="fw-bold">
                            ${escapeHtml(materialDisplay)}
                        </div>
                        <small class="text-muted">
                            Classification: ${escapeHtml(line.classification)}
                            | Qty to Purchase: ${formatNumber(line.purchasingQty)}
                            | UOM: ${escapeHtml(line.uom)}
                        </small>
                    </div>

                    <button class="btn btn-sm btn-primary"
                            onclick="openQuoteModal(${line.canvassLineId}, ${line.materialId}, '${escapeJs(materialDisplay)}')">
                        + Add Supplier Quote
                    </button>
                </div>

                <div class="card-body">
                    ${renderQuotes(line)}
                </div>
            </div>
        `;
    }).join("");
}

function renderQuotes(line) {
    const quotes = line.quotes ?? [];

    if (!quotes.length) {
        return `
            <div class="alert alert-light border mb-0">
                No supplier quotation yet. Click <strong>Add Supplier Quote</strong>.
            </div>`;
    }

    const rows = quotes.map(q => {
        const quoteJson = encodeURIComponent(JSON.stringify(q));

        return `
            <tr>
                <td>${escapeHtml(q.supplierName)}</td>
                <td>₱${formatMoney(q.unitPrice)}</td>
                <td>${escapeHtml(q.paymentTerms)}</td>
                <td>${escapeHtml(q.deliveryDays)}</td>
                <td>${q.coaAvailable ? "With COA" : "No COA"}</td>
                <td>${escapeHtml(q.remarks)}</td>
                <td>
                    <button class="btn btn-sm btn-warning"
                            onclick="editQuote('${quoteJson}')">
                        Edit
                    </button>
                </td>
                <td class="text-center">
                   <input type="radio"
       name="recommended_${line.canvassLineId}"
       ${q.isRecommended ? "checked" : ""}
       ${currentCanvassStatus === "COMPLETED" ? "disabled" : ""}
       onchange="manualRecommend(${q.quoteId})">
                </td>
            </tr>
        `;
    }).join("");

    return `
        <table class="table table-bordered align-middle mb-0">
            <thead class="table-light">
                <tr>
                    <th>Supplier</th>
                    <th>Unit Price</th>
                    <th>Terms</th>
                    <th>Delivery Days</th>
                    <th>COA / Documents</th>
                    <th>Remarks</th>
                    <th style="width:120px;">Action</th>
                    <th style="width:120px;">Recommended</th>
                </tr>
            </thead>
            <tbody>${rows}</tbody>
        </table>`;
}

async function openQuoteModal(canvassLineId, materialId, materialName) {
    currentCanvassId = document.getElementById("canvassId")?.value;

    const modalElement = document.getElementById("quoteModal");
    modalElement.removeAttribute("data-quote-id");

    document.getElementById("quoteCanvassLineId").value = canvassLineId;
    document.getElementById("quoteMaterialId").value = materialId;
    document.getElementById("quoteMaterial").value = materialName;

    document.getElementById("quoteUnitPrice").value = "";
    document.getElementById("quotePaymentTerms").value = "";
    document.getElementById("quoteDeliveryDays").value = "";
    document.getElementById("quoteDocumentsRemarks").value = "";
    document.getElementById("quoteQuotationRef").value = "";
    document.getElementById("quoteDate").value = "";
    document.getElementById("quoteRemarks").value = "";
    document.getElementById("quoteCoaAvailable").value = "true";

    await loadLinkedSuppliers(materialId);

    const modal = new bootstrap.Modal(modalElement);
    modal.show();
}

async function editQuote(encodedQuote) {
    const q = JSON.parse(decodeURIComponent(encodedQuote));

    currentCanvassId = document.getElementById("canvassId")?.value;

    const modalElement = document.getElementById("quoteModal");
    modalElement.setAttribute("data-quote-id", q.quoteId);

    document.getElementById("quoteCanvassLineId").value = q.canvassLineId;
    document.getElementById("quoteMaterialId").value = "";

    document.getElementById("quoteMaterial").value = "Edit Supplier Quote";

    document.getElementById("quoteSupplierId").innerHTML = `
        <option value="${q.supplierId}" 
                selected
                data-manufacturer-id="${q.manufacturerId ?? ""}">
            ${escapeHtml(q.supplierName)}
        </option>`;

    document.getElementById("quoteUnitPrice").value = q.unitPrice ?? "";
    document.getElementById("quotePaymentTerms").value = q.paymentTerms ?? "";
    document.getElementById("quoteDeliveryDays").value = q.deliveryDays ?? "";
    document.getElementById("quoteCoaAvailable").value = q.coaAvailable ? "true" : "false";
    document.getElementById("quoteDocumentsRemarks").value = q.documentsRemarks ?? "";
    document.getElementById("quoteQuotationRef").value = q.quotationRef ?? "";
    document.getElementById("quoteDate").value = q.quoteDate ? q.quoteDate.substring(0, 10) : "";
    document.getElementById("quoteRemarks").value = q.remarks ?? "";

    const modal = new bootstrap.Modal(modalElement);
    modal.show();
}

async function loadLinkedSuppliers(materialId) {
    const supplierSelect = document.getElementById("quoteSupplierId");

    supplierSelect.innerHTML = `<option value="">Loading suppliers...</option>`;

    const response = await fetch(`/purchasing/canvassing/materials/${materialId}/suppliers`);
    const suppliers = await response.json();

    if (!suppliers.length) {
        supplierSelect.innerHTML = `<option value="">No linked supplier found</option>`;
        return;
    }

    supplierSelect.innerHTML = `<option value="">Select Supplier</option>` +
        suppliers.map(s => `
            <option value="${s.supplierId}"
                    data-terms="${escapeAttr(s.paymentTerms ?? "")}"
                    data-days="${s.leadTimeDays ?? ""}"
                    data-manufacturer-id="${s.manufacturerId ?? ""}">
                ${escapeHtml(s.supplierName)}
                ${s.isPreferred ? " (Preferred)" : ""}
            </option>
        `).join("");

    supplierSelect.onchange = function () {
        const selected = supplierSelect.options[supplierSelect.selectedIndex];

        document.getElementById("quotePaymentTerms").value =
            selected.getAttribute("data-terms") || "";

        document.getElementById("quoteDeliveryDays").value =
            selected.getAttribute("data-days") || "";
    };
}

async function saveQuote() {
    const modalElement = document.getElementById("quoteModal");
    const quoteId = modalElement.getAttribute("data-quote-id");

    const canvassLineId = Number(document.getElementById("quoteCanvassLineId").value);
    const supplierSelect = document.getElementById("quoteSupplierId");
    const supplierId = Number(supplierSelect.value);
    const selectedSupplier = supplierSelect.options[supplierSelect.selectedIndex];

    const unitPrice = Number(document.getElementById("quoteUnitPrice").value || 0);

    if (!supplierId) {
        alert("Please select supplier.");
        return;
    }

    if (unitPrice <= 0) {
        alert("Please enter valid unit price.");
        return;
    }

    const manufacturerIdRaw =
        selectedSupplier.getAttribute("data-manufacturer-id");

    const payload = {
        canvassLineId: canvassLineId,
        supplierId: supplierId,
        manufacturerId: manufacturerIdRaw ? Number(manufacturerIdRaw) : null,
        unitPrice: unitPrice,
        paymentTerms: document.getElementById("quotePaymentTerms").value,
        deliveryDays: Number(document.getElementById("quoteDeliveryDays").value || 0),
        coaAvailable: document.getElementById("quoteCoaAvailable").value === "true",
        documentsRemarks: document.getElementById("quoteDocumentsRemarks").value,
        quotationRef: document.getElementById("quoteQuotationRef").value,
        quoteDate: document.getElementById("quoteDate").value || null,
        remarks: document.getElementById("quoteRemarks").value
    };

    const url = quoteId
        ? `/purchasing/canvassing/quotes/update/${quoteId}`
        : `/purchasing/canvassing/quotes/create`;

    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
    });

    const result = await response.json();

    if (!response.ok) {
        alert(result.message || "Failed to save quote.");
        return;
    }

    const modal = bootstrap.Modal.getInstance(modalElement);
    if (modal) modal.hide();

    modalElement.removeAttribute("data-quote-id");

    await loadCanvassing(currentCanvassId);

    alert(quoteId ? "Quote updated successfully." : "Quote saved successfully.");
}

async function completeCanvassing() {
    const canvassId = document.getElementById("canvassId")?.value;

    if (!confirm("Complete this canvassing?")) return;

    const response = await fetch(`/purchasing/canvassing/${canvassId}/complete`, {
        method: "POST"
    });

    const result = await response.json();

    if (!response.ok) {
        alert(result.message || "Failed to complete canvassing.");
        return;
    }

    alert("Canvassing completed successfully.");
    await loadCanvassing(canvassId);
}

function escapeHtml(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function escapeAttr(value) {
    return escapeHtml(value).replaceAll("`", "&#096;");
}

function escapeJs(value) {
    return String(value ?? "")
        .replaceAll("\\", "\\\\")
        .replaceAll("'", "\\'")
        .replaceAll('"', "&quot;")
        .replaceAll("\n", " ")
        .replaceAll("\r", " ");
}

function formatNumber(value) {
    return Number(value ?? 0).toLocaleString(undefined, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 4
    });
}

function formatMoney(value) {
    return Number(value ?? 0).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

async function recommendSuppliers() {
    const canvassId = document.getElementById("canvassId")?.value;

    if (!confirm("Generate supplier recommendation?")) return;

    const response = await fetch(`/purchasing/canvassing/${canvassId}/recommend`, {
        method: "POST"
    });

    const result = await response.json();

    if (!response.ok) {
        alert(result.message || "Failed to recommend suppliers.");
        return;
    }

    alert("Supplier recommendation updated.");
    await loadCanvassing(canvassId);
}
async function manualRecommend(quoteId) {
 //   if (!confirm("Set this supplier as recommended?")) return;

    const response = await fetch(`/purchasing/canvassing/quotes/${quoteId}/recommend`, {
        method: "POST"
    });

    const result = await response.json();

    if (!response.ok) {
        alert(result.message || "Failed to update recommendation.");
        await loadCanvassing(currentCanvassId);
        return;
    }

    await loadCanvassing(currentCanvassId);
}

function createPo() {

    const canvassId = document.getElementById("canvassId").value;

    const status = document.getElementById("status").value;

    if (status !== "OPEN" && status !== "COMPLETED") {
        alert("Canvassing is not available for PO creation.");
        return;
    }
    window.location.href =
        `/purchasing/purchase-orders/create/${canvassId}`;
}