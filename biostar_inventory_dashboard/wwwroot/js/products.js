
let currentPage = 1;
const pageSize = 50;
let totalPages = 1;
document.addEventListener("DOMContentLoaded", function () {
    const btnAddProduct = document.getElementById("btnAddProduct");
    const searchProduct = document.getElementById("searchProduct");
    const filterCategory = document.getElementById("filterCategory");
    const filterStatus = document.getElementById("filterStatus");
    const filterSource = document.getElementById("filterSource");
    const btnFilterProducts = document.getElementById("btnFilterProducts");
    const btnClearProducts = document.getElementById("btnClearProducts");

    const productFormMode = document.getElementById("productFormMode");
    const originalProductId = document.getElementById("originalProductId");

    const productId = document.getElementById("productId");
    const productName = document.getElementById("productName");
    const productCategory = document.getElementById("productCategory");
    const productSku = document.getElementById("productSku");
    const productPrice = document.getElementById("productPrice");
    const productStockLevel = document.getElementById("productStockLevel");
    const productStatus = document.getElementById("productStatus");
    const productDescription = document.getElementById("productDescription");
    const productUom = document.getElementById("productUom");
    const productPackUom = document.getElementById("productPackUom");
    const productPackQty = document.getElementById("productPackQty");
    const productSource = document.getElementById("productSource");
    const productModalLabel = document.getElementById("productModalLabel");
    const btnSaveProduct = document.getElementById("btnSaveProduct");

    const btnImportProducts = document.getElementById("btnImportProducts");
    const excelFileInput = document.getElementById("excelFileInput");

    let currentImportFileToken = "";
    let currentPreviewSheets = [];

    let allProducts = [];
    let allCategories = [];

    async function loadCategories() {
        try {
            const response = await fetch("/Categories/GetCategories");

            if (!response.ok) {
                const err = await response.text();
                throw new Error(err);
            }

            const data = await response.json();
            allCategories = data || [];

            if (productCategory) {
                productCategory.innerHTML = `<option value="">Select category</option>`;
            }

            if (filterCategory) {
                filterCategory.innerHTML = `<option value="">All Categories</option>`;
            }

            allCategories.forEach(item => {
                if (item.is_deleted) return;

                const optionHtml = `<option value="${item.catg_id}">${item.catg_name}</option>`;

                if (productCategory) {
                    productCategory.innerHTML += optionHtml;
                }

                if (filterCategory) {
                    filterCategory.innerHTML += optionHtml;
                }
            });

        } catch (error) {
            console.error("Error loading categories:", error);
        }
    }

    async function loadProducts() {
        try {
            const search = searchProduct?.value || "";
            const category = filterCategory?.value || "";
            const status = filterStatus?.value;
            const source = filterSource?.value || "";

            let url = `/Product/GetProducts?page=${currentPage}&pageSize=${pageSize}`;

            if (search) url += `&search=${encodeURIComponent(search)}`;
            if (category) url += `&categoryId=${encodeURIComponent(category)}`;
            if (status !== "" && status !== undefined) url += `&status=${status}`;
            if (source) url += `&source=${encodeURIComponent(source)}`;

            const response = await fetch(url);

            if (!response.ok) {
                const err = await response.text();
                throw new Error(err);
            }

            const data = await response.json();

            allProducts = data.items || [];
            totalPages = data.totalPages || 1;

            renderProducts(allProducts);
            renderPagination(data.totalRecords);

            console.log("API DATA:", data);


        } catch (error) {
            document.getElementById("productTableBody").innerHTML = `
            <tr>
                <td colspan="10" class="text-center text-danger">
                    ${error.message}
                </td>
            </tr>
        `;
        }
    }

    async function previewImportExcel(file) {
        try {

            const formData = new FormData();
            formData.append("file", file);

            const response = await fetch("/Product/ImportPreview", {
                method: "POST",
                body: formData
            });

            if (!response.ok) {
                const err = await response.text();
                throw new Error(err);
            }

            const data = await response.json();

            currentImportFileToken = data.fileToken || data.FileToken || "";
            currentPreviewSheets = data.sheets || data.Sheets || [];

            console.log("PREVIEW DATA:", data);
            console.log("TOKEN:", currentImportFileToken);

            renderImportPreviewModal();

        } catch (error) {
            console.error(error);
            alert("Import preview failed: " + error.message);
        }
    }

    function getCategoryName(catgId) {
        const match = allCategories.find(x => x.catg_id === catgId);
        return match ? match.catg_name : (catgId || "");
    }

    function renderProducts(products) {
        const tableBody = document.getElementById("productTableBody");
        tableBody.innerHTML = "";

        if (!products || products.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="9" class="text-center text-muted">
                        No products found.
                    </td>
                </tr>
            `;
            return;
        }

        products.forEach(item => {
            tableBody.innerHTML += `
                <tr>
                    <td>${item.product_id ?? ""}</td>
                    <td>${item.product_name ?? ""}</td>
                    <td>${getCategoryName(item.catg_id)}</td>
                    <td>${item.product_sku ?? ""}</td>
                    <td>${item.uom ?? ""}</td>
                    <td>${item.pack_uom ?? ""}</td>
                    <td>${item.pack_qty ?? 0}</td>
                    <td>
                        ${item.is_deleted
                    ? '<span class="badge bg-secondary">Inactive</span>'
                    : '<span class="badge bg-success">Active</span>'}
                    </td>
                    <td>${formatProductSource(item.product_source)}</td>
                    <td class="text-end">
                        <button
                            class="btn btn-sm btn-outline-primary me-1 btn-edit-product"
                            data-id="${item.product_id ?? ""}"
                            data-name="${item.product_name ?? ""}"
                            data-category="${item.catg_id ?? ""}"
                            data-sku="${item.product_sku ?? ""}"
                            data-price="${item.product_price ?? 0}"
                            data-stock="${item.stock_level ?? 0}"
                            data-status="${item.is_deleted ? "true" : "false"}"
                            data-desc="${item.product_description ?? ""}"
                            data-uom="${item.uom ?? ""}"
                            data-packuom="${item.pack_uom ?? ""}"
                           data-packqty="${item.pack_qty ?? 0}"
data-source="${item.product_source ?? 'OWN'}">
Edit
                        </button>
                        <button
                            class="btn btn-sm btn-outline-danger btn-delete-product"
                            data-id="${item.product_id ?? ""}">
                            Delete
                        </button>
                    </td>
                </tr>
            `;
        });

        bindProductButtons();
    }
    function formatProductSource(source) {
        source = (source || "OWN").toUpperCase();

        if (source === "OTHER_LINES") {
            return `<span class="badge bg-warning text-dark">Other Lines</span>`;
        }

        return `<span class="badge bg-primary">Own Product</span>`;
    }
    function applyFilters() {
        currentPage = 1;
        loadProducts();
    }

    function bindProductButtons() {
        document.querySelectorAll(".btn-edit-product").forEach(button => {
            button.addEventListener("click", function () {
                productFormMode.value = "edit";
                originalProductId.value = this.dataset.id || "";

                productModalLabel.textContent = "Edit Product";
                btnSaveProduct.textContent = "Update Product";

                productId.value = this.dataset.id || "";
                productName.value = this.dataset.name || "";
                productCategory.value = this.dataset.category || "";
                productSku.value = this.dataset.sku || "";
                productPrice.value = this.dataset.price || "";
                productStockLevel.value = this.dataset.stock || "";
                productStatus.value = this.dataset.status || "false";
                productDescription.value = this.dataset.desc || "";
                productUom.value = this.dataset.uom || "";
                productPackUom.value = this.dataset.packuom || "";
                productPackQty.value = this.dataset.packqty || "";
                productSource.value = this.dataset.source || "OWN";

                productId.readOnly = true;

                const modal = new bootstrap.Modal(document.getElementById("productModal"));
                modal.show();
            });
        });

        document.querySelectorAll(".btn-delete-product").forEach(button => {
            button.addEventListener("click", function () {
                const id = this.dataset.id;
                alert(`Temporary only: delete logic for ${id}`);
            });
        });
    }
    function formatProductSource(source) {
        source = (source || "OWN").toUpperCase();

        if (source === "OTHER_LINES") {
            return `<span class="badge bg-warning text-dark">Other Lines</span>`;
        }

        return `<span class="badge bg-primary">Own Product</span>`;
    }
    //function clearProductForm() {
    //    productFormMode.value = "add";
    //    originalProductId.value = "";

    //    //productId.value = "";
    //    //productName.value = "";
    //    productId.value = "Auto-generated";
    //    productId.readOnly = true;
    //    productCategory.value = "";
    //    productSku.value = "";
    //    productPrice.value = "";
    //    productStockLevel.value = "";
    //    productStatus.value = "false";
    //    productDescription.value = "";
    //    productUom.value = "";
    //    productPackUom.value = "";
    //    productPackQty.value = "";
    //    if (filterSource) filterSource.value = "";
    //    //productId.readOnly = false;
    //    productModalLabel.textContent = "Add Product";
    //    btnSaveProduct.textContent = "Save Product";
    //}


    function clearProductForm() {
        // keep last selected setup values
        const lastCategory = productCategory.value;
        const lastUom = productUom.value;
        const lastPackUom = productPackUom.value;
        const lastPackQty = productPackQty.value;
        const lastSource = productSource.value || "OWN";

        productFormMode.value = "add";
        originalProductId.value = "";

        productId.value = "Auto-generated";
        productId.readOnly = true;
        productId.disabled = true;

        // clear only product-specific fields
        productName.value = "";
        productSku.value = "";
        productPrice.value = "";
        productStockLevel.value = "";
        productStatus.value = "false";
        productDescription.value = "";

        // restore repeated values
        productCategory.value = lastCategory;
        productUom.value = lastUom;
        productPackUom.value = lastPackUom;
        productPackQty.value = lastPackQty;
        productSource.value = lastSource;

        productModalLabel.textContent = "Add Product";
        btnSaveProduct.textContent = "Save Product";
    }


    function renderPagination(totalRecords) {
        totalRecords = Number(totalRecords || 0);

        const start = totalRecords === 0 ? 0 : (currentPage - 1) * pageSize + 1;
        const end = Math.min(currentPage * pageSize, totalRecords);

        document.getElementById("rangeText").textContent = `${start}–${end} of ${totalRecords}`;

        const prevBtn = document.getElementById("prevBtn");
        const nextBtn = document.getElementById("nextBtn");

        prevBtn.disabled = currentPage <= 1;
        nextBtn.disabled = currentPage >= totalPages;

        prevBtn.onclick = function () {
            if (currentPage > 1) {
                currentPage--;
                loadProducts();
            }
        };

        nextBtn.onclick = function () {
            if (currentPage < totalPages) {
                currentPage++;
                loadProducts();
            }
        };
    }

    function renderImportPreviewModal() {

        let html = `
        <div class="modal fade" id="importPreviewModal" tabindex="-1">
            <div class="modal-dialog modal-lg modal-dialog-centered">
                <div class="modal-content border-0 shadow rounded-4">

                    <div class="modal-header border-0">
                        <h5 class="modal-title fw-bold">
                            Import Product Preview
                        </h5>

                        <button type="button"
                                class="btn-close"
                                data-bs-dismiss="modal">
                        </button>
                    </div>

                    <div class="modal-body">

                        <div class="mb-3 text-muted small">
                            Select sheets to import.
                        </div>

                        <div class="list-group">
    `;

        currentPreviewSheets.forEach(sheet => {

            const disabled = !sheet.categoryExists ? "disabled" : "";

            const badge = sheet.categoryExists
                ? `<span class="badge bg-success">Category Found</span>`
                : `<span class="badge bg-danger">Category Not Found</span>`;

            html += `
            <label class="list-group-item d-flex justify-content-between align-items-center">

                <div class="d-flex align-items-center gap-3">

                    <input type="checkbox"
                           class="form-check-input import-sheet-checkbox"
                           value="${sheet.sheetName}"
                           ${disabled}
                           checked>

                    <div>
                        <div class="fw-semibold">
                            ${sheet.sheetName}
                        </div>

                        <small class="text-muted">
                            ${sheet.productCount} products
                        </small>
                    </div>

                </div>

                ${badge}

            </label>
        `;
        });

        html += `
                        </div>

                    </div>

                    <div class="modal-footer border-0">

                        <button type="button"
                                class="btn btn-light"
                                data-bs-dismiss="modal">
                            Cancel
                        </button>

                        <button type="button"
                                class="btn btn-success"
                                id="btnImportSelectedSheets">
                            Import Selected
                        </button>

                    </div>

                </div>
            </div>
        </div>
    `;

        const existing = document.getElementById("importPreviewModal");

        if (existing) {
            existing.remove();
        }

        document.body.insertAdjacentHTML("beforeend", html);

        const modal = new bootstrap.Modal(document.getElementById("importPreviewModal"));

        modal.show();

        bindImportSelectedButton();
    }

    function bindImportSelectedButton() {

        const btn = document.getElementById("btnImportSelectedSheets");

        if (!btn) return;

        btn.addEventListener("click", async function () {

            const selectedSheets = [];

            document.querySelectorAll(".import-sheet-checkbox:checked")
                .forEach(x => {
                    selectedSheets.push(x.value);
                });

            if (selectedSheets.length === 0) {
                alert("Please select at least one sheet.");
                return;
            }

            try {

                btn.disabled = true;
                btn.innerHTML = "Importing...";

                if (!currentImportFileToken) {
                    alert("File token is missing. Please select the Excel file again.");
                    return;
                }

                const response = await fetch("/Product/ImportSelected", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        FileToken: currentImportFileToken,
                        SelectedSheets: selectedSheets
                    })
                });

                const responseText = await response.text();

                let result;
                try {
                    result = JSON.parse(responseText);
                } catch {
                    throw new Error(responseText);
                }

                if (!response.ok) {
                    throw new Error(result.message || responseText || "Import failed.");
                }

                alert(`
Import Completed

Imported:
${result.importedCount}

Skipped:
${result.skippedCount}
            `);

                const modalEl = document.getElementById("importPreviewModal");

                const modal = bootstrap.Modal.getInstance(modalEl);

                if (modal) {
                    modal.hide();
                }

                loadProducts();
                excelFileInput.value = "";
                currentImportFileToken = "";
                currentPreviewSheets = [];

            } catch (error) {

                console.error(error);

                alert(error.message);

            } finally {

                btn.disabled = false;
                btn.innerHTML = "Import Selected";
            }
        });
    }

    if (btnSaveProduct) {
        btnSaveProduct.addEventListener("click", async function () {
         
            const payload = {
               // product_id: productId.value.trim(),
                product_name: productName.value.trim(),
                product_description: productDescription.value.trim(),
                product_sku: productSku.value.trim(),
                product_price: parseFloat(productPrice.value) || 0,
                stock_level: parseFloat(productStockLevel.value) || 0,
                uom: productUom.value.trim(),
                pack_uom: productPackUom.value.trim(),
                pack_qty: parseFloat(productPackQty.value) || 0,
                catg_id: productCategory.value,
                product_source: productSource.value || "OWN",
                is_deleted: productStatus.value === "true"
            };

            if (!payload.product_name) {
                alert("Product Name is required.");
                return;
            }
            try {
                let url = "";
                let successMessage = "";

                if (productFormMode.value === "add") {
                    url = "/Product/AddProduct";
                    successMessage = "Product added successfully!";
                } else {
                    url = `/Product/UpdateProduct?id=${encodeURIComponent(originalProductId.value)}`;
                    successMessage = "Product updated successfully!";
                }

                const response = await fetch(url, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(payload)
                });

                const resultText = await response.text();

                if (!response.ok) {
                    alert("Error: " + resultText);
                    return;
                }

                alert(successMessage);

                const modalEl = document.getElementById("productModal");
                const modal = bootstrap.Modal.getInstance(modalEl);
                if (modal) modal.hide();

                await loadProducts();
                applyFilters();

                // ✅ reopen modal for next entry
                setTimeout(() => {
                    clearProductForm();

                    const newModal = new bootstrap.Modal(document.getElementById("productModal"));
                    newModal.show();
                }, 300);

            } catch (error) {
                console.error(error);
                alert("Error saving product: " + error.message);
            }
        });
    }

    if (btnAddProduct) {
        btnAddProduct.addEventListener("click", function () {
            clearProductForm();
        });
    }

    if (searchProduct) {
        searchProduct.addEventListener("keyup", function () {
            applyFilters();
        });
    }

    if (btnFilterProducts) {
        btnFilterProducts.addEventListener("click", function () {
            applyFilters();
        });
    }

    if (filterCategory) {
        filterCategory.addEventListener("change", function () {
            applyFilters();
        });
    }

    if (filterStatus) {
        filterStatus.addEventListener("change", function () {
            applyFilters();
        });
    }

    if (filterSource) {
        filterSource.addEventListener("change", function () {
            applyFilters();
        });
    }

    if (btnClearProducts) {
        btnClearProducts.addEventListener("click", function () {
            if (searchProduct) searchProduct.value = "";
            if (filterCategory) filterCategory.value = "";
            if (filterStatus) filterStatus.value = "";
            if (filterSource) filterSource.value = "";

            currentPage = 1;
            loadProducts();
        });
    }

    if (btnImportProducts) {
        btnImportProducts.addEventListener("click", function () {
            excelFileInput.value = "";
            excelFileInput.click();
        });
    }

    if (excelFileInput) {

        excelFileInput.addEventListener("change", async function (e) {

            const file = e.target.files[0];

            if (!file) return;

            await previewImportExcel(file);

        });
    }

    async function init() {
        await loadCategories();
        await loadProducts();
    }

    init();
});