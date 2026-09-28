let currentCanvassId = null;
let currentCanvassStatus = "";
let linkSupplierModal = null;

document.addEventListener("DOMContentLoaded", function () {
    const canvassId = document.getElementById("canvassId")?.value;

    linkSupplierModal =
        new bootstrap.Modal(
            document.getElementById("linkSupplierModal")
        );

    if (canvassId) {
        currentCanvassId = canvassId;
        loadCanvassing(canvassId);
    }

    document
        .getElementById("linkSupplierId")
        .addEventListener(
            "change",
            loadLinkSupplierManufacturers
        );
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

    //if (data.header.status === "OPEN" || data.header.status === "COMPLETED") {

    //    document.getElementById("createPoContainer").innerHTML = `
    //        <button class="btn btn-warning"
    //                onclick="createPo()">
    //            Create PO
    //        </button>
    //    `;
    //}
    //else {
    //    document.getElementById("createPoContainer").innerHTML = "";
    //}

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

    ${renderPreviousSupplier(line)}

    ${renderQuotes(line)}

</div>
            </div>
        `;
    }).join("");
}


function renderPreviousSupplier(line) {

    const previous =
        line.previousSupplier;

    if (!previous)
        return "";


    const score =
        previous.evaluationScore != null
            ? `${formatMoney(
                previous.evaluationScore
            )}%`
            : "No finalized evaluation";


    const rating =
        previous.evaluationRating
            ? escapeHtml(
                previous.evaluationRating
                    .replaceAll("_", " ")
            )
            : "-";


    return `
        <div class="alert alert-success border mb-3">

            <div class="d-flex flex-wrap
                        justify-content-between
                        align-items-center gap-3">

                <div>

                    <div class="fw-bold mb-1">

                        <span class="badge bg-success me-2">
                            Recommended Repeat Supplier
                        </span>

                        ${escapeHtml(
        previous.supplierName
    )}

                    </div>


                    <div class="small">

                        Previous PO:
                        <strong>
                            ${escapeHtml(
        previous.previousPoNo ?? "-"
    )}
                        </strong>

                        &nbsp; | &nbsp;

                        Previous Price:
                        <strong>
                            ₱${formatMoney(
        previous.previousUnitPrice
    )}
                        </strong>

                    </div>


                    <div class="small mt-1">

                        Last Evaluation:
                        <strong>${score}</strong>

                        &nbsp; | &nbsp;

                        Rating:
                        <strong>${rating}</strong>

                    </div>


                    <div class="small text-muted mt-1">

                        ${escapeHtml(
        previous.recommendationReason ??
        "Previously used supplier."
    )}

                    </div>

                </div>


                <div>

                    <button type="button"
                            class="btn btn-sm btn-success"
                            onclick="usePreviousSupplier(
                                ${line.canvassLineId},
                                ${line.materialId},
                                '${escapeJs(
        `${line.materialCode ?? ""} - ${line.materialName ?? ""}`
    )}',
                                ${previous.supplierId},
                                '${escapeJs(
        previous.supplierName ?? ""
    )}',
                                ${Number(
        previous.previousUnitPrice ?? 0
    )}
                            )">

                        Use Supplier / New Quote

                    </button>

                </div>

            </div>

        </div>
    `;
}


function renderQuotes(line) {
    const quotes = line.quotes ?? [];

    if (!quotes.length) {
        return `
            <div class="alert alert-light border mb-0">
               No current quotation yet.
Create a new quote if the supplier's current price or terms need to be confirmed.
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


async function usePreviousSupplier(
    canvassLineId,
    materialId,
    materialName,
    supplierId,
    supplierName,
    previousPrice
) {

    /*
     * Open normal Add Supplier Quote modal.
     * We DO NOT create a quote automatically.
     */
    await openQuoteModal(
        canvassLineId,
        materialId,
        materialName
    );


    const supplierSelect =
        document.getElementById(
            "quoteSupplierId"
        );


    /*
     * Select the previous supplier if it
     * exists in the supplier-material mapping.
     */
    supplierSelect.value =
        String(supplierId);


    if (supplierSelect.value !==
        String(supplierId)) {

        alert(
            `${supplierName} is the previous supplier, ` +
            `but it is no longer linked to this material.`
        );

        return;
    }


    /*
     * Trigger existing supplier onchange so
     * payment terms and delivery days load.
     */
    supplierSelect.dispatchEvent(
        new Event("change")
    );


    /*
     * IMPORTANT:
     *
     * Do NOT automatically use the previous
     * price as the current quotation.
     *
     * Show it only as reference.
     */
    const priceInput =
        document.getElementById(
            "quoteUnitPrice"
        );

    priceInput.value = "";

    priceInput.placeholder =
        previousPrice > 0
            ? `Previous: ₱${formatMoney(previousPrice)}`
            : "Enter current price";


    document.getElementById(
        "quoteRemarks"
    ).value =
        previousPrice > 0
            ? `Repeat order. Previous purchase price: ₱${formatMoney(previousPrice)}`
            : "Repeat order from previous supplier.";
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
    const today = new Date();
    const localToday =
        today.getFullYear() + "-" +
        String(today.getMonth() + 1).padStart(2, "0") + "-" +
        String(today.getDate()).padStart(2, "0");

    document.getElementById("quoteDate").value = localToday;

    document.getElementById("quoteDocumentsRemarks").value = "";
    document.getElementById("quoteQuotationRef").value = "";
   
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
async function reloadQuoteSuppliersAfterLink(materialId, supplierId) {

    // Reload linked suppliers for this material
    await loadLinkedSuppliers(materialId);

    const supplierSelect =
        document.getElementById("quoteSupplierId");

    // Automatically select the supplier we just linked
    supplierSelect.value = String(supplierId);

    if (supplierSelect.value !== String(supplierId)) {
        alert(
            "Supplier was linked successfully, " +
            "but could not be selected automatically."
        );
        return;
    }

    // Trigger existing onchange logic
    // This fills Payment Terms and Delivery Days
    supplierSelect.dispatchEvent(
        new Event("change")
    );
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

async function openLinkSupplierModal() {

    const materialId =
        parseInt(
            document.getElementById("quoteMaterialId").value || "0"
        );

    const materialName =
        document.getElementById("quoteMaterial").value;

    if (!materialId) {
        alert("Material is not available.");
        return;
    }

    document.getElementById("linkMaterialId").value =
        materialId;

    document.getElementById("linkMaterialName").value =
        materialName;

    document.getElementById("linkPreferred").checked =
        false;

    document.getElementById("linkSupplierRemarks").value =
        "";

    await loadSuppliersForLinking();

    document.getElementById("linkManufacturerId").innerHTML =
        '<option value="">Select Manufacturer</option>';

    const quoteModalEl =
        document.getElementById("quoteModal");

    quoteModalEl.addEventListener(
        "hidden.bs.modal",
        function handler() {

            quoteModalEl.removeEventListener(
                "hidden.bs.modal",
                handler
            );

            linkSupplierModal.show();
        }
    );

    bootstrap.Modal
        .getOrCreateInstance(quoteModalEl)
        .hide();
}

async function loadSuppliersForLinking() {

    const ddl =
        document.getElementById("linkSupplierId");

    ddl.innerHTML =
        '<option value="">Loading suppliers...</option>';

    try {

        const response =
            await fetch("/purchasing/suppliers/lookup");

        if (!response.ok) {
            ddl.innerHTML =
                '<option value="">Failed to load suppliers</option>';
            return;
        }

        const result = await response.json();

        const data =
            result.data ??
            result.Data ??
            result;

        ddl.innerHTML =
            '<option value="">Select Existing Supplier</option>';

        data.forEach(item => {

            const supplierId =
                item.supplierId ??
                item.SupplierId;

            const supplierCode =
                item.supplierCode ??
                item.SupplierCode ??
                "";

            const supplierName =
                item.supplierName ??
                item.SupplierName ??
                "";

            ddl.innerHTML += `
                <option value="${supplierId}">
                    ${escapeHtml(supplierCode)}
                    - ${escapeHtml(supplierName)}
                </option>
            `;
        });

    }
    catch (error) {

        console.error(error);

        ddl.innerHTML =
            '<option value="">Failed to load suppliers</option>';
    }
}

async function loadLinkSupplierManufacturers() {

    const supplierId =
        parseInt(
            document.getElementById("linkSupplierId").value || "0"
        );

    const ddl =
        document.getElementById("linkManufacturerId");

    ddl.innerHTML =
        '<option value="">Select Manufacturer</option>';

    if (!supplierId)
        return;

    try {

        const response =
            await fetch(
                `/purchasing/suppliers/${supplierId}/manufacturers`
            );

        if (!response.ok) {
            alert("Failed to load supplier manufacturers.");
            return;
        }

        const data =
            await response.json();

        if (!data || data.length === 0) {

            ddl.innerHTML =
                '<option value="">No manufacturer linked</option>';

            return;
        }

        data.forEach(item => {

            const manufacturerId =
                item.manufacturerId ??
                item.ManufacturerId;

            const manufacturerName =
                item.manufacturerName ??
                item.ManufacturerName ??
                "";

            ddl.innerHTML += `
                <option value="${manufacturerId}">
                    ${escapeHtml(manufacturerName)}
                </option>
            `;
        });

    }
    catch (error) {
        console.error(error);
        alert("Failed to load supplier manufacturers.");
    }
}

async function linkSupplierToMaterial() {

    const supplierId =
        parseInt(
            document.getElementById("linkSupplierId").value || "0"
        );

    const materialId =
        parseInt(
            document.getElementById("linkMaterialId").value || "0"
        );

    const manufacturerId =
        parseInt(
            document.getElementById("linkManufacturerId").value || "0"
        );

    if (!supplierId) {
        alert("Please select supplier.");
        return;
    }

    if (!materialId) {
        alert("Material is required.");
        return;
    }

    if (!manufacturerId) {
        alert("Please select manufacturer.");
        return;
    }

    const payload = {

        supplierId: supplierId,

        materialId: materialId,

        manufacturerId: manufacturerId,

        isPreferred:
            document.getElementById("linkPreferred").checked,

        remarks:
            document
                .getElementById("linkSupplierRemarks")
                .value
                .trim()
    };

    try {

        const response =
            await fetch(
                "/purchasing/suppliers/materials/create",
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify(payload)
                }
            );

        if (!response.ok) {

            const errorText =
                await response.text();

            alert(
                errorText ||
                "Failed to link supplier to material."
            );

            return;
        }

        // Close link modal first
        linkSupplierModal.hide();

        // Wait until it is completely closed
        const linkModalEl =
            document.getElementById("linkSupplierModal");

        linkModalEl.addEventListener(
            "hidden.bs.modal",
            async function handler() {

                linkModalEl.removeEventListener(
                    "hidden.bs.modal",
                    handler
                );

                /*
                 * IMPORTANT:
                 * Reload the supplier list for the current material.
                 *
                 * We will connect this to your existing canvassing
                 * supplier-loading function.
                 */

                await reloadQuoteSuppliersAfterLink(
                    materialId,
                    supplierId
                );

                bootstrap.Modal
                    .getOrCreateInstance(
                        document.getElementById("quoteModal")
                    )
                    .show();
            }
        );

    }
    catch (error) {

        console.error(error);

        alert(
            "Failed to link supplier to material."
        );
    }
}
function closeLinkSupplierModal() {

    linkSupplierModal.hide();

    const linkModalEl =
        document.getElementById("linkSupplierModal");

    linkModalEl.addEventListener(
        "hidden.bs.modal",
        function handler() {

            linkModalEl.removeEventListener(
                "hidden.bs.modal",
                handler
            );

            bootstrap.Modal
                .getOrCreateInstance(
                    document.getElementById("quoteModal")
                )
                .show();
        }
    );
}