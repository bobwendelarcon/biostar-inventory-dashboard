let partnerModal;
let partnerFilterTimeout;
let partnerCache = {};

let partnerPage = 1;
let partnerPageSize = 50;
let partnerTotalPages = 1;
let partnerTotalRecords = 0;

document.addEventListener("DOMContentLoaded", function () {
    const modalEl = document.getElementById("partnerModal");
    partnerModal = new bootstrap.Modal(modalEl);

  
    document.getElementById("btnClearPartners")?.addEventListener("click", clearFilters);
    document.getElementById("btnSavePartner")?.addEventListener("click", savePartner);
    document.getElementById("btnAddPartner")?.addEventListener("click", openAddPartnerModal);

    document.getElementById("searchPartner")?.addEventListener("input", debouncePartnerLoad);





    document.getElementById("btnFilterPartners")?.addEventListener("click", resetPartnerPageAndLoad);
    document.getElementById("filterPartnerType")?.addEventListener("change", resetPartnerPageAndLoad);
    document.getElementById("filterRegion")?.addEventListener("change", resetPartnerPageAndLoad);
    document.getElementById("filterStatus")?.addEventListener("change", resetPartnerPageAndLoad);
    document.getElementById("filterAgent")?.addEventListener("change", resetPartnerPageAndLoad);
    document.getElementById("sortPartners")?.addEventListener("change", resetPartnerPageAndLoad);



    document.getElementById("partnerType")?.addEventListener("change", toggleAgentField);

    document.getElementById("btnPrevPartnerPage")?.addEventListener("click", function () {
        if (partnerPage <= 1) return;
        partnerPage--;
        loadPartners();
    });

    document.getElementById("btnNextPartnerPage")?.addEventListener("click", function () {
        if (partnerPage >= partnerTotalPages) return;
        partnerPage++;
        loadPartners();
    });

    document.getElementById("partnerPageSize")?.addEventListener("change", function () {
        partnerPageSize = Number(this.value || 50);
        partnerPage = 1;
        loadPartners();
    });

    document.getElementById("partnerTableBody")?.addEventListener("click", function (e) {
        const btn = e.target.closest(".btn-edit-partner");
        if (!btn) return;

        const partnerId = btn.dataset.partnerId;
        const item = partnerCache[partnerId];

        if (item) {
            openEditPartnerModal(item);
        }
    });

    loadAgentFilterDropdown();
    loadPartners();
});

function debouncePartnerLoad() {
    clearTimeout(partnerFilterTimeout);
    partnerFilterTimeout = setTimeout(() => {
        partnerPage = 1;
        loadPartners();
    }, 400);
}

async function loadAgentFilterDropdown() {
    try {
        const response = await fetch("/Partner/GetPartners");

        if (!response.ok) {
            throw new Error("Failed to load agents.");
        }

        const data = await response.json();
        const agentSelect = document.getElementById("filterAgent");

        if (!agentSelect) return;

        const agents = data.filter(x =>
            (x.partner_type ?? "").toUpperCase() === "AGENT" &&
            Boolean(x.is_deleted) === false
        );

        agentSelect.innerHTML = `<option value="">All Agents</option>`;

        agents
            .sort((a, b) => (a.partner_name ?? "").localeCompare(b.partner_name ?? ""))
            .forEach(agent => {
                agentSelect.innerHTML += `
                    <option value="${agent.partner_id}">
                        ${agent.partner_name}
                    </option>
                `;
            });

    } catch (error) {
        console.error(error);
    }
}

function toggleAgentField(selectedAgentId = "") {
    const type = document.getElementById("partnerType")?.value || "";
    const wrapper = document.getElementById("agentWrapper");
    const agent = document.getElementById("partnerAgent");

    if (!wrapper || !agent) return;

    if (type === "CUSTOMER") {
        wrapper.style.display = "";
        loadAgentDropdown(selectedAgentId);
    } else {
        wrapper.style.display = "none";
        agent.value = "";
    }
}

async function loadAgentDropdown(selectedAgentId = "") {
    const agentSelect = document.getElementById("partnerAgent");
    if (!agentSelect) return;

    const response = await fetch("/Partner/GetPartners");

    if (!response.ok) {
        throw new Error("Failed to load agents.");
    }

    const data = await response.json();

    const agents = data.filter(x =>
        (x.partner_type ?? "").toUpperCase() === "AGENT" &&
        Boolean(x.is_deleted) === false
    );

    agentSelect.innerHTML = `<option value="">Select Agent</option>`;

    agents
        .sort((a, b) => (a.partner_name ?? "").localeCompare(b.partner_name ?? ""))
        .forEach(agent => {
            agentSelect.innerHTML += `
                <option value="${agent.partner_id}">
                    ${agent.partner_id} - ${agent.partner_name}
                </option>
            `;
        });

    agentSelect.value = selectedAgentId || "";
}

async function loadPartners() {
    try {
        const searchValue = document.getElementById("searchPartner")?.value || "";
        const typeValue = document.getElementById("filterPartnerType")?.value || "";
        const statusValue = document.getElementById("filterStatus")?.value ?? "";
        const regionValue = document.getElementById("filterRegion")?.value || "";
        const agentValue = document.getElementById("filterAgent")?.value || "";
        const sortValue = document.getElementById("sortPartners")?.value || "partner_id_asc";

        const params = new URLSearchParams();

        params.append("page", partnerPage);
        params.append("pageSize", partnerPageSize);

        if (searchValue.trim()) params.append("search", searchValue.trim());
        if (typeValue) params.append("type", typeValue);
        if (regionValue) params.append("region", regionValue);
        if (agentValue) params.append("agentId", agentValue);
        if (statusValue !== "") params.append("isDeleted", statusValue);

        params.append("sort", sortValue);

        document.getElementById("partnerTableBody").innerHTML = `
            <tr>
                <td colspan="9" class="text-center text-muted py-4">
                    Loading partners...
                </td>
            </tr>
        `;

        const response = await fetch(`/Partner/GetPartnersPaged?${params.toString()}`);

        if (!response.ok) {
            throw new Error(await response.text());
        }

        const result = await response.json();

        partnerTotalRecords = Number(result.totalRecords || 0);
        partnerTotalPages = Number(result.totalPages || 1);

        renderPartnerTable(result.data || []);
        renderPartnerPagination(result);

    } catch (error) {
        console.error(error);

        document.getElementById("partnerTableBody").innerHTML = `
            <tr>
                <td colspan="9" class="text-center text-danger">
                    ${safeHtml(error.message || "Failed to load partners.")}
                </td>
            </tr>
        `;
    }
}

function resetPartnerPageAndLoad() {
    partnerPage = 1;
    loadPartners();
}

function renderPartnerPagination(result) {
    const page = Number(result.page || partnerPage);
    const pageSize = Number(result.pageSize || partnerPageSize);
    const totalRecords = Number(result.totalRecords || 0);
    const totalPages = Number(result.totalPages || 1);

    const start = totalRecords === 0 ? 0 : ((page - 1) * pageSize) + 1;
    const end = Math.min(page * pageSize, totalRecords);

    document.getElementById("partnerPageInfo").innerText =
        `Showing ${start}-${end} of ${totalRecords} partners`;

    document.getElementById("partnerPageNumber").innerText =
        `Page ${page} of ${totalPages}`;

    document.getElementById("btnPrevPartnerPage").disabled = page <= 1;
    document.getElementById("btnNextPartnerPage").disabled = page >= totalPages;
}

function sortPartnerData(data, sortValue) {
    const sorted = [...data];

    sorted.sort((a, b) => {
        const valueA = a.partner_id ?? "";
        const valueB = b.partner_id ?? "";

        if (sortValue === "partner_id_desc") {
            return valueB.localeCompare(valueA, undefined, { numeric: true });
        }

        return valueA.localeCompare(valueB, undefined, { numeric: true });
    });

    return sorted;
}



function renderPartnerTable(data) {
    const tableBody = document.getElementById("partnerTableBody");
    partnerCache = {};

    if (!data || data.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="9" class="text-center text-muted">No partners found.</td>
            </tr>
        `;
        return;
    }

    let html = "";

    data.forEach(item => {
        partnerCache[item.partner_id] = item;

        const statusText = String(item.is_deleted) === "true" ? "Inactive" : "Active";

        html += `
            <tr>
                <td>${safeHtml(item.partner_id ?? "")}</td>
                <td>${safeHtml(item.partner_name ?? "")}</td>
                <td>${safeHtml(item.address ?? "")}</td>
                <td>${safeHtml(item.contact ?? item.contact_no ?? "")}</td>
                <td>${safeHtml(item.partner_type ?? "")}</td>
                <td>${safeHtml(item.region ?? "")}</td>
                <td>${safeHtml(item.agent_name ?? "")}</td>
                <td>${statusText}</td>
                <td class="text-end">
                    <button type="button"
                        class="btn btn-sm btn-outline-primary rounded-3 btn-edit-partner"
                        data-partner-id="${safeAttr(item.partner_id ?? "")}">
                        Edit
                    </button>
                </td>
            </tr>
        `;
    });

    tableBody.innerHTML = html;
}

function clearFilters() {

    document.getElementById("searchPartner").value = "";
    document.getElementById("filterPartnerType").value = "";
    document.getElementById("filterStatus").value = "";
    document.getElementById("filterRegion").value = "";
    document.getElementById("filterAgent").value = "";
    document.getElementById("sortPartners").value = "partner_id_asc";

    partnerPage = 1;

    loadPartners();
}

function openAddPartnerModal() {
    document.getElementById("partnerModalLabel").innerText = "Add Partner";
    document.getElementById("partnerFormMode").value = "add";
    document.getElementById("originalPartnerId").value = "";

    document.getElementById("partnerId").value = "Auto Generated";
    document.getElementById("partnerName").value = "";
    document.getElementById("partnerAddress").value = "";
    document.getElementById("partnerContact").value = "";
    document.getElementById("partnerType").value = "";
    document.getElementById("partnerRegion").value = "";
    document.getElementById("partnerAgent").value = "";
    document.getElementById("partnerStatus").value = "false";

    document.getElementById("partnerId").disabled = true;

    toggleAgentField();
}

function openEditPartnerModal(item) {
    document.getElementById("partnerModalLabel").innerText = "Edit Partner";
    document.getElementById("partnerFormMode").value = "edit";
    document.getElementById("originalPartnerId").value = item.partner_id ?? "";

    document.getElementById("partnerId").value = item.partner_id ?? "";
    document.getElementById("partnerName").value = item.partner_name ?? "";
    document.getElementById("partnerAddress").value = item.address ?? "";
    document.getElementById("partnerContact").value = item.contact ?? item.contact_no ?? "";
    document.getElementById("partnerType").value = item.partner_type ?? "";
    document.getElementById("partnerRegion").value = item.region ?? "";
    document.getElementById("partnerStatus").value = String(item.is_deleted ?? false);

    toggleAgentField(item.agent_id ?? "");

    document.getElementById("partnerId").disabled = true;
    partnerModal.show();
}

async function savePartner() {
    try {
        const mode = document.getElementById("partnerFormMode")?.value || "add";
        const partnerType = document.getElementById("partnerType")?.value.trim() || "";

        const payload = {
            partner_id: document.getElementById("partnerId")?.value.trim() || "",
            partner_name: document.getElementById("partnerName")?.value.trim() || "",
            address: document.getElementById("partnerAddress")?.value.trim() || "",
            contact: document.getElementById("partnerContact")?.value.trim() || "",
            partner_type: partnerType,
            region: document.getElementById("partnerRegion")?.value.trim() || "",
            agent_id: partnerType === "CUSTOMER"
                ? document.getElementById("partnerAgent")?.value || ""
                : "",
            is_deleted: document.getElementById("partnerStatus")?.value === "true"
        };

        if (mode === "edit" && !payload.partner_id) {
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

        if (
            payload.partner_type !== "SUPPLIER" &&
            payload.partner_type !== "CUSTOMER" &&
            payload.partner_type !== "AGENT"
        ) {
            alert("Partner Type must be SUPPLIER, CUSTOMER, or AGENT.");
            return;
        }

        if (payload.partner_type === "CUSTOMER" && !payload.agent_id) {
            alert("Agent is required for CUSTOMER.");
            return;
        }

        let url = "/Partner/AddPartner";
        let method = "POST";

        if (mode === "edit") {
            url = `/Partner/UpdatePartner?id=${encodeURIComponent(payload.partner_id)}`;
            method = "PUT";
        }

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

        await loadAgentFilterDropdown();
        await loadPartners();

        alert(mode === "edit" ? "Partner updated successfully." : "Partner added successfully.");

    } catch (error) {
        console.error(error);
        alert(error.message);
    }
}

function safeHtml(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function safeAttr(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}