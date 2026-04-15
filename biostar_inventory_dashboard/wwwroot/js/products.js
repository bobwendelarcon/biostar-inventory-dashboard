document.addEventListener("DOMContentLoaded", function () {
    const btnAddProduct = document.getElementById("btnAddProduct");
    const searchProduct = document.getElementById("searchProduct");
    const filterCategory = document.getElementById("filterCategory");
    const filterStatus = document.getElementById("filterStatus");
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

    const productModalLabel = document.getElementById("productModalLabel");
    const btnSaveProduct = document.getElementById("btnSaveProduct");

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
            const response = await fetch("/Product/GetProducts");

            if (!response.ok) {
                const err = await response.text();
                throw new Error(err);
            }

            const data = await response.json();
            allProducts = data || [];

            renderProducts(allProducts);

        } catch (error) {
            document.getElementById("productTableBody").innerHTML = `
                <tr>
                    <td colspan="9" class="text-center text-danger">
                        ${error.message}
                    </td>
                </tr>
            `;
            console.error(error);
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
                            data-packqty="${item.pack_qty ?? 0}">
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

    function applyFilters() {
        const keyword = searchProduct?.value.trim().toLowerCase() || "";
        const selectedCategory = filterCategory?.value || "";
        const selectedStatus = filterStatus?.value || "";

        let filtered = [...allProducts];

        if (keyword) {
            filtered = filtered.filter(item =>
                (item.product_id ?? "").toLowerCase().includes(keyword) ||
                (item.product_name ?? "").toLowerCase().includes(keyword) ||
                (item.product_sku ?? "").toLowerCase().includes(keyword) ||
                (item.product_description ?? "").toLowerCase().includes(keyword)
            );
        }

        if (selectedCategory) {
            filtered = filtered.filter(item => (item.catg_id ?? "") === selectedCategory);
        }

        if (selectedStatus !== "") {
            const isDeleted = selectedStatus === "true";
            filtered = filtered.filter(item => Boolean(item.is_deleted) === isDeleted);
        }

        renderProducts(filtered);
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

    function clearProductForm() {
        productFormMode.value = "add";
        originalProductId.value = "";

        productId.value = "";
        productName.value = "";
        productCategory.value = "";
        productSku.value = "";
        productPrice.value = "";
        productStockLevel.value = "";
        productStatus.value = "false";
        productDescription.value = "";
        productUom.value = "";
        productPackUom.value = "";
        productPackQty.value = "";

        productId.readOnly = false;
        productModalLabel.textContent = "Add Product";
        btnSaveProduct.textContent = "Save Product";
    }

    if (btnSaveProduct) {
        btnSaveProduct.addEventListener("click", async function () {
            const payload = {
                product_id: productId.value.trim(),
                product_name: productName.value.trim(),
                product_description: productDescription.value.trim(),
                product_sku: productSku.value.trim(),
                product_price: parseFloat(productPrice.value) || 0,
                stock_level: parseFloat(productStockLevel.value) || 0,
                uom: productUom.value.trim(),
                pack_uom: productPackUom.value.trim(),
                pack_qty: parseFloat(productPackQty.value) || 0,
                catg_id: productCategory.value,
                is_deleted: productStatus.value === "true"
            };

            if (!payload.product_id || !payload.product_name) {
                alert("Product ID and Product Name are required.");
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

    if (btnClearProducts) {
        btnClearProducts.addEventListener("click", function () {
            if (searchProduct) searchProduct.value = "";
            if (filterCategory) filterCategory.value = "";
            if (filterStatus) filterStatus.value = "";
            renderProducts(allProducts);
        });
    }

    async function init() {
        await loadCategories();
        await loadProducts();
    }

    init();
});