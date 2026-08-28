
let productList = [];
let selectedProduct = null;
let selectedSearchProduct = null;

document.addEventListener("DOMContentLoaded", function () {
    loadBranches();
    loadSuppliers();
    loadCategories();

    document.getElementById("categoryId")?.addEventListener("change", searchProducts);
    document.getElementById("productSearch")?.addEventListener("input", debounce(searchProducts, 300));
    document.getElementById("btnAddSelectedProduct")?.addEventListener("click", addSelectedProductToTable);

    document.getElementById("manualStockInForm")?.addEventListener("submit", showConfirmStockInModal);
    document.getElementById("btnConfirmSaveStockIn")?.addEventListener("click", saveManualStockIn);
    document.getElementById("btnClearStockIn")?.addEventListener("click", clearManualStockInForm);

  
});
function showConfirmStockInModal(e) {
    e.preventDefault();


    const today = new Date().toISOString().split("T")[0];

    document.getElementById("confirmStockInDate").value = today;


    const branchSelect = document.getElementById("branchId");
    const supplierSelect = document.getElementById("supplierId");

    const branchId = branchSelect.value;
    const rows = [...document.querySelectorAll("#transmittalRows tr")];

    if (!branchId) return alert("Please select branch.");
    if (rows.length === 0) return alert("Please add at least one item.");

    const confirmRows = document.getElementById("confirmStockInRows");
    confirmRows.innerHTML = "";

    for (const row of rows) {
        const description = row.querySelector(".description-input")?.value || "";
        const qty = row.querySelector(".qty-input")?.value || "";
        const uom = row.querySelector(".input-group-text")?.innerText || "";
        const pack = row.querySelector(".pack-display-input")?.value || "";
        const productLine = row.querySelector(".productline-input")?.value || "";
        const lotNo = (
            row.querySelector(".lot-input")?.value || ""
        ).trim().toUpperCase();
        const expDate = row.querySelector(".exp-input")?.value || "";

        if (!qty || Number(qty) <= 0) return alert("Please enter valid quantity.");
        if (!lotNo) return alert("Please enter batch/lot number.");
        if (!expDate) return alert("Please enter expiration date.");

        confirmRows.innerHTML += `
            <tr>
                <td>${description}</td>
                <td class="text-end">${qty} ${uom}</td>
                <td>${pack}</td>
                <td>${productLine}</td>
                <td>${lotNo}</td>
                <td>${expDate}</td>
            </tr>
        `;
    }

    document.getElementById("confirmBranch").innerText =
        branchSelect.options[branchSelect.selectedIndex]?.text || "-";

    document.getElementById("confirmSupplier").innerText =
        supplierSelect.value
            ? supplierSelect.options[supplierSelect.selectedIndex]?.text
            : "-";

    document.getElementById("confirmTransmittal").innerText =
        document.getElementById("transmittalNo").value || "-";

    document.getElementById("confirmRemarks").innerText =
        document.getElementById("remarks").value || "-";

    const modal = new bootstrap.Modal(document.getElementById("confirmStockInModal"));
    modal.show();
}
async function searchProducts() {
    const categoryId = document.getElementById("categoryId")?.value || "";
    const search = document.getElementById("productSearch")?.value.trim() || "";
    const results = document.getElementById("productSearchResults");

    selectedSearchProduct = null;
    results.innerHTML = "";

    if (search.length < 2) return;

    try {
        const url = `/ManualStockIn/GetProducts?categoryId=${encodeURIComponent(categoryId)}&search=${encodeURIComponent(search)}`;

        const res = await fetch(url);
        const result = await res.json();

        console.log("SEARCH PRODUCT RESPONSE:", result);

        let data =
            result.data ||
            result.Data ||
            result.items ||
            result.Items ||
            result.products ||
            result.Products ||
            result;

        if (!Array.isArray(data)) data = [];

        if (data.length === 0) {
            results.innerHTML = `
        <div class="list-group-item text-muted">
            No product found
        </div>`;
            return;
        }

        const searchLower = search.toLowerCase();

        data = data.filter(p => {
            const generic = (p.product_name || p.productName || p.name || "").toLowerCase();
            const brand = (p.product_description || p.productDescription || "").toLowerCase();

            return generic.includes(searchLower) || brand.includes(searchLower);
        });

        data.forEach(p => {
            const productId = p.product_id || p.productId || p.id;
            const generic = p.product_name || p.productName || p.name || "";
            const brand = p.product_description || p.productDescription || "";

            const display = brand ? `${generic} - ${brand}` : generic;

            const productLine =
                p.category_name ||
                p.categoryName ||
                p.catg_name ||
                p.catgName ||
                p.category ||
                "";

            const uom = p.uom || p.Uom || p.base_uom || p.baseUom || "";

            const packQty = Number(
                p.pack_qty ||
                p.packQty ||
                p.pack_quantity ||
                p.packQuantity ||
                p.pack_size ||
                p.packSize ||
                0
            );

            const packUom =
                p.pack_uom ||
                p.packUom ||
                p.pack_unit ||
                p.packUnit ||
                p.pack_unit_name ||
                p.packUnitName ||
                "";

            const item = document.createElement("button");
            item.type = "button";
            item.className = "list-group-item list-group-item-action";
            item.innerHTML = `
    <strong>${display}</strong><br>
    <small class="text-muted">${productLine}</small>
`;

            item.addEventListener("click", function () {
                selectedSearchProduct = {
                    productId: productId,
                    description: display,
                    productLine: productLine,
                    packQty: packQty,
                    packUom: packUom,
                    uom: uom
                };
                document.getElementById("productSearch").value = display;
                results.innerHTML = "";
            });

            results.appendChild(item);
        });

    } catch (err) {
        console.error("Failed to search products", err);
        results.innerHTML = `
            <div class="list-group-item text-danger">
                Error loading products
            </div>`;
    }
}

function addSelectedProductToTable() {
    if (!selectedSearchProduct) {
        alert("Please select a product first.");
        return;
    }

    const tbody = document.getElementById("transmittalRows");

    const row = document.createElement("tr");

    const packQty = Number(selectedSearchProduct.packQty || 0);
    const packUom = selectedSearchProduct.packUom || "";
    const uom = selectedSearchProduct.uom || "";

    row.innerHTML = `
        <td>
            <input type="hidden"
                   class="product-id"
                   value="${selectedSearchProduct.productId}">

            <input type="text"
                   class="form-control description-input"
                   value="${selectedSearchProduct.description}"
                   readonly>
        </td>

       <td>
    <div class="input-group">
        <input type="number"
               class="form-control qty-input"
               min="0"
               step="0.01"
               placeholder="0.00"
               required>

        <span class="input-group-text">
            ${selectedSearchProduct.uom || ""}
        </span>
    </div>
</td>

<td>
    <input type="text"
           class="form-control pack-display-input"
           value="-"
           readonly>
</td>

       <td>
    <input type="text"
           class="form-control productline-input"
           value="${selectedSearchProduct.productLine || ""}"
           readonly>
</td>

        <td>
            <input type="text"
                   class="form-control lot-input"
                   required>
        </td>

        <td>
            <input type="month"
                   class="form-control exp-input"
                   required>
        </td>

        <td class="text-center">
            <button type="button"
                    class="btn btn-sm btn-outline-danger"
                    onclick="this.closest('tr').remove()">
                ×
            </button>
        </td>
    `;

    const qtyInput = row.querySelector(".qty-input");
    const packDisplayInput = row.querySelector(".pack-display-input");


    const lotInput = row.querySelector(".lot-input");

    lotInput.addEventListener("input", function () {
        lotInput.value = lotInput.value.toUpperCase();
    });

    qtyInput.addEventListener("input", function () {
        const qty = Number(qtyInput.value || 0);

        packDisplayInput.value = formatPack(
            qty,
            packQty,
            packUom,
            uom
        );
    });

   

    tbody.appendChild(row);

    selectedSearchProduct = null;

    document.getElementById("productSearch").value = "";
    document.getElementById("productSearchResults").innerHTML = "";
}

function formatPack(qty, packQty, packUom, baseUom) {
    qty = Number(qty || 0);
    packQty = Number(packQty || 0);

    if (qty <= 0) return "-";
    if (packQty <= 0 || !packUom) return `${qty} ${baseUom}`;

    const fullPacks = Math.floor(qty / packQty);
    const remainder = qty % packQty;

    if (fullPacks <= 0) {
        return `${qty} ${baseUom}`;
    }

    if (remainder <= 0) {
        return `${fullPacks} ${packUom}`;
    }

    return `${fullPacks} ${packUom} & ${remainder} ${baseUom}`;
}

//function addTransmittalRow() {
//    const tbody = document.getElementById("transmittalRows");

//    const row = document.createElement("tr");

//    row.innerHTML = `
//        <td>
//            <select class="form-select product-select" required>
//                <option value="">Select product</option>
//                ${productList.map(p => {
//        const id = p.product_id || p.productId || p.id;
//        const name = p.product_name || p.productName || p.name || "";
//        const desc = p.product_description || p.productDescription || "";
//        const display = desc ? `${name} - ${desc}` : name;
//        return `<option value="${id}">${display}</option>`;
//    }).join("")}
//            </select>
//        </td>

//        <td>
//            <input type="number" class="form-control qty-input" min="0" step="0.01" required>
//        </td>

//        <td>
//            <input type="number" class="form-control packqty-input" min="0" step="0.01" value="1">
//        </td>

//        <td>
//            <input type="text" class="form-control productline-input" placeholder="Product line">
//        </td>

//        <td>
//            <input type="text" class="form-control lot-input" required>
//        </td>

//        <td>
//            <input type="month" class="form-control exp-input" required>
//        </td>

//        <td class="text-center">
//            <button type="button" class="btn btn-sm btn-outline-danger" onclick="this.closest('tr').remove()">×</button>
//        </td>
//    `;

//    tbody.appendChild(row);
//}

async function loadBranches() {
    const select = document.getElementById("branchId");

    try {
        const res = await fetch("/ManualStockIn/GetBranches");
        const data = await res.json();

        select.innerHTML = `<option value="">Select branch</option>`;

        data.forEach(x => {
            select.innerHTML += `<option value="${x.branch_id}">${x.branch_name}</option>`;
        });
    } catch (err) {
        console.error("Failed to load branches", err);
    }
}
function loadMonthYear(monthId, yearId) {
    const monthSelect = document.getElementById(monthId);
    const yearSelect = document.getElementById(yearId);

    const now = new Date();
    const currentMonth = String(now.getMonth() + 1).padStart(2, "0");
    const currentYear = now.getFullYear();

    // Months
    const months = [
        "01", "02", "03", "04", "05", "06",
        "07", "08", "09", "10", "11", "12"
    ];

    monthSelect.innerHTML = `<option value="">MM</option>`;
    months.forEach(m => {
        monthSelect.innerHTML += `<option value="${m}">${m}</option>`;
    });

    // Years (current -2 to +4)
    const startYear = currentYear - 2;
    const endYear = currentYear + 4;

    yearSelect.innerHTML = `<option value="">YYYY</option>`;

    for (let y = startYear; y <= endYear; y++) {
        yearSelect.innerHTML += `<option value="${y}">${y}</option>`;
    }

    // ✅ DEFAULT VALUES
    monthSelect.value = currentMonth;
    yearSelect.value = currentYear;
}

function buildDate(yearId, monthId) {
    const year = document.getElementById(yearId).value;
    const month = document.getElementById(monthId).value;

    if (!year || !month) return null;

    return `${year}-${month}-01`;
}

async function loadCategories() {
    const select = document.getElementById("categoryId");

    try {
        const res = await fetch("/ManualStockIn/GetCategories");
        const data = await res.json();

        console.log("CATEGORY DATA:", data);

        select.innerHTML = `<option value="">All categories</option>`;

        data.forEach(x => {
            const categoryId =
                x.catg_id ||
                x.catgId ||
                x.category_id ||
                x.categoryId ||
                "";

            const categoryName =
                x.catg_name ||
                x.catgName ||
                x.category_name ||
                x.categoryName ||
                x.name ||
                "";

            select.innerHTML += `
                <option value="${categoryId}">
                    ${categoryName}
                </option>
            `;
        });

    } catch (err) {
        console.error("Failed to load categories", err);
    }
}

async function loadSuppliers() {
    const select = document.getElementById("supplierId");

    try {
        const res = await fetch("/ManualStockIn/GetSuppliers");
        const data = await res.json();

        select.innerHTML = `<option value="">Select supplier</option>`;

        data
            .filter(x => (x.partner_type || "").toUpperCase() === "SUPPLIER")
            .forEach(x => {
                select.innerHTML += `<option value="${x.partner_id}">${x.partner_name}</option>`;
            });

    } catch (err) {
        console.error("Failed to load suppliers", err);
    }
}

async function loadProducts() {
    const select = document.getElementById("productId");
    const categoryId = document.getElementById("categoryId")?.value || "";
    const source = document.getElementById("productSource")?.value || "";

    try {
        const url = `/ManualStockIn/GetProducts?categoryId=${encodeURIComponent(categoryId)}&source=${encodeURIComponent(source)}`;

        const res = await fetch(url);
        const result = await res.json();

        console.log("PRODUCT RESPONSE:", result);

        const data =
            result.data ||
            result.Data ||
            result.items ||
            result.Items ||
            result.products ||
            result.Products ||
            result;

        productList = data; // ✅ ADD THIS

        select.innerHTML = `<option value="">Select product</option>`;

        data.forEach(x => {
            const productId =
                x.product_id ||
                x.productId ||
                x.id ||
                "";

            const productName =
                x.product_name ||
                x.productName ||
                x.name ||
                "";

            const productDescription =
                x.product_description ||
                x.productDescription ||
                "";

            const productSource =
                x.product_source ||
                x.productSource ||
                "";

            const displayName = productDescription
                ? `${productName} - ${productDescription}`
                : productName;

            select.innerHTML += `
    <option value="${productId}">
        ${displayName}
    </option>
`;

        });

    } catch (err) {
        console.error("Failed to load products", err);
    }
}
function onProductChanged() {
    const productId = document.getElementById("productId").value;

    selectedProduct = productList.find(x =>
        (x.product_id || x.productId || x.id) === productId
    ) || null;

    const uom = selectedProduct?.uom || selectedProduct?.Uom || "";
    const packUom = selectedProduct?.pack_uom || selectedProduct?.packUom || "";
    const packQty = Number(selectedProduct?.pack_qty || selectedProduct?.packQty || 0);

    document.getElementById("baseUomLabel").innerText = uom || "UOM";

    const packContainer = document.getElementById("packContainer");

    if (!packUom || packQty <= 0) {
        // ❌ NO PACK → HIDE
        packContainer.style.display = "none";

        document.getElementById("qtyBreakdown").innerText =
            `Input in ${uom || "base UOM"} only`;

    } else {
        // ✅ HAS PACK → SHOW
        packContainer.style.display = "block";

        document.getElementById("packUomLabel").innerText = packUom;

        document.getElementById("qtyBreakdown").innerText =
            `1 ${packUom} = ${packQty} ${uom}`;
    }

    // reset inputs
    document.getElementById("packInput").value = 0;
    document.getElementById("looseInput").value = 0;

    calculateTotalQty();
}

function calculateTotalQty() {
    const uom = selectedProduct?.uom || selectedProduct?.Uom || "";
    const packUom = selectedProduct?.pack_uom || selectedProduct?.packUom || "";
    const packQty = Number(selectedProduct?.pack_qty || selectedProduct?.packQty || 0);

    const packs = Number(document.getElementById("packInput")?.value || 0);
    const loose = Number(document.getElementById("looseInput")?.value || 0);

    const total = (packs * packQty) + loose;

    document.getElementById("quantity").value = total > 0 ? total.toFixed(2) : "";

    if (packUom && packQty > 0) {
        document.getElementById("qtyBreakdown").innerText =
            `${packs} ${packUom} + ${loose} ${uom} = ${total.toFixed(2)} ${uom}`;
    } else {
        document.getElementById("qtyBreakdown").innerText =
            `${loose} ${uom}`;
    }
}
async function saveManualStockIn(e) {
    if (e) e.preventDefault();

    const branchId = document.getElementById("branchId").value;
    const supplierId = document.getElementById("supplierId").value || null;
    const transmittalNo = document.getElementById("transmittalNo").value.trim();
    const remarks = document.getElementById("remarks").value.trim();

    const stockInDate =
        document.getElementById("confirmStockInDate").value;

    if (!branchId) return alert("Please select branch.");

    const rows = [...document.querySelectorAll("#transmittalRows tr")];

    if (rows.length === 0) {
        return alert("Please add at least one item.");
    }

    const btn = document.getElementById("btnSaveStockIn");
    btn.disabled = true;
    btn.innerText = "Saving...";

    try {
        for (const row of rows) {
            const productId = row.querySelector(".product-id").value;
            const qty = Number(row.querySelector(".qty-input").value || 0);
            //const qtyPerPack = Number(row.querySelector(".packqty-input").value || 1);
            const productLine = row.querySelector(".productline-input").value.trim();
            const lotNo = row.querySelector(".lot-input")
                .value
                .trim()
                .toUpperCase();
            const expMonth = row.querySelector(".exp-input").value;

            if (!productId) throw new Error("Please select product for all rows.");
            if (qty <= 0) throw new Error("Please enter valid quantity.");
            if (!lotNo) throw new Error("Please enter batch/lot number.");
            if (!expMonth) throw new Error("Please enter expiration date.");

            const body = {
                branch_id: branchId,
                product_id: productId,
                supplier_id: supplierId,

                quantity: qty,
                lot_no: lotNo,

                manufacturing_date: stockInDate,
                expiration_date: `${expMonth}-01`,

                reference_type: "TRANSMITTAL_REPORT",
                dr_no: "",
                inv_no: "",
                po_no: "",
                tr_no: transmittalNo,

                remarks: document.getElementById("remarks").value.trim(),
                scanned_by: window.currentUserId || "UNKNOWN"
            };

            const res = await fetch("/ManualStockIn/Save", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(body)
            });

            if (!res.ok) {
                const text = await res.text();
                throw new Error(text || "Failed to save item.");
            }
        }

        // CLOSE CONFIRM MODAL
        const modalEl = document.getElementById("confirmStockInModal");
        const modal = bootstrap.Modal.getInstance(modalEl);
        if (modal) modal.hide();

        // SUCCESS
        alert("Transmittal Stock IN saved successfully.");

        document.getElementById("transmittalRows").innerHTML = "";
        selectedSearchProduct = null;

    } catch (err) {
        alert(err.message);
    } finally {
        btn.disabled = false;
        btn.innerText = "Save Stock IN";
    }
}

//function clearManualStockInForm() {
//    const form = document.getElementById("manualStockInForm");
//    if (form) form.reset();

//    document.getElementById("remarks").value = "Manual Stock IN via Dashboard";

//    loadProducts();
//}

function clearManualStockInForm() {
    // keep these
    const branchId = document.getElementById("branchId").value;
    const productSource = document.getElementById("productSource")?.value || "";
    const supplierId = document.getElementById("supplierId")?.value || "";

    // CLEAR product + qty inputs
    document.getElementById("productId").value = "";
    document.getElementById("packInput").value = 0;
    document.getElementById("looseInput").value = 0;
    document.getElementById("quantity").value = "";
    const transmittalInput = document.getElementById("transmittalNo");
    if (transmittalInput) {
        transmittalInput.value = "";
    }

    // reset selected product object
    selectedProduct = null;

    // hide pack UI again
    document.getElementById("packContainer").style.display = "none";
    document.getElementById("qtyBreakdown").innerText = "";

    // restore kept values
    document.getElementById("branchId").value = branchId;

    if (document.getElementById("productSource")) {
        document.getElementById("productSource").value = productSource;
    }

    if (document.getElementById("supplierId")) {
        document.getElementById("supplierId").value = supplierId;
    }

    // reload product list based on category + source
    loadProducts();
}

function debounce(fn, delay) {
    let timer;
    return function () {
        clearTimeout(timer);
        timer = setTimeout(fn, delay);
    };
}