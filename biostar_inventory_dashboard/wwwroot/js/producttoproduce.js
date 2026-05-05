
let savedPtpId = null;
let cachedCategories = [];

document.addEventListener("DOMContentLoaded", function () {
    setDefaultDate();
    loadCategoriesForManual();
    document.getElementById("btnLoadShortages")?.addEventListener("click", loadPlanningShortages);
    document.getElementById("btnAddManualLine")?.addEventListener("click", addManualLine);
    document.getElementById("btnSavePtp")?.addEventListener("click", savePtpRequest);
    document.getElementById("btnPrintPtp")?.addEventListener("click", printPtpRequest);


    document.addEventListener("click", function (e) {
        const btn = e.target.closest(".btn-remove-line");
        if (!btn) return;

        btn.closest("tr")?.remove();
        refreshEmptyRow();
    });
});


async function loadCategoriesForManual() {
    try {
        const response = await fetch("/Categories/GetCategories");

        if (!response.ok) throw new Error(await response.text());

        const data = await response.json();

        cachedCategories = Array.isArray(data) ? data : data.items || [];

    } catch (err) {
        console.error(err);
        cachedCategories = [];
        alert("Failed to load categories.");
    }
}

function setDefaultDate() {
    const input = document.getElementById("requestedDate");
    if (!input) return;

    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");

    input.value = `${yyyy}-${mm}-${dd}`;
}

async function loadPlanningShortages() {
    try {
        const response = await fetch("/ProductToProduce/GetPlanningShortages");
        if (!response.ok) throw new Error(await response.text());

        const data = await response.json();

        if (!data || data.length === 0) {
            alert("No planning shortages found.");
            return;
        }

        clearEmptyRow();

        data.forEach(item => {
            addLine({
                productId: item.productId,
                productName: item.productName,
                suggestedQty: item.shortageQty,
                qtyInput: item.shortageQty,
                requestedQty: item.shortageQty,
                uom: item.uom,
                packUom: item.packUom,
                packQty: item.packQty,
                deliveryDate: document.getElementById("requestedDate").value,
                remarks: "",
                sourceType: "PLANNING",
                readonlyProduct: true
            });
        });

    } catch (err) {
        console.error(err);
        alert("Failed to load planning shortages.");
    }
}

function addManualLine() {
    clearEmptyRow();

    addLine({
        productId: "",
        productName: "",
        suggestedQty: 0,
        qtyInput: 0,
        requestedQty: 0,
        uom: "",
        packUom: "",
        packQty: 0,
        deliveryDate: document.getElementById("requestedDate").value,
        remarks: "",
        sourceType: "MANUAL",
        readonlyProduct: false
    });
}

function addLine(line) {
    const tbody = document.getElementById("ptpLinesBody");

    const categoryOptions = cachedCategories.map(c => `
    <option value="${safe(c.catg_id || c.catgId || "")}">
        ${safe(c.catg_name || c.catgName || "")}
    </option>
`).join("");

    const productCell = line.readonlyProduct
        ? `
        <div class="fw-semibold">${safe(line.productName)}</div>
        <small class="text-muted">${safe(line.productId)}</small>
        <input type="hidden" class="line-product-id" value="${safe(line.productId)}" />
        <input type="hidden" class="line-product-name" value="${safe(line.productName)}" />
    `
        : `
        <select class="form-select mb-1 line-category-select">
            <option value="">Select Category</option>
            ${categoryOptions}
        </select>

        <select class="form-select line-product-select">
            <option value="">Select Product</option>
        </select>

        <input type="hidden" class="line-product-id" value="" />
        <input type="hidden" class="line-product-name" value="" />
    `;

    const hasPack = line.packUom && Number(line.packQty || 0) > 0;

    tbody.insertAdjacentHTML("beforeend", `
        <tr>
            <td>${productCell}</td>

            <td>
                <input type="number"
                       class="form-control line-suggested-qty"
                       value="${Number(line.suggestedQty || 0)}"
                       readonly />
                <small class="text-muted">${safe(line.uom || "")}</small>

                <input type="hidden" class="line-uom" value="${safe(line.uom || "")}" />
                <input type="hidden" class="line-base-uom" value="${safe(line.uom || "")}" />
                <input type="hidden" class="line-pack-uom" value="${safe(line.packUom || "")}" />
                <input type="hidden" class="line-pack-qty" value="${Number(line.packQty || 0)}" />
                <input type="hidden" class="line-requested-qty" value="${Number(line.requestedQty || 0)}" />
            </td>

            <td>
                <input type="number"
                       class="form-control line-qty-input"
                       min="0"
                       step="0.01"
                       value="${Number(line.qtyInput || line.requestedQty || 0)}" />
            </td>

            <td>
                <select class="form-select line-uom-type">
                    <option value="BASE">Base (${safe(line.uom || "")})</option>
                    ${hasPack ? `<option value="PACK">Pack (${safe(line.packUom)})</option>` : ""}
                </select>
                ${hasPack
            ? `<small class="text-muted">1 ${safe(line.packUom)} = ${formatQty(line.packQty)} ${safe(line.uom || "")}</small>`
            : `<small class="text-muted">No pack setup</small>`
        }
            </td>

            <td>
                <div class="fw-semibold line-base-display"></div>
            </td>

            <td>
                <input type="date"
                       class="form-control line-delivery-date"
                       value="${safe(line.deliveryDate || "")}" />
            </td>

            <td>
                <input type="text"
                       class="form-control line-remarks"
                       value="${safe(line.remarks || "")}"
                       placeholder="Remarks" />
            </td>

            <td>
                <span class="badge ${line.sourceType === "PLANNING" ? "bg-primary" : "bg-secondary"}">
                    ${safe(line.sourceType)}
                </span>
                <input type="hidden" class="line-source-type" value="${safe(line.sourceType)}" />
            </td>

            <td class="text-center">
                <button type="button" class="btn btn-outline-danger btn-sm btn-remove-line">
                    Remove
                </button>
            </td>
        </tr>
    `);

    const row = tbody.lastElementChild;
    bindPtpQtyConversion(row);
    if (!line.readonlyProduct) {
        bindManualProductDropdown(row);
    }
   
}

function bindPtpQtyConversion(row) {
    const qtyInput = row.querySelector(".line-qty-input");
    const uomType = row.querySelector(".line-uom-type");

    function recalc() {
        const qty = Number(qtyInput.value || 0);
        const type = uomType.value || "BASE";

        const packQty = Number(row.querySelector(".line-pack-qty")?.value || 0);
        const baseUom = row.querySelector(".line-base-uom")?.value || "";
        const packUom = row.querySelector(".line-pack-uom")?.value || "";

        let baseQty = qty;

        if (type === "PACK") {
            if (packQty <= 0) {
                baseQty = 0;
            } else {
                baseQty = qty * packQty;
            }
        }

        row.querySelector(".line-requested-qty").value = baseQty;

        let display = `${formatQty(baseQty)} ${baseUom}`.trim();

        if (type === "PACK" && packQty > 0) {
            display += `<br><small class="text-muted">${formatQty(qty)} ${packUom}</small>`;
        }

        row.querySelector(".line-base-display").innerHTML = display;
    }

    qtyInput.addEventListener("input", recalc);
    uomType.addEventListener("change", recalc);

    recalc();
}

async function savePtpRequest() {
    const rows = Array.from(document.querySelectorAll("#ptpLinesBody tr"))
        .filter(row => !row.querySelector("td[colspan]"));

    if (rows.length === 0) {
        alert("Please add at least one product.");
        return;
    }

    const lines = rows.map(row => {
        return {
            productId: row.querySelector(".line-product-id")?.value.trim() || "",
            productName: row.querySelector(".line-product-name")?.value.trim() || "",

            suggestedQty: Number(row.querySelector(".line-suggested-qty")?.value || 0),

            qtyInput: Number(row.querySelector(".line-qty-input")?.value || 0),
            uomType: row.querySelector(".line-uom-type")?.value || "BASE",

            // final BASE qty
            requestedQty: Number(row.querySelector(".line-requested-qty")?.value || 0),

            uom: row.querySelector(".line-uom")?.value || "",
            packUom: row.querySelector(".line-pack-uom")?.value || "",
            packQty: Number(row.querySelector(".line-pack-qty")?.value || 0),

            deliveryDate: row.querySelector(".line-delivery-date")?.value || null,
            remarks: row.querySelector(".line-remarks")?.value.trim() || "",
            sourceType: row.querySelector(".line-source-type")?.value || "MANUAL"
        };
    }).filter(x => x.productId && x.productName && x.requestedQty > 0);

    if (lines.length === 0) {
        alert("Please complete at least one valid line.");
        return;
    }

    const payload = {
        requestedDate: document.getElementById("requestedDate").value,
        remarks: document.getElementById("headerRemarks").value.trim(),
        createdBy: document.getElementById("createdBy").value,
        lines
    };

    try {
        const response = await fetch("/ProductToProduce/Create", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) throw new Error(await response.text());

        const result = await response.json();

        savedPtpId = result.ptpId;
        document.getElementById("btnPrintPtp").disabled = false;

        alert(result.message || "PTP request saved.");

    } catch (err) {
        console.error(err);
        alert("Failed to save PTP request: " + err.message);
    }
}


function bindManualProductDropdown(row) {
    const categorySelect = row.querySelector(".line-category-select");
    const productSelect = row.querySelector(".line-product-select");

    if (!categorySelect || !productSelect) return;

    categorySelect.addEventListener("change", async function () {
        const categoryId = this.value;

        productSelect.innerHTML = `<option value="">Loading...</option>`;

        row.querySelector(".line-product-id").value = "";
        row.querySelector(".line-product-name").value = "";

        if (!categoryId) {
            productSelect.innerHTML = `<option value="">Select Product</option>`;
            return;
        }

        try {
            const response = await fetch(`/Product/GetProductsLookup?categoryId=${encodeURIComponent(categoryId)}`);

            if (!response.ok) throw new Error(await response.text());

            const products = await response.json();

            productSelect.innerHTML = `<option value="">Select Product</option>`;

            products.forEach(p => {
                productSelect.insertAdjacentHTML("beforeend", `
                    <option
                        value="${safe(p.productId || p.product_id || "")}"
                        data-name="${safe(p.productName || p.product_name || "")}"
                        data-uom="${safe(p.uom || "")}"
                        data-pack-uom="${safe(p.packUom || p.pack_uom || "")}"
                        data-pack-qty="${Number(p.packQty || p.pack_qty || 0)}">
                        ${safe(p.productName || p.product_name || "")}
                    </option>
                `);
            });

        } catch (err) {
            console.error(err);
            productSelect.innerHTML = `<option value="">Failed to load products</option>`;
        }
    });

    productSelect.addEventListener("change", function () {
        const opt = this.options[this.selectedIndex];

        const productId = opt.value || "";
        const productName = opt.dataset.name || "";
        const uom = opt.dataset.uom || "";
        const packUom = opt.dataset.packUom || "";
        const packQty = Number(opt.dataset.packQty || 0);

        row.querySelector(".line-product-id").value = productId;
        row.querySelector(".line-product-name").value = productName;

        row.querySelector(".line-uom").value = uom;
        row.querySelector(".line-base-uom").value = uom;
        row.querySelector(".line-pack-uom").value = packUom;
        row.querySelector(".line-pack-qty").value = packQty;

        const uomSmall = row.querySelector(".line-suggested-qty")?.closest("td")?.querySelector("small");
        if (uomSmall) uomSmall.textContent = uom;

        const uomType = row.querySelector(".line-uom-type");
        const hasPack = packUom && packQty > 0;

        uomType.innerHTML = `
            <option value="BASE">Base (${safe(uom)})</option>
            ${hasPack ? `<option value="PACK">Pack (${safe(packUom)})</option>` : ""}
        `;

        const uomTypeSmall = uomType.closest("td").querySelector("small");
        if (uomTypeSmall) {
            uomTypeSmall.innerHTML = hasPack
                ? `1 ${safe(packUom)} = ${formatQty(packQty)} ${safe(uom)}`
                : `No pack setup`;
        }

        row.querySelector(".line-qty-input").dispatchEvent(new Event("input"));
    });
}
async function printPtpRequest() {
    if (!savedPtpId) {
        alert("Save the request first before printing.");
        return;
    }

    try {
        const response = await fetch(`/ProductToProduce/GetById?id=${savedPtpId}`);
        if (!response.ok) throw new Error(await response.text());

        const data = await response.json();

        const rows = (data.lines || []).map((line, index) => {
            const packText =
                line.uom_type === "PACK" && line.pack_qty > 0
                    ? `<br><small>${formatQty(line.qty_input)} ${safe(line.pack_uom || "")}</small>`
                    : "";

            return `
                <tr>
                    <td>${index + 1}</td>
                    <td>${safe(line.product_name)}</td>
                    <td class="text-end">
                        ${formatQty(line.requested_qty)} ${safe(line.uom || "")}
                        ${packText}
                    </td>
                    <td>${formatDate(line.delivery_date)}</td>
                    <td>${safe(line.remarks || "")}</td>
                </tr>
            `;
        }).join("");

        const html = `
            <div class="print-document">
                <h3 class="text-center">PRODUCT TO PRODUCE REQUEST</h3>

                <div class="print-meta">
                    <div><b>PTP No:</b> ${safe(data.ptp_no)}</div>
                    <div><b>Requested Date:</b> ${formatDate(data.requested_date)}</div>
                    <div><b>Status:</b> ${safe(data.status)}</div>
                    <div><b>Created By:</b> ${safe(data.created_by || "")}</div>
                </div>

                <table class="print-table">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Product Name</th>
                            <th>Quantity</th>
                            <th>Delivery Date</th>
                            <th>Remarks</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rows}
                    </tbody>
                </table>

                <div class="signature-area">
                    <div>Prepared By: ____________________</div>
                    <div>Approved By: ____________________</div>
                    <div>Received By Production: ____________________</div>
                </div>
            </div>
        `;

        const printArea = document.getElementById("printArea");
        printArea.innerHTML = html;
        printArea.classList.remove("d-none");

        window.print();

        printArea.classList.add("d-none");

    } catch (err) {
        console.error(err);
        alert("Failed to print PTP request: " + err.message);
    }
}

function clearEmptyRow() {
    const tbody = document.getElementById("ptpLinesBody");
    const emptyRow = tbody.querySelector("td[colspan]");
    if (emptyRow) tbody.innerHTML = "";
}

function refreshEmptyRow() {
    const tbody = document.getElementById("ptpLinesBody");
    const rows = tbody.querySelectorAll("tr");

    if (rows.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9" class="text-center text-muted py-4">No products added yet.</td>
            </tr>
        `;
    }
}

function formatQty(value) {
    return Number(value || 0).toLocaleString("en-US", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    });
}

function formatDate(dateStr) {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "";

    return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric"
    });
}

function safe(value) {
    if (value === null || value === undefined) return "";
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}