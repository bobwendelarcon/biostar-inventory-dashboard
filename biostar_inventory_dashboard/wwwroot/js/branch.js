document.addEventListener("DOMContentLoaded", function () {
    const btnAddBranch = document.getElementById("btnAddBranch");
    const btnSaveBranch = document.getElementById("btnSaveBranch");
    const searchBranch = document.getElementById("searchBranch");
    const filterBranchStatus = document.getElementById("filterBranchStatus");
    const btnFilterBranches = document.getElementById("btnFilterBranches");
    const btnClearBranches = document.getElementById("btnClearBranches");

    const branchMode = document.getElementById("branchMode");
    const originalBranchId = document.getElementById("originalBranchId");

    const branchId = document.getElementById("branch_id");
    const branchName = document.getElementById("branch_name");
    const branchLoc = document.getElementById("branch_loc");
    const branchStatus = document.getElementById("branch_status");
    const branchModalLabel = document.getElementById("branchModalLabel");

    let allBranches = [];

    async function loadBranches() {
        try {
            const response = await fetch("/Branch/GetBranches");

            if (!response.ok) {
                const err = await response.text();
                throw new Error(err);
            }

            const data = await response.json();
            allBranches = data || [];
            renderBranches(allBranches);

        } catch (error) {
            document.getElementById("branchTableBody").innerHTML = `
                <tr>
                    <td colspan="5" class="text-center text-danger">
                        ${error.message}
                    </td>
                </tr>
            `;
            console.error(error);
        }
    }

    function renderBranches(branches) {
        const tableBody = document.getElementById("branchTableBody");
        tableBody.innerHTML = "";

        if (!branches || branches.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center text-muted">
                        No branches found.
                    </td>
                </tr>
            `;
            return;
        }

        branches.forEach(item => {
            tableBody.innerHTML += `
                <tr>
                    <td>${item.branch_id ?? ""}</td>
                    <td>${item.branch_name ?? ""}</td>
                    <td>${item.branch_loc ?? ""}</td>
                    <td>
                        ${item.is_deleted
                    ? '<span class="badge bg-secondary">Inactive</span>'
                    : '<span class="badge bg-success">Active</span>'}
                    </td>
                    <td class="text-end">
                        <button
                            class="btn btn-sm btn-outline-primary me-1 btn-edit-branch"
                            data-id="${item.branch_id ?? ""}"
                            data-name="${item.branch_name ?? ""}"
                            data-loc="${item.branch_loc ?? ""}"
                            data-status="${item.is_deleted ? "true" : "false"}">
                            Edit
                        </button>
                        <button
                            class="btn btn-sm btn-outline-danger btn-delete-branch"
                            data-id="${item.branch_id ?? ""}">
                            Delete
                        </button>
                    </td>
                </tr>
            `;
        });

        bindBranchButtons();
    }

    function bindBranchButtons() {
        document.querySelectorAll(".btn-edit-branch").forEach(button => {
            button.addEventListener("click", function () {
                branchMode.value = "edit";
                originalBranchId.value = this.dataset.id || "";

                branchModalLabel.textContent = "Edit Branch";
                btnSaveBranch.textContent = "Update Branch";

                branchId.value = this.dataset.id || "";
                branchName.value = this.dataset.name || "";
                branchLoc.value = this.dataset.loc || "";
                branchStatus.value = this.dataset.status || "false";

                branchId.readOnly = true;

                const modal = new bootstrap.Modal(document.getElementById("branchModal"));
                modal.show();
            });
        });

        document.querySelectorAll(".btn-delete-branch").forEach(button => {
            button.addEventListener("click", function () {
                const id = this.dataset.id;
                alert(`Temporary only: delete logic for ${id}`);
            });
        });
    }

    function clearBranchForm() {
        branchMode.value = "add";
        originalBranchId.value = "";

        branchId.value = "";
        branchName.value = "";
        branchLoc.value = "";
        branchStatus.value = "false";

        branchId.readOnly = false;
        branchModalLabel.textContent = "Add Branch";
        btnSaveBranch.textContent = "Save Branch";
    }

    function applyFilters() {
        const keyword = searchBranch?.value.trim().toLowerCase() || "";
        const selectedStatus = filterBranchStatus?.value || "";

        let filtered = [...allBranches];

        if (keyword) {
            filtered = filtered.filter(item =>
                (item.branch_id ?? "").toLowerCase().includes(keyword) ||
                (item.branch_name ?? "").toLowerCase().includes(keyword) ||
                (item.branch_loc ?? "").toLowerCase().includes(keyword)
            );
        }

        if (selectedStatus !== "") {
            const isDeleted = selectedStatus === "true";
            filtered = filtered.filter(item => Boolean(item.is_deleted) === isDeleted);
        }

        renderBranches(filtered);
    }

    if (btnSaveBranch) {
        btnSaveBranch.addEventListener("click", async function () {
            const payload = {
                branch_id: branchId.value.trim(),
                branch_name: branchName.value.trim(),
                branch_loc: branchLoc.value.trim(),
                is_deleted: branchStatus.value === "true"
            };

            if (!payload.branch_id || !payload.branch_name) {
                alert("Branch ID and Branch Name are required.");
                return;
            }

            try {
                let url = "";
                let successMessage = "";

                if (branchMode.value === "add") {
                    url = "/Branch/AddBranch";
                    successMessage = "Branch added successfully!";
                } else {
                    url = `/Branch/UpdateBranch?id=${encodeURIComponent(originalBranchId.value)}`;
                    successMessage = "Branch updated successfully!";
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

                const modalEl = document.getElementById("branchModal");
                const modal = bootstrap.Modal.getInstance(modalEl);
                if (modal) modal.hide();

                await loadBranches();
                applyFilters();

            } catch (error) {
                console.error(error);
                alert("Error saving branch: " + error.message);
            }
        });
    }

    if (btnAddBranch) {
        btnAddBranch.addEventListener("click", function () {
            clearBranchForm();
        });
    }

    if (searchBranch) {
        searchBranch.addEventListener("keyup", function () {
            applyFilters();
        });
    }

    if (filterBranchStatus) {
        filterBranchStatus.addEventListener("change", function () {
            applyFilters();
        });
    }

    if (btnFilterBranches) {
        btnFilterBranches.addEventListener("click", function () {
            applyFilters();
        });
    }

    if (btnClearBranches) {
        btnClearBranches.addEventListener("click", function () {
            if (searchBranch) searchBranch.value = "";
            if (filterBranchStatus) filterBranchStatus.value = "";
            renderBranches(allBranches);
        });
    }

    loadBranches();
});