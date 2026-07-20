let materials = [];
let categories = [];
let subCategories = [];
let materialModal;

let currentPage = 1;
const pageSize = 10;

document.addEventListener("DOMContentLoaded", function () {
    materialModal = new bootstrap.Modal(document.getElementById("materialModal"));

    loadCategories();
    loadAllSubCategories();
    loadMaterials();

    document.getElementById("btnAddMaterial").addEventListener("click", openAddModal);
    document.getElementById("btnSaveMaterial").addEventListener("click", saveMaterial);
    document.getElementById("btnResetFilters").addEventListener("click", resetFilters);

    document.getElementById("txtSearchMaterial").addEventListener("input", renderMaterials);
    document.getElementById("filterCategory").addEventListener("change", renderMaterials);
    document.getElementById("filterSubCategory").addEventListener("change", renderMaterials);

    document.getElementById("materialCategoryId").addEventListener("change", async function () {
        await loadSubCategoriesForModal(this.value);
    });
});

async function loadCategories() {
    const response = await fetch("/manufacturing/materials/categories/list");
    const result = await response.json();

    categories = result.data ?? result.items ?? result.categories ?? result;

    if (!Array.isArray(categories)) {
        categories = [];
    }

    const filterCategory = document.getElementById("filterCategory");
    const materialCategoryId = document.getElementById("materialCategoryId");

    filterCategory.innerHTML = `<option value="">All Categories</option>`;
    materialCategoryId.innerHTML = `<option value="">Select Category</option>`;

    categories.forEach(c => {
        const id = c.material_category_id;
        const name = c.category_name;

        if (!id || !name) return;

        filterCategory.innerHTML += `<option value="${id}">${escapeHtml(name)}</option>`;
        materialCategoryId.innerHTML += `<option value="${id}">${escapeHtml(name)}</option>`;
    });
}

async function loadAllSubCategories() {
    const response = await fetch("/manufacturing/materials/subcategories/list");
    const result = await response.json();

    subCategories = result.data ?? result.items ?? result.subCategories ?? result;

    if (!Array.isArray(subCategories)) {
        subCategories = [];
    }

    const filterSubCategory = document.getElementById("filterSubCategory");

    filterSubCategory.innerHTML = `<option value="">All Sub Categories</option>`;

    subCategories.forEach(sc => {
        const id = sc.material_subcategory_id;
        const name = sc.subcategory_name;

        if (!id || !name) return;

        filterSubCategory.innerHTML += `<option value="${id}">${escapeHtml(name)}</option>`;
    });
}

async function loadSubCategoriesForModal(categoryId, selectedSubCategoryId = null) {
    const dropdown = document.getElementById("materialSubCategoryId");

    dropdown.innerHTML = `<option value="">No Sub Category</option>`;

    if (!categoryId) return;

    const response = await fetch(`/manufacturing/materials/subcategories/by-category/${categoryId}`);
    const result = await response.json();

    let list = result.data ?? result.items ?? result.subCategories ?? result;

    if (!Array.isArray(list)) {
        list = [];
    }

    list.forEach(sc => {
        const id = sc.material_subcategory_id;
        const name = sc.subcategory_name;

        if (!id || !name) return;

        const selected = String(id) === String(selectedSubCategoryId) ? "selected" : "";
        dropdown.innerHTML += `<option value="${id}" ${selected}>${escapeHtml(name)}</option>`;
    });
}

async function loadMaterials() {
    const tbody = document.getElementById("materialsTableBody");

    try {
        const response = await fetch("/manufacturing/materials/list");
        const result = await response.json();

        materials = result.data ?? result.items ?? result.materials ?? result;

        if (!Array.isArray(materials)) {
            materials = [];
        }

        renderMaterials();
    } catch (error) {
        console.error(error);

        tbody.innerHTML = `
            <tr>
                <td colspan="10" class="text-center text-danger py-4">
                    Failed to load materials.
                </td>
            </tr>`;
    }
}

function renderMaterials() {

    const tbody = document.getElementById("materialsTableBody");

    const search = document.getElementById("txtSearchMaterial").value.toLowerCase();
    const categoryFilter = document.getElementById("filterCategory").value;
    const subCategoryFilter = document.getElementById("filterSubCategory").value;

    let filtered = materials.filter(m => {

        const idCategory = String(m.material_category_id ?? "");
        const idSubCategory = String(m.material_subcategory_id ?? "");

        const code = (m.material_code ?? "").toLowerCase();
        const name = (m.material_name ?? "").toLowerCase();

        return (
            (!search || code.includes(search) || name.includes(search)) &&
            (!categoryFilter || idCategory === categoryFilter) &&
            (!subCategoryFilter || idSubCategory === subCategoryFilter)
        );
    });

    const totalRecords = filtered.length;
    const totalPages = Math.ceil(totalRecords / pageSize);

    if (currentPage > totalPages && totalPages > 0)
        currentPage = totalPages;

    const startIndex = (currentPage - 1) * pageSize;

    filtered = filtered.slice(
        startIndex,
        startIndex + pageSize
    );

    updateRecordInfo(totalRecords);

    renderPagination(totalPages);

    if (filtered.length === 0) {

        tbody.innerHTML = `
        <tr>
            <td colspan="11"
                class="text-center text-muted py-4">
                No materials found.
            </td>
        </tr>`;

        return;
    }

    tbody.innerHTML = filtered.map(m => {

        const id = m.material_id;
        const isActive = m.is_active ?? true;

        return `
        <tr>
            <td>${escapeHtml(m.material_code ?? "")}</td>
            <td>${escapeHtml(m.material_name ?? "")}</td>
            <td>${escapeHtml(m.category_name ?? "-")}</td>
            <td>${escapeHtml(m.subcategory_name ?? "-")}</td>
            <td>${escapeHtml(m.uom ?? "")}</td>
            <td>${escapeHtml(m.pack_uom ?? "-")}</td>
            <td>${formatNumber(m.pack_qty ?? 0)}</td>
            <td>${formatNumber(m.minimum_stock ?? 0)}</td>

            <td>
    ${
            m.is_lot_tracked
                ? `<span class="badge bg-primary">
                    Yes
               </span>`
                : `<span class="badge bg-secondary">
                    No
               </span>`
    }
</td>


            <td>
                <span class="badge ${isActive ? "bg-success" : "bg-secondary"}">
                    ${isActive ? "Active" : "Inactive"}
                </span>
            </td>

            <td>
                <button class="btn btn-sm btn-outline-primary me-1"
                        onclick="editMaterial(${id})">
                    Edit
                </button>

                <button class="btn btn-sm btn-outline-danger"
                        onclick="deleteMaterial(${id})">
                    Delete
                </button>
            </td>
        </tr>`;
    }).join("");
}

function updateRecordInfo(totalRecords) {

    const info =
        document.getElementById("materialsRecordInfo");

    if (!info) return;

    if (totalRecords === 0) {

        info.innerText =
            "Showing 0 records";

        return;
    }

    const start =
        ((currentPage - 1) * pageSize) + 1;

    const end =
        Math.min(currentPage * pageSize,
            totalRecords);

    info.innerText =
        `Showing ${start}-${end} of ${totalRecords} records`;
}

function renderPagination(totalPages) {

    const pagination =
        document.getElementById("materialsPagination");

    if (!pagination) return;

    if (totalPages <= 1) {

        pagination.innerHTML = "";
        return;
    }

    let html = "";

    html += `
    <li class="page-item ${currentPage === 1 ? "disabled" : ""}">
        <a class="page-link"
           href="#"
           onclick="changePage(${currentPage - 1})">
            Previous
        </a>
    </li>`;

    for (let i = 1; i <= totalPages; i++) {

        html += `
        <li class="page-item ${currentPage === i ? "active" : ""}">
            <a class="page-link"
               href="#"
               onclick="changePage(${i})">
               ${i}
            </a>
        </li>`;
    }

    html += `
    <li class="page-item ${currentPage === totalPages ? "disabled" : ""}">
        <a class="page-link"
           href="#"
           onclick="changePage(${currentPage + 1})">
            Next
        </a>
    </li>`;

    pagination.innerHTML = html;
}

function changePage(page) {

    currentPage = page;

    renderMaterials();
}

function openAddModal() {
    clearForm();
    document.getElementById("materialModalTitle").innerText = "Add Material";
    materialModal.show();
}

async function editMaterial(id) {
    const m = materials.find(x => x.material_id === id);
    if (!m) return;

    document.getElementById("materialModalTitle").innerText = "Edit Material";

    document.getElementById("materialId").value = id;
    document.getElementById("materialCode").value = m.material_code ?? "";
    document.getElementById("materialName").value = m.material_name ?? "";
    document.getElementById("materialCategoryId").value = m.material_category_id ?? "";

    await loadSubCategoriesForModal(
        m.material_category_id,
        m.material_subcategory_id
    );

    document.getElementById("uom").value = m.uom ?? "";
    document.getElementById("packUom").value = m.pack_uom ?? "";
    document.getElementById("packQty").value = m.pack_qty ?? 0;
    document.getElementById("minimumStock").value = m.minimum_stock ?? 0;
    document.getElementById("description").value = m.description ?? "";
    document.getElementById("isLotTracked").checked =
        m.is_lot_tracked ?? false;

    materialModal.show();
}

async function saveMaterial() {
    const id = document.getElementById("materialId").value;

    const categoryId = document.getElementById("materialCategoryId").value;
    const subCategoryId = document.getElementById("materialSubCategoryId").value;

    const dto = {
        material_code: document.getElementById("materialCode").value.trim(),
        material_name: document.getElementById("materialName").value.trim(),
        material_category_id: categoryId ? parseInt(categoryId) : null,
        material_subcategory_id: subCategoryId ? parseInt(subCategoryId) : null,
        uom: document.getElementById("uom").value.trim(),
        pack_uom: document.getElementById("packUom").value.trim() || null,
        pack_qty: parseFloat(document.getElementById("packQty").value || 0),
        minimum_stock: parseFloat(document.getElementById("minimumStock").value || 0),
        description: document.getElementById("description").value.trim(),

        is_lot_tracked: document.getElementById("isLotTracked").checked
    };

    if (!dto.material_code || !dto.material_name || !dto.material_category_id || !dto.uom) {
        alert("Please fill in Material Code, Material Name, Category, and UOM.");
        return;
    }

    const url = id
        ? `/manufacturing/materials/update/${id}`
        : "/manufacturing/materials/create";

    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(dto)
    });

    if (!response.ok) {
        const error = await response.text();
        alert(error || "Failed to save material.");
        return;
    }

    materialModal.hide();
    await loadMaterials();
}

async function deleteMaterial(id) {
    if (!confirm("Delete this material?")) return;

    const response = await fetch(`/manufacturing/materials/delete/${id}`, {
        method: "POST"
    });

    if (!response.ok) {
        const error = await response.text();
        alert(error || "Failed to delete material.");
        return;
    }

    await loadMaterials();
}

function resetFilters() {
    document.getElementById("txtSearchMaterial").addEventListener("input", () => {
        currentPage = 1;
        renderMaterials();
    });

    document.getElementById("filterCategory").addEventListener("change", () => {
        currentPage = 1;
        renderMaterials();
    });

    document.getElementById("filterSubCategory").addEventListener("change", () => {
        currentPage = 1;
        renderMaterials();
    });
    renderMaterials();
}

function clearForm() {
    document.getElementById("materialId").value = "";
    document.getElementById("materialCode").value = "";
    document.getElementById("materialName").value = "";
    document.getElementById("materialCategoryId").value = "";
    document.getElementById("materialSubCategoryId").innerHTML = `<option value="">No Sub Category</option>`;
    document.getElementById("uom").value = "";
    document.getElementById("packUom").value = "";
    document.getElementById("packQty").value = 0;
    document.getElementById("minimumStock").value = 0;
    document.getElementById("description").value = "";
    document.getElementById("isLotTracked").checked = false;
}

function formatNumber(value) {
    const number = Number(value || 0);
    return number.toLocaleString(undefined, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    });
}

function escapeHtml(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}