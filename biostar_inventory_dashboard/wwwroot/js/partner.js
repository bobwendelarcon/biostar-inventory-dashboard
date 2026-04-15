let partnerModal;
let partnerFilterTimeout;

document.addEventListener("DOMContentLoaded", function () {
    const modalEl = document.getElementById("partnerModal");
    partnerModal = new bootstrap.Modal(modalEl);

    document.getElementById("btnFilterPartners")?.addEventListener("click", loadPartners);
    document.getElementById("btnClearPartners")?.addEventListener("click", clearFilters);
    document.getElementById("btnSavePartner")?.addEventListener("click", savePartner);
    document.getElementById("btnAddPartner")?.addEventListener("click", openAddPartnerModal);

    document.getElementById("searchPartner")?.addEventListener("input", debouncePartnerLoad);
    document.getElementById("filterPartnerType")?.addEventListener("change", loadPartners);
    document.getElementById("filterStatus")?.addEventListener("change", loadPartners);

    loadPartners();
});

function debouncePartnerLoad() {
    clearTimeout(partnerFilterTimeout);
    partnerFilterTimeout = setTimeout(() => {
        loadPartners();
    }, 400);
}

async function loadPartners() {
    try {


        const response = await fetch("/Partner/GetPartners");

        if (!response.ok) {
            throw new Error("Failed to load partners.");
        }

        const data = await response.json();

        const searchValue = (document.getElementById("searchPartner")?.value || "").toLowerCase().trim();
        const typeValue = (document.getElementById("filterPartnerType")?.value || "").toLowerCase().trim();
        const statusValue = document.getElementById("filterStatus")?.value ?? "";

        let filteredData = data;

        if (searchValue) {
            filteredData = filteredData.filter(x =>
                (x.partner_id ?? "").toLowerCase().includes(searchValue) ||
                (x.partner_name ?? "").toLowerCase().includes(searchValue) ||
                (x.address ?? "").toLowerCase().includes(searchValue) ||
                (x.contact ?? "").toLowerCase().includes(searchValue)
            );
        }

        if (typeValue) {
            filteredData = filteredData.filter(x =>
                (x.partner_type ?? "").toLowerCase() === typeValue
            );
        }

        if (statusValue !== "") {
            const isDeleted = statusValue === "true";
            filteredData = filteredData.filter(x =>
                Boolean(x.is_deleted) === isDeleted
            );
        }

        renderPartnerTable(filteredData);
    } catch (error) {
        console.error(error);
        document.getElementById("partnerTableBody").innerHTML = `
            <tr>
                <td colspan="7" class="text-center text-danger">${error.message}</td>
            </tr>
        `;
    }
}

function renderPartnerTable(data) {
    const tableBody = document.getElementById("partnerTableBody");
    tableBody.innerHTML = "";

    if (!data || data.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center text-muted">No partners found.</td>
            </tr>
        `;
        return;
    }

    data.forEach(item => {
        const statusText = String(item.is_deleted) === "true" ? "Inactive" : "Active";

        tableBody.innerHTML += `
            <tr>
                <td>${item.partner_id ?? ""}</td>
                <td>${item.partner_name ?? ""}</td>
                <td>${item.address ?? ""}</td>
                <td>${item.contact ?? ""}</td>
                <td>${item.partner_type ?? ""}</td>
                <td>${statusText}</td>
                <td class="text-end">
                    <button class="btn btn-sm btn-outline-primary rounded-3"
                        onclick='openEditPartnerModal(${JSON.stringify(item).replace(/'/g, "&apos;")})'>
                        Edit
                    </button>
                </td>
            </tr>
        `;
    });
}

function clearFilters() {
    document.getElementById("searchPartner").value = "";
    document.getElementById("filterPartnerType").value = "";
    document.getElementById("filterStatus").value = "";
    loadPartners();
}

function openAddPartnerModal() {
    document.getElementById("partnerModalLabel").innerText = "Add Partner";
    document.getElementById("partnerFormMode").value = "add";
    document.getElementById("originalPartnerId").value = "";

    document.getElementById("partnerId").value = "";
    document.getElementById("partnerName").value = "";
    document.getElementById("partnerAddress").value = "";
    document.getElementById("partnerContact").value = "";
    document.getElementById("partnerType").value = "";
    document.getElementById("partnerStatus").value = "false";

    document.getElementById("partnerId").disabled = false;
}

function openEditPartnerModal(item) {
    document.getElementById("partnerModalLabel").innerText = "Edit Partner";
    document.getElementById("partnerFormMode").value = "edit";
    document.getElementById("originalPartnerId").value = item.partner_id ?? "";

    document.getElementById("partnerId").value = item.partner_id ?? "";
    document.getElementById("partnerName").value = item.partner_name ?? "";
    document.getElementById("partnerAddress").value = item.address ?? "";
    document.getElementById("partnerContact").value = item.contact ?? "";
    document.getElementById("partnerType").value = item.partner_type ?? "";
    document.getElementById("partnerStatus").value = String(item.is_deleted ?? false);

    document.getElementById("partnerId").disabled = true;
    partnerModal.show();
}

async function savePartner() {
    try {
        const mode = document.getElementById("partnerFormMode")?.value || "add";

        const payload = {
            partner_id: document.getElementById("partnerId")?.value.trim() || "",
            partner_name: document.getElementById("partnerName")?.value.trim() || "",
            address: document.getElementById("partnerAddress")?.value.trim() || "",
            contact: document.getElementById("partnerContact")?.value.trim() || "",
            partner_type: document.getElementById("partnerType")?.value.trim() || "",
            is_deleted: document.getElementById("partnerStatus")?.value === "true"
        };

        console.log("PARTNER PAYLOAD:", payload);

        if (!payload.partner_id) {
            alert("Partner ID is required.");
            return;
        }

        if (!payload.partner_name) {
            alert("Partner Name is required.");
            return;
        }

        if (!payload.partner_type) {
            alert("Partner Type is required.");
            return;
        }

        if (payload.partner_type !== "SUPPLIER" && payload.partner_type !== "CUSTOMER") {
            alert("Partner Type must be SUPPLIER or CUSTOMER.");
            return;
        }

        let url = "/Partner/AddPartner";
        let method = "POST";

        if (mode === "edit") {
            url = `/Partner/UpdatePartner?id=${encodeURIComponent(payload.partner_id)}`;
            method = "PUT";
        }


        console.log("MODE:", mode);
        console.log("URL:", url);
        console.log("PARTNER PAYLOAD:", payload);
        const response = await fetch(url, {
            method: method,
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });
        const resultText = await response.text();

        if (!response.ok) {
            throw new Error(`Failed to save partner: ${resultText || response.status}`);
        }

        partnerModal.hide();
        loadPartners();
        alert(mode === "edit" ? "Partner updated successfully." : "Partner added successfully.");
    } catch (error) {
        console.error(error);
        alert(error.message);
    }
}