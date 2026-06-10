let categories = [];
let subCategories = [];
let selectedCategoryId = null;
let selectedCategoryName = "";

document.addEventListener("DOMContentLoaded", function () {
    loadCategories();
});

async function loadCategories() {
    const tbody = document.getElementById("categoryTableBody");

    tbody.innerHTML = `<tr><td colspan="4" class="text-center">Loading...</td></tr>`;

    try {
        const response = await fetch(`/manufacturing/materials/categories/list`);
        const result = await response.json();

        categories = result.data ?? result.items ?? result.categories ?? result;

        if (!Array.isArray(categories)) {
            categories = [];
        }

        if (categories.length === 0) {
            tbody.innerHTML = `<tr><td colspan="4" class="text-center">No categories found.</td></tr>`;
            return;
        }

        tbody.innerHTML = categories.map(item => `
            <tr class="${selectedCategoryId === item.material_category_id ? "table-primary" : ""}">
                <td>
                    <button class="btn btn-link p-0 text-decoration-none"
                            onclick="selectCategory(${item.material_category_id})">
                        ${escapeHtml(item.category_name ?? "")}
                    </button>
                </td>
                <td>${escapeHtml(item.description ?? "")}</td>
                <td>
                    <span class="badge ${item.is_active ? "bg-success" : "bg-secondary"}">
                        ${item.is_active ? "Active" : "Inactive"}
                    </span>
                </td>
                <td>
                    <button class="btn btn-sm btn-warning" onclick='openEditModal(${JSON.stringify(item)})'>
                        Edit
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteCategory(${item.material_category_id})">
                        Delete
                    </button>
                </td>
            </tr>
        `).join("");

    } catch (error) {
        console.error(error);
        tbody.innerHTML = `<tr><td colspan="4" class="text-danger text-center">Failed to load categories.</td></tr>`;
    }
}

async function selectCategory(categoryId) {
    const category = categories.find(x => x.material_category_id === categoryId);

    if (!category) return;

    selectedCategoryId = category.material_category_id;
    selectedCategoryName = category.category_name ?? "";

    document.getElementById("selectedCategoryLabel").innerText =
        `Selected Category: ${selectedCategoryName}`;

    document.getElementById("btnAddSubCategory").disabled = false;

    await loadSubCategories(categoryId);
    await loadCategories();
}

async function loadSubCategories(categoryId) {
    const tbody = document.getElementById("subCategoryTableBody");

    tbody.innerHTML = `<tr><td colspan="4" class="text-center">Loading...</td></tr>`;

    try {
        const response = await fetch(`/manufacturing/materials/subcategories/by-category/${categoryId}`);
        const result = await response.json();

        subCategories = result.data ?? result.items ?? result.subCategories ?? result;

        if (!Array.isArray(subCategories)) {
            subCategories = [];
        }

        if (subCategories.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="4" class="text-center text-muted">
                        No sub categories under this category.
                    </td>
                </tr>`;
            return;
        }

        tbody.innerHTML = subCategories.map(item => `
            <tr>
                <td>${escapeHtml(item.subcategory_name ?? "")}</td>
                <td>${escapeHtml(item.description ?? "")}</td>
                <td>
                    <span class="badge ${item.is_active ? "bg-success" : "bg-secondary"}">
                        ${item.is_active ? "Active" : "Inactive"}
                    </span>
                </td>
                <td>
                    <button class="btn btn-sm btn-warning" onclick='openEditSubCategoryModal(${JSON.stringify(item)})'>
                        Edit
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteSubCategory(${item.material_subcategory_id})">
                        Delete
                    </button>
                </td>
            </tr>
        `).join("");

    } catch (error) {
        console.error(error);
        tbody.innerHTML = `<tr><td colspan="4" class="text-danger text-center">Failed to load sub categories.</td></tr>`;
    }
}

function openAddModal() {
    document.getElementById("modalTitle").innerText = "Add Category";
    document.getElementById("material_category_id").value = "";
    document.getElementById("category_name").value = "";
    document.getElementById("description").value = "";

    new bootstrap.Modal(document.getElementById("categoryModal")).show();
}

function openEditModal(item) {
    document.getElementById("modalTitle").innerText = "Edit Category";
    document.getElementById("material_category_id").value = item.material_category_id;
    document.getElementById("category_name").value = item.category_name ?? "";
    document.getElementById("description").value = item.description ?? "";

    new bootstrap.Modal(document.getElementById("categoryModal")).show();
}

async function saveCategory() {
    const id = document.getElementById("material_category_id").value;

    const payload = {
        category_name: document.getElementById("category_name").value.trim(),
        description: document.getElementById("description").value.trim()
    };

    if (!payload.category_name) {
        alert("Category name is required.");
        return;
    }

    const url = id
        ? `/manufacturing/materials/categories/update/${id}`
        : `/manufacturing/materials/categories/create`;

    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        const errorText = await response.text();
        alert("Failed to save category: " + errorText);
        return;
    }

    bootstrap.Modal.getInstance(document.getElementById("categoryModal")).hide();
    await loadCategories();
}

async function deleteCategory(id) {
    if (!confirm("Delete this category?")) return;

    const response = await fetch(`/manufacturing/materials/categories/delete/${id}`, {
        method: "POST"
    });

    if (!response.ok) {
        const errorText = await response.text();
        alert("Failed to delete category: " + errorText);
        return;
    }

    if (selectedCategoryId === id) {
        selectedCategoryId = null;
        selectedCategoryName = "";
        document.getElementById("btnAddSubCategory").disabled = true;
        document.getElementById("selectedCategoryLabel").innerText =
            "Select a category to view sub categories.";
        document.getElementById("subCategoryTableBody").innerHTML =
            `<tr><td colspan="4" class="text-center text-muted">No category selected.</td></tr>`;
    }

    await loadCategories();
}

function openAddSubCategoryModal() {
    if (!selectedCategoryId) {
        alert("Please select a category first.");
        return;
    }

    document.getElementById("subCategoryModalTitle").innerText = "Add Sub Category";
    document.getElementById("material_subcategory_id").value = "";
    document.getElementById("subCategoryCategoryName").value = selectedCategoryName;
    document.getElementById("subcategory_name").value = "";
    document.getElementById("subcategory_description").value = "";

    new bootstrap.Modal(document.getElementById("subCategoryModal")).show();
}

function openEditSubCategoryModal(item) {
    document.getElementById("subCategoryModalTitle").innerText = "Edit Sub Category";
    document.getElementById("material_subcategory_id").value = item.material_subcategory_id;
    document.getElementById("subCategoryCategoryName").value = selectedCategoryName;
    document.getElementById("subcategory_name").value = item.subcategory_name ?? "";
    document.getElementById("subcategory_description").value = item.description ?? "";

    new bootstrap.Modal(document.getElementById("subCategoryModal")).show();
}

async function saveSubCategory() {
    const id = document.getElementById("material_subcategory_id").value;

    const payload = {
        material_category_id: selectedCategoryId,
        subcategory_name: document.getElementById("subcategory_name").value.trim(),
        description: document.getElementById("subcategory_description").value.trim()
    };

    if (!payload.subcategory_name) {
        alert("Sub category name is required.");
        return;
    }

    const url = id
        ? `/manufacturing/materials/subcategories/update/${id}`
        : `/manufacturing/materials/subcategories/create`;

    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        const errorText = await response.text();
        alert("Failed to save sub category: " + errorText);
        return;
    }

    bootstrap.Modal.getInstance(document.getElementById("subCategoryModal")).hide();
    await loadSubCategories(selectedCategoryId);
}

async function deleteSubCategory(id) {
    if (!confirm("Delete this sub category?")) return;

    const response = await fetch(`/manufacturing/materials/subcategories/delete/${id}`, {
        method: "POST"
    });

    if (!response.ok) {
        const errorText = await response.text();
        alert("Failed to delete sub category: " + errorText);
        return;
    }

    await loadSubCategories(selectedCategoryId);
}

function escapeHtml(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}