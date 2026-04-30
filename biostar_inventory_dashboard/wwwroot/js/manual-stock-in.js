
let productList = [];
let selectedProduct = null;
document.addEventListener("DOMContentLoaded", function () {
    loadBranches();
    loadCategories();
    loadSuppliers();
    loadProducts();
    loadMonthYear("mfgMonth", "mfgYear");
    loadMonthYear("expMonth", "expYear");
    const form = document.getElementById("manualStockInForm");
    const btnClear = document.getElementById("btnClearStockIn");
    const categoryId = document.getElementById("categoryId");
    const productSource = document.getElementById("productSource");


    if (form) form.addEventListener("submit", saveManualStockIn);
    if (btnClear) btnClear.addEventListener("click", clearManualStockInForm);

    if (categoryId) {
        categoryId.addEventListener("change", loadProducts);
    }

    if (productSource) {
        productSource.addEventListener("change", loadProducts);
    }

    document.getElementById("productId")?.addEventListener("change", onProductChanged);
    document.getElementById("packInput")?.addEventListener("input", calculateTotalQty);
    document.getElementById("looseInput")?.addEventListener("input", calculateTotalQty);
    document.getElementById("packContainer").style.display = "none";
});

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
                x.description ||
                "";

            const productSource =
                x.product_source ||
                x.productSource ||
                "";

            select.innerHTML += `
                <option value="${productId}">
                    ${productName}${productSource ? ` (${productSource})` : ""}
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
    e.preventDefault();

    const btn = document.getElementById("btnSaveStockIn");

    const body = {
        branch_id: document.getElementById("branchId").value,
        product_id: document.getElementById("productId").value,
        supplier_id: document.getElementById("supplierId").value || null,

        quantity: Number(document.getElementById("quantity").value),
        lot_no: document.getElementById("lotNo").value.trim(),

        manufacturing_date: buildDate("mfgYear", "mfgMonth"),
        expiration_date: buildDate("expYear", "expMonth"),

        reference_type: "MANUAL_STOCK_IN",
        dr_no: "",
        inv_no: "",
        po_no: "",

        remarks: document.getElementById("remarks").value.trim() || "Manual Stock IN via Dashboard",
        scanned_by: window.currentUserId || "UNKNOWN"
    };

    if (!body.branch_id) return alert("Please select branch.");
    if (!body.product_id) return alert("Please select product.");
    if (!body.lot_no) return alert("Please enter lot no.");
    if (!body.quantity || body.quantity <= 0) return alert("Please enter valid quantity.");

    try {
        btn.disabled = true;
        btn.innerText = "Saving...";

        const res = await fetch("/ManualStockIn/Save", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(body)
        });

        const responseText = await res.text();

        if (!res.ok) {
            alert(responseText || "Failed to save Stock IN.");
            return;
        }

        alert("Manual Stock IN saved successfully.");
        clearManualStockInForm();

    } catch (err) {
        console.error(err);
        alert("Error saving Manual Stock IN.");
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