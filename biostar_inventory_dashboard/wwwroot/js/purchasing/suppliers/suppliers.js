let currentPage = 1;
let pageSize = 10;
let totalRecords = 0;
let newManufacturerModal = null;
let supplierModal = null;
let linkMaterialsModal = null;

document.addEventListener("DOMContentLoaded", function () {
    supplierModal = new bootstrap.Modal(document.getElementById("supplierModal"));
    linkMaterialsModal = new bootstrap.Modal(document.getElementById("linkMaterialsModal"));
    newManufacturerModal =
        new bootstrap.Modal(document.getElementById("newManufacturerModal"));

    loadSuppliers();

    document.getElementById("txtSearchSupplier").addEventListener("input", function () {
        currentPage = 1;
        loadSuppliers();
    });

    document.getElementById("filterStatus").addEventListener("change", function () {
        currentPage = 1;
        loadSuppliers();
    });

    document.getElementById("filterSupplierType").addEventListener("change", function () {
        currentPage = 1;
        loadSuppliers();
    });

    document.getElementById("pageSizeSelect").addEventListener("change", function () {
        pageSize = parseInt(this.value);
        currentPage = 1;
        loadSuppliers();
    });



    document
        .getElementById("newManufacturerModal")
        .addEventListener("hidden.bs.modal", function () {
            const supplierModalEl = document.getElementById("supplierModal");

            supplierModalEl.addEventListener("shown.bs.modal", function handler() {
                supplierModalEl.removeEventListener("shown.bs.modal", handler);
            });

            supplierModal.show();
        });

    document
        .getElementById("linkMaterialsModal")
        .addEventListener("hidden.bs.modal", function () {

            const supplierId =
                document.getElementById("supplierId").value;

            if (supplierId) {
                supplierModal.show();
            }
        });



});

async function loadSuppliers() {
    const search = document.getElementById("txtSearchSupplier").value || "";
    const status = document.getElementById("filterStatus").value || "";
    const supplierType = document.getElementById("filterSupplierType").value || "";

    const url =
        `/purchasing/suppliers/list?search=${encodeURIComponent(search)}` +
        `&status=${encodeURIComponent(status)}` +
        `&supplierType=${encodeURIComponent(supplierType)}` +
        `&page=${currentPage}` +
        `&pageSize=${pageSize}`;

    const tbody = document.getElementById("supplierTableBody");

    tbody.innerHTML = `
        <tr>
            <td colspan="9" class="text-center text-muted">Loading suppliers...</td>
        </tr>
    `;

    try {
        const response = await fetch(url);
        const result = await response.json();

        const rows = result.data || result.Data || [];
        totalRecords = result.totalRecords || result.TotalRecords || 0;

        renderSupplierTable(rows);
        renderPaginationInfo(rows.length);
    } catch (error) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9" class="text-center text-danger">
                    Failed to load suppliers.
                </td>
            </tr>
        `;
        console.error(error);
    }
}

function renderSupplierTable(rows) {
    const tbody = document.getElementById("supplierTableBody");
    tbody.innerHTML = "";

    if (!rows || rows.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9" class="text-center text-muted">
                    No suppliers found.
                </td>
            </tr>
        `;
        return;
    }

    rows.forEach(item => {
        const supplierId = item.supplierId ?? item.SupplierId;
        const supplierCode = item.supplierCode ?? item.SupplierCode ?? "";
        const supplierName = item.supplierName ?? item.SupplierName ?? "";
        const supplierType = item.supplierType ?? item.SupplierType ?? "";
        const contactPerson = item.contactPerson ?? item.ContactPerson ?? "";
        const paymentTerms = item.paymentTerms ?? item.PaymentTerms ?? "";
        const leadTimeDays = item.leadTimeDays ?? item.LeadTimeDays ?? 0;
        const isPreferred = item.isPreferred ?? item.IsPreferred;
        const isActive = item.isActive ?? item.IsActive;

        tbody.innerHTML += `
            <tr>
                <td>${escapeHtml(supplierCode)}</td>
                <td>${escapeHtml(supplierName)}</td>
                <td>${escapeHtml(supplierType)}</td>
                <td>${escapeHtml(contactPerson ?? "")}</td>
                <td>${escapeHtml(paymentTerms ?? "")}</td>
                <td>${leadTimeDays} days</td>
                <td>
                    ${isPreferred
                ? '<span class="badge bg-success">Yes</span>'
                : '<span class="badge bg-secondary">No</span>'}
                </td>
                <td>
                    ${isActive
                ? '<span class="badge bg-primary">Active</span>'
                : '<span class="badge bg-secondary">Inactive</span>'}
                </td>

                <td style="width:90px;">
    <div class="dropdown">
        <button class="btn btn-sm btn-outline-secondary dropdown-toggle action-btn"
                type="button"
                data-bs-toggle="dropdown"
                aria-expanded="false">
            Actions
        </button>

        <ul class="dropdown-menu">
            <li>
                <a class="dropdown-item"
                   href="#"
                   onclick="viewSupplier(${item.supplierId})">
                    View
                </a>
            </li>
            <li>
                <a class="dropdown-item"
                   href="#"
                   onclick="editSupplier(${item.supplierId})">
                    Edit
                </a>
            </li>
            <li>
                <a class="dropdown-item text-danger"
                   href="#"
                   onclick="deleteSupplier(${item.supplierId})">
                    Delete
                </a>
            </li>
        </ul>
    </div>
</td>
              
            </tr>
        `;
    });
}

function renderPaginationInfo(currentCount) {
    const start = totalRecords === 0 ? 0 : ((currentPage - 1) * pageSize) + 1;
    const end = Math.min((currentPage - 1) * pageSize + currentCount, totalRecords);

    document.getElementById("supplierPaginationInfo").innerText =
        `Showing ${start}-${end} of ${totalRecords} suppliers`;
}

function previousPage() {
    if (currentPage <= 1) return;

    currentPage--;
    loadSuppliers();
}

function nextPage() {
    const totalPages = Math.ceil(totalRecords / pageSize);

    if (currentPage >= totalPages) return;

    currentPage++;
    loadSuppliers();
}

function openCreateSupplierModal() {
    clearSupplierForm();

    document.getElementById("supplierModalTitle").innerText = "Create Supplier";
    document.getElementById("supplierCode").value = "AUTO";
    document.getElementById("supplierId").value = "";
    document.getElementById("btnSaveSupplier").disabled = false;
    document.getElementById("btnLinkMaterials").disabled = true;
    document.getElementById("btnLinkMaterials").onclick = null;
    document.getElementById("supplierSetupSections").style.display = "none";
    document.getElementById("supplierSetupFooter").style.display = "none";

    setFormReadonly(false);

    supplierModal.show();
}

async function viewSupplier(id) {
    clearSupplierForm();

    const supplier = await getSupplierById(id);

    if (!supplier) return;

    fillSupplierForm(supplier);
    await loadManufacturerDropdown();
    const manufacturerCount = await loadSupplierManufacturers(id);
    await loadSupplierMaterialSummary(id);

    document.getElementById("supplierModalTitle").innerText = "View Supplier";
    document.getElementById("btnSaveSupplier").disabled = true;
    document.getElementById("btnLinkMaterials").disabled = manufacturerCount === 0;
    document.getElementById("supplierSetupSections").style.display = "";
    document.getElementById("supplierSetupFooter").style.display = "";
    document.getElementById("btnLinkMaterials").onclick = function () {
        openLinkMaterials(id);
    };

    setFormReadonly(true);

    supplierModal.show();
}

async function editSupplier(id) {
    clearSupplierForm();

    const supplier = await getSupplierById(id);

    if (!supplier) return;

    fillSupplierForm(supplier);
    await loadManufacturerDropdown();
    const manufacturerCount = await loadSupplierManufacturers(id);
    await loadSupplierMaterialSummary(id);

    document.getElementById("supplierModalTitle").innerText = "Edit Supplier";
    document.getElementById("btnSaveSupplier").disabled = false;
    document.getElementById("btnLinkMaterials").disabled = manufacturerCount === 0;
    document.getElementById("supplierSetupSections").style.display = "";
    document.getElementById("supplierSetupFooter").style.display = "";
    document.getElementById("btnLinkMaterials").onclick = function () {
        openLinkMaterials(id);
    };

    setFormReadonly(false);
    document.getElementById("supplierCode").readOnly = true;

    supplierModal.show();
}

async function getSupplierById(id) {
    try {
        const response = await fetch(`/purchasing/suppliers/${id}`);

        if (!response.ok) {
            alert("Supplier not found.");
            return null;
        }

        return await response.json();
    } catch (error) {
        console.error(error);
        alert("Failed to load supplier.");
        return null;
    }
}

async function saveSupplier() {
    const supplierId = document.getElementById("supplierId").value;

    const payload = {
        supplierName: document.getElementById("supplierName").value.trim(),
        supplierType: document.getElementById("supplierType").value,
        contactPerson: document.getElementById("contactPerson").value.trim(),
        contactNumber: document.getElementById("contactNumber").value.trim(),
        emailAddress: document.getElementById("emailAddress").value.trim(),
        address: document.getElementById("address").value.trim(),
        paymentTerms: document.getElementById("paymentTerms").value,
        leadTimeDays: parseInt(document.getElementById("leadTimeDays").value || "0"),
        currency: document.getElementById("currency").value,
        isPreferred: document.getElementById("isPreferred").checked,
        remarks: document.getElementById("remarks").value.trim()
    };

    if (!payload.supplierName) {
        alert("Supplier name is required.");
        return;
    }

    if (!payload.supplierType) {
        alert("Supplier type is required.");
        return;
    }

    const url = supplierId
        ? `/purchasing/suppliers/update/${supplierId}`
        : `/purchasing/suppliers/create`;

    const method = supplierId ? "PUT" : "POST";

    try {
        const response = await fetch(url, {
            method: method,
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            alert(errorText || "Failed to save supplier.");
            return;
        }

        supplierModal.hide();
        await loadSuppliers();

    } catch (error) {
        console.error(error);
        alert("Failed to save supplier.");
    }
}

async function deleteSupplier(id) {
    if (!confirm("Delete this supplier? This will only soft delete the record.")) {
        return;
    }

    try {
        const response = await fetch(`/purchasing/suppliers/delete/${id}`, {
            method: "POST"
        });

        if (!response.ok) {
            const errorText = await response.text();
            alert(errorText || "Failed to delete supplier.");
            return;
        }

        await loadSuppliers();

    } catch (error) {
        console.error(error);
        alert("Failed to delete supplier.");
    }
}

function clearSupplierForm() {
    document.getElementById("supplierId").value = "";
    document.getElementById("supplierCode").value = "";
    document.getElementById("supplierName").value = "";
    document.getElementById("supplierType").value = "Manufacturer";

    document.getElementById("contactPerson").value = "";
    document.getElementById("contactNumber").value = "";
    document.getElementById("emailAddress").value = "";
    document.getElementById("address").value = "";

    document.getElementById("paymentTerms").value = "COD";
    document.getElementById("leadTimeDays").value = 0;
    document.getElementById("currency").value = "PHP";
    document.getElementById("isActive").value = "true";

    document.getElementById("isPreferred").checked = false;
    document.getElementById("remarks").value = "";
}

function fillSupplierForm(supplier) {
    document.getElementById("supplierId").value = supplier.supplierId ?? supplier.SupplierId ?? "";
    document.getElementById("supplierCode").value = supplier.supplierCode ?? supplier.SupplierCode ?? "";
    document.getElementById("supplierName").value = supplier.supplierName ?? supplier.SupplierName ?? "";
    document.getElementById("supplierType").value = supplier.supplierType ?? supplier.SupplierType ?? "Manufacturer";

    document.getElementById("contactPerson").value = supplier.contactPerson ?? supplier.ContactPerson ?? "";
    document.getElementById("contactNumber").value = supplier.contactNumber ?? supplier.ContactNumber ?? "";
    document.getElementById("emailAddress").value = supplier.emailAddress ?? supplier.EmailAddress ?? "";
    document.getElementById("address").value = supplier.address ?? supplier.Address ?? "";

    document.getElementById("paymentTerms").value = supplier.paymentTerms ?? supplier.PaymentTerms ?? "COD";
    document.getElementById("leadTimeDays").value = supplier.leadTimeDays ?? supplier.LeadTimeDays ?? 0;
    document.getElementById("currency").value = supplier.currency ?? supplier.Currency ?? "PHP";

    const isActive = supplier.isActive ?? supplier.IsActive ?? true;
    document.getElementById("isActive").value = isActive ? "true" : "false";

    document.getElementById("isPreferred").checked = supplier.isPreferred ?? supplier.IsPreferred ?? false;
    document.getElementById("remarks").value = supplier.remarks ?? supplier.Remarks ?? "";
}

function setFormReadonly(readonly) {
    const fields = [
        "supplierName",
        "supplierType",
        "contactPerson",
        "contactNumber",
        "emailAddress",
        "address",
        "paymentTerms",
        "leadTimeDays",
        "currency",
        "isActive",
        "isPreferred",
        "remarks"
    ];

    fields.forEach(id => {
        const element = document.getElementById(id);

        if (!element) return;

        if (element.type === "checkbox") {
            element.disabled = readonly;
        } else {
            element.readOnly = readonly;
            element.disabled = readonly && element.tagName === "SELECT";
        }
    });
}

async function openLinkMaterials(supplierId) {

    document.getElementById("mappingSupplierId").value = supplierId;

    clearMappingForm();

    await loadMaterialCategories();
    await loadMaterials();
    await loadManufacturersBySupplier(supplierId);
    await loadSupplierMaterials(supplierId);

    const supplierModalEl =
        document.getElementById("supplierModal");

    supplierModalEl.addEventListener(
        "hidden.bs.modal",
        function handler() {

            supplierModalEl.removeEventListener(
                "hidden.bs.modal",
                handler);

            linkMaterialsModal.show();
        });

    supplierModal.hide();
}

async function loadMaterialCategories() {
    const response = await fetch("/manufacturing/materials/categories/list");

    if (!response.ok) return;

    const result = await response.json();
    const data = result.data ?? result.Data ?? result;

    const ddl = document.getElementById("mappingCategoryId");

    ddl.innerHTML = `
    <option value="">All Categories</option>
`;

    data.forEach(item => {

        const id =
            item.materialCategoryId ??
            item.material_category_id ??
            item.MaterialCategoryId;

        const name =
            item.categoryName ??
            item.category_name ??
            item.CategoryName;

        ddl.innerHTML += `
        <option value="${id}">
            ${escapeHtml(name)}
        </option>`;
    });
    await loadMaterialSubCategories(null);
    await loadMaterials();

   
}
async function loadManufacturersBySupplier(supplierId) {
    try {
        const response = await fetch(`/purchasing/suppliers/${supplierId}/manufacturers`);

        if (!response.ok) {
            alert("Failed to load supplier manufacturers.");
            return;
        }

        const data = await response.json();

        const ddl = document.getElementById("mappingManufacturerId");
        ddl.innerHTML = '<option value="">Select Manufacturer</option>';

        if (!data || data.length === 0) {
            ddl.innerHTML = '<option value="">No manufacturer linked</option>';
            return;
        }

        data.forEach(item => {
            const manufacturerId = item.manufacturerId ?? item.ManufacturerId;
            const manufacturerName = item.manufacturerName ?? item.ManufacturerName ?? "";

            ddl.innerHTML += `
                <option value="${manufacturerId}">
                    ${escapeHtml(manufacturerName)}
                </option>`;
        });
    } catch (error) {
        console.error(error);
        alert("Failed to load supplier manufacturers.");
    }
}
async function loadMaterials() {

    const categoryId =
        document.getElementById("mappingCategoryId").value;

    const subCategoryId =
        document.getElementById("mappingSubCategoryId").value;

    let url = "/purchasing/suppliers/materials/lookup";

    const params = [];

    if (categoryId)
        params.push(`categoryId=${categoryId}`);

    if (subCategoryId)
        params.push(`subCategoryId=${subCategoryId}`);

    if (params.length)
        url += "?" + params.join("&");

    const response = await fetch(url);

    const data = await response.json();

    const ddl =
        document.getElementById("mappingMaterialId");

    ddl.innerHTML =
        '<option value="">Select Material</option>';

    data.forEach(item => {

        const materialId =
            item.materialId ??
            item.material_id ??
            item.MaterialId;

        const materialCode =
            item.materialCode ??
            item.material_code ??
            item.MaterialCode ??
            "";

        const materialName =
            item.materialName ??
            item.material_name ??
            item.MaterialName ??
            "";

        ddl.innerHTML += `
        <option value="${materialId}">
            ${escapeHtml(materialCode)} - ${escapeHtml(materialName)}
        </option>`;
    });
}

async function loadManufacturers() {
    try {
        const response = await fetch("/purchasing/suppliers/manufacturers/lookup");

        if (!response.ok) {
            alert("Failed to load manufacturers.");
            return;
        }

        const data = await response.json();

        const ddl = document.getElementById("mappingManufacturerId");
        ddl.innerHTML = '<option value="">Select Manufacturer</option>';

        data.forEach(item => {
            const manufacturerId = item.manufacturerId ?? item.ManufacturerId;
            const manufacturerName = item.manufacturerName ?? item.ManufacturerName ?? "";

            ddl.innerHTML += `
                <option value="${manufacturerId}">
                    ${escapeHtml(manufacturerName)}
                </option>`;
        });
    } catch (error) {
        console.error(error);
        alert("Failed to load manufacturers.");
    }
}

async function loadSupplierMaterials(supplierId) {
    try {
        const response = await fetch(`/purchasing/suppliers/${supplierId}/materials`);

        if (!response.ok) {
            alert("Failed to load linked materials.");
            return;
        }

        const data = await response.json();

        const tbody = document.getElementById("supplierMaterialTableBody");
        tbody.innerHTML = "";

        if (!data || data.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center text-muted">
                        No materials linked.
                    </td>
                </tr>`;
            return;
        }

        data.forEach(item => {
            const supplierMaterialId = item.supplierMaterialId ?? item.SupplierMaterialId;
            const materialCode = item.materialCode ?? item.MaterialCode ?? "";
            const materialName = item.materialName ?? item.MaterialName ?? "";
            const manufacturerName = item.manufacturerName ?? item.ManufacturerName ?? "";
            const isPreferred = item.isPreferred ?? item.IsPreferred;
            const remarks = item.remarks ?? item.Remarks ?? "";

            tbody.innerHTML += `
                <tr>
                    <td>${escapeHtml(materialCode)} - ${escapeHtml(materialName)}</td>
                    <td>${escapeHtml(manufacturerName)}</td>
                    <td>
                        ${isPreferred
                    ? '<span class="badge bg-success">Yes</span>'
                    : '<span class="badge bg-secondary">No</span>'}
                    </td>
                    <td>${escapeHtml(remarks)}</td>
                    <td>
                        <button class="btn btn-danger btn-sm"
                                onclick="deleteSupplierMaterial(${supplierMaterialId})">
                            Delete
                        </button>
                    </td>
                </tr>`;
        });
    } catch (error) {
        console.error(error);
        alert("Failed to load linked materials.");
    }
}

async function addSupplierMaterial() {
    const supplierId = parseInt(document.getElementById("mappingSupplierId").value || "0");
    const materialId = parseInt(document.getElementById("mappingMaterialId").value || "0");

    const manufacturerValue = document.getElementById("mappingManufacturerId").value;

    const payload = {
        supplierId: supplierId,
        materialId: materialId,
        manufacturerId: manufacturerValue ? parseInt(manufacturerValue) : null,
        isPreferred: document.getElementById("mappingPreferred").checked,
        remarks: document.getElementById("mappingRemarks").value.trim()
    };

    if (!payload.supplierId) {
        alert("Supplier is required.");
        return;
    }

    if (!payload.materialId) {
        alert("Please select material.");
        return;
    }
    if (!payload.manufacturerId) {
        alert("Please select manufacturer.");
        return;
    }

    try {
        const response = await fetch("/purchasing/suppliers/materials/create", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            alert(errorText || "Failed to save mapping.");
            return;
        }

        clearMappingForm();
        await loadSupplierMaterials(supplierId);
        await loadSupplierMaterialSummary(supplierId);

    } catch (error) {
        console.error(error);
        alert("Failed to save mapping.");
    }
}

async function onMappingCategoryChanged() {

    const categoryId =
        document.getElementById("mappingCategoryId").value;

    await loadMaterialSubCategories(categoryId);

    await loadMaterials();
}
async function loadMaterialSubCategories(categoryId) {

    const ddl =
        document.getElementById("mappingSubCategoryId");

    ddl.innerHTML =
        '<option value="">All Sub Categories</option>';

    let url =
        "/manufacturing/materials/subcategories/list";

    if (categoryId) {
        url =
            `/manufacturing/materials/subcategories/by-category/${categoryId}`;
    }

    const response = await fetch(url);

    if (!response.ok) {
        console.warn("Failed to load subcategories.");
        return;
    }

    const result = await response.json();
    const data = result.data ?? result.Data ?? result;

    data.forEach(item => {

        const id =
            item.materialSubcategoryId ??
            item.materialSubCategoryId ??
            item.material_subcategory_id;

        const name =
            item.subcategoryName ??
            item.subCategoryName ??
            item.subcategory_name;

        ddl.innerHTML += `
            <option value="${id}">
                ${escapeHtml(name)}
            </option>`;
    });
}

async function deleteSupplierMaterial(id) {
    if (!confirm("Delete this material mapping?")) {
        return;
    }

    try {
        const response = await fetch(`/purchasing/suppliers/materials/delete/${id}`, {
            method: "POST"
        });

        if (!response.ok) {
            const errorText = await response.text();
            alert(errorText || "Delete failed.");
            return;
        }

        const supplierId = parseInt(document.getElementById("mappingSupplierId").value || "0");
        await loadSupplierMaterials(supplierId);
        await loadSupplierMaterialSummary(supplierId);


    } catch (error) {
        console.error(error);
        alert("Delete failed.");
    }
}

function clearMappingForm() {
    const material = document.getElementById("mappingMaterialId");
    const manufacturer = document.getElementById("mappingManufacturerId");

    if (material) {
        material.value = "";
    }

    if (manufacturer) {
        manufacturer.value = "";
    }

    document.getElementById("mappingPreferred").checked = false;
    document.getElementById("mappingRemarks").value = "";
}

function escapeHtml(value) {
    if (value === null || value === undefined) return "";

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

async function loadSupplierManufacturers(supplierId) {
    try {
        const response =
            await fetch(`/purchasing/suppliers/${supplierId}/manufacturers`);

        if (!response.ok) {
            return;
        }

        const data = await response.json();

        const tbody =
            document.getElementById("supplierManufacturerTableBody");

        tbody.innerHTML = "";

        if (!data || data.length === 0) {
            tbody.innerHTML = `
        <tr>
            <td colspan="4" class="text-center text-muted">
                No manufacturers linked.
            </td>
        </tr>`;
            return 0;
        }

        data.forEach(item => {
            const supplierManufacturerId =
                item.supplierManufacturerId ?? item.SupplierManufacturerId;

            const manufacturerId =
                item.manufacturerId ?? item.ManufacturerId;

            tbody.innerHTML += `
        <tr>
            <td>${escapeHtml(item.manufacturerName ?? item.ManufacturerName ?? "")}</td>
            <td>${escapeHtml(item.accreditationStatus ?? item.AccreditationStatus ?? "")}</td>
            <td>${escapeHtml(item.coaRequired ?? item.CoaRequired ?? "")}</td>
            <td>
                <button
                    class="btn btn-warning btn-sm me-1"
                    onclick="editManufacturer(${manufacturerId})">
                    Edit
                </button>

                <button
                    class="btn btn-danger btn-sm"
                    onclick="deleteSupplierManufacturer(${supplierManufacturerId})">
                    Delete
                </button>
            </td>
        </tr>`;
        });
        return data.length;
    }

    catch (err) {
        console.error(err);
    }
}

function updateLinkMaterialsButton(manufacturerCount) {
    const btn = document.getElementById("btnLinkMaterials");

    btn.disabled = manufacturerCount === 0;
}
async function loadManufacturerDropdown() {
    try {
        const response =
            await fetch("/purchasing/suppliers/manufacturers/lookup");

        if (!response.ok)
            return;

        const data = await response.json();

        const ddl =
            document.getElementById("supplierManufacturerId");

        ddl.innerHTML =
            '<option value="">Select Manufacturer</option>';

        data.forEach(item => {
            ddl.innerHTML += `
                <option value="${item.manufacturerId}">
                    ${item.manufacturerName}
                </option>`;
        });
    }
    catch (err) {
        console.error(err);
    }
}
async function addSupplierManufacturer() {

    const supplierId =
        parseInt(document.getElementById("supplierId").value || "0");

    const manufacturerId =
        parseInt(document.getElementById("supplierManufacturerId").value || "0");

    if (!supplierId) {
        alert("Please save supplier first.");
        return;
    }

    if (!manufacturerId) {
        alert("Select manufacturer.");
        return;
    }

    try {

        const response =
            await fetch(
                "/purchasing/suppliers/manufacturers/create",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        supplierId: supplierId,
                        manufacturerId: manufacturerId
                    })
                });

        if (!response.ok) {
            const error =
                await response.text();

            alert(error);
            return;
        }

        const manufacturerCount = await loadSupplierManufacturers(supplierId);
        updateLinkMaterialsButton(manufacturerCount);

    }
    catch (err) {
        console.error(err);
    }
}
async function deleteSupplierManufacturer(id) {

    if (!confirm("Delete manufacturer?"))
        return;

    try {

        const response =
            await fetch(
                `/purchasing/suppliers/manufacturers/delete/${id}`,
                {
                    method: "POST"
                });

        if (!response.ok)
            return;

        const supplierId =
            parseInt(document.getElementById("supplierId").value || "0");

        const manufacturerCount = await loadSupplierManufacturers(supplierId);
        updateLinkMaterialsButton(manufacturerCount);
    }
    catch (err) {
        console.error(err);
    }
}

function openNewManufacturerModal() {
    document.getElementById("newManufacturerMode").value = "create";
    document.getElementById("newManufacturerId").value = "0";

    document.getElementById("newManufacturerModalTitle").innerText = "New Manufacturer";
    document.getElementById("btnSaveNewManufacturer").innerText = "Save Manufacturer";

    document.getElementById("newManufacturerName").value = "";
    document.getElementById("newManufacturerAccreditationStatus").value = "For Evaluation";
    document.getElementById("newManufacturerAccreditationDate").value = "";
    document.getElementById("newManufacturerAccreditationExpiry").value = "";
    document.getElementById("newManufacturerCoaRequired").value = "N/A";
    document.getElementById("newManufacturerRemarks").value = "";

    const supplierModalEl = document.getElementById("supplierModal");

    supplierModalEl.addEventListener("hidden.bs.modal", function handler() {
        supplierModalEl.removeEventListener("hidden.bs.modal", handler);
        newManufacturerModal.show();
    });

    supplierModal.hide();
}

async function editManufacturer(manufacturerId) {
    try {
        const response = await fetch(`/purchasing/suppliers/manufacturers/${manufacturerId}`);

        if (!response.ok) {
            alert("Failed to load manufacturer.");
            return;
        }

        const data = await response.json();

        document.getElementById("newManufacturerMode").value = "edit";
        document.getElementById("newManufacturerId").value =
            data.manufacturerId ?? data.ManufacturerId;

        document.getElementById("newManufacturerModalTitle").innerText = "Edit Manufacturer";
        document.getElementById("btnSaveNewManufacturer").innerText = "Update Manufacturer";

        document.getElementById("newManufacturerName").value =
            data.manufacturerName ?? data.ManufacturerName ?? "";

        document.getElementById("newManufacturerAccreditationStatus").value =
            data.accreditationStatus ?? data.AccreditationStatus ?? "For Evaluation";

        document.getElementById("newManufacturerAccreditationDate").value =
            formatDateForInput(data.accreditationDate ?? data.AccreditationDate);

        document.getElementById("newManufacturerAccreditationExpiry").value =
            formatDateForInput(data.accreditationExpiry ?? data.AccreditationExpiry);

        document.getElementById("newManufacturerCoaRequired").value =
            data.coaRequired ?? data.CoaRequired ?? "N/A";

        document.getElementById("newManufacturerRemarks").value =
            data.remarks ?? data.Remarks ?? "";

        const supplierModalEl = document.getElementById("supplierModal");

        supplierModalEl.addEventListener("hidden.bs.modal", function handler() {
            supplierModalEl.removeEventListener("hidden.bs.modal", handler);
            newManufacturerModal.show();
        });

        supplierModal.hide();

    } catch (error) {
        console.error(error);
        alert("Failed to load manufacturer.");
    }
}
function formatDateForInput(value) {
    if (!value) return "";

    return String(value).split("T")[0];
}

async function saveNewManufacturer() {
    const mode = document.getElementById("newManufacturerMode").value;
    const manufacturerId = document.getElementById("newManufacturerId").value;

    const manufacturerName =
        document.getElementById("newManufacturerName").value.trim();

    if (!manufacturerName) {
        alert("Manufacturer name is required.");
        return;
    }

    const payload = {
        manufacturerName: manufacturerName,
        accreditationStatus: document.getElementById("newManufacturerAccreditationStatus").value,
        accreditationDate: document.getElementById("newManufacturerAccreditationDate").value || null,
        accreditationExpiry: document.getElementById("newManufacturerAccreditationExpiry").value || null,
        coaRequired: document.getElementById("newManufacturerCoaRequired").value,
        remarks: document.getElementById("newManufacturerRemarks").value.trim()
    };

    const url = mode === "edit"
        ? `/purchasing/suppliers/manufacturers/${manufacturerId}`
        : `/purchasing/suppliers/manufacturers/new`;

    const method = mode === "edit" ? "PUT" : "POST";

    try {
        const response = await fetch(url, {
            method: method,
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            alert(errorText || "Failed to save manufacturer.");
            return;
        }

        const supplierId =
            parseInt(document.getElementById("supplierId").value || "0");

        let newManufacturerId = 0;

        if (mode === "create") {
            const result = await response.json();
            newManufacturerId = result.manufacturerId ?? result.ManufacturerId ?? 0;
        }

        newManufacturerModal.hide();

        await loadManufacturerDropdown();

        if (mode === "create" && newManufacturerId) {
            document.getElementById("supplierManufacturerId").value = newManufacturerId;
        }

        if (supplierId) {
            const manufacturerCount = await loadSupplierManufacturers(supplierId);
            updateLinkMaterialsButton(manufacturerCount);
        }

    } catch (error) {
        console.error(error);
        alert("Failed to save manufacturer.");
    }
}

async function onMappingSubCategoryChanged() {
    await loadMaterials();
}

async function loadSupplierMaterialSummary(supplierId) {
    try {
        const response = await fetch(`/purchasing/suppliers/${supplierId}/materials`);

        if (!response.ok) {
            return;
        }

        const data = await response.json();

        const tbody = document.getElementById("supplierMaterialSummaryTableBody");
        tbody.innerHTML = "";

        if (!data || data.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="4" class="text-center text-muted">
                        No materials linked.
                    </td>
                </tr>`;
            return;
        }

        data.forEach(item => {
            const materialCode = item.materialCode ?? item.MaterialCode ?? "";
            const materialName = item.materialName ?? item.MaterialName ?? "";
            const manufacturerName = item.manufacturerName ?? item.ManufacturerName ?? "";
            const isPreferred = item.isPreferred ?? item.IsPreferred;
            const remarks = item.remarks ?? item.Remarks ?? "";

            tbody.innerHTML += `
                <tr>
                    <td>${escapeHtml(materialCode)} - ${escapeHtml(materialName)}</td>
                    <td>${escapeHtml(manufacturerName)}</td>
                    <td>
                        ${isPreferred
                    ? '<span class="badge bg-success">Yes</span>'
                    : '<span class="badge bg-secondary">No</span>'}
                    </td>
                    <td>${escapeHtml(remarks)}</td>
                </tr>`;
        });
    } catch (error) {
        console.error(error);
    }
}