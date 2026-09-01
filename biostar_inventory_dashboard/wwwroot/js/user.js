let userModal;
let filterTimeout;
let currentAccessPoints = [];

document.addEventListener("DOMContentLoaded", function () {
    const modalEl = document.getElementById("userModal");
    userModal = new bootstrap.Modal(modalEl);

    document.getElementById("btnFilterUsers")?.addEventListener("click", loadUsers);
    document.getElementById("btnClearUsers")?.addEventListener("click", clearFilters);
    document.getElementById("btnSaveUser")?.addEventListener("click", saveUser);
    document.getElementById("btnAddUser")?.addEventListener("click", openAddUserModal);

    document.getElementById("searchUser")?.addEventListener("input", debounceLoad);
    document.getElementById("filterRole")?.addEventListener("input", debounceLoad);
    document.getElementById("filterStatus")?.addEventListener("change", loadUsers);
    document.getElementById("roleName")
        ?.addEventListener("change", handleRoleAccessState);

    loadUsers();
});


async function loadAvailableAccessPoints() {
    const loading =
        document.getElementById("accessPointLoading");

    try {
        loading.classList.remove("d-none");

        const response =
            await fetch(
                "/User/GetAvailableAccessPoints"
            );

        if (!response.ok) {
            throw new Error(
                "Failed to load access points."
            );
        }

        currentAccessPoints =
            await response.json();

        renderAccessPoints(
            currentAccessPoints
        );

        handleRoleAccessState();
    }
    catch (error) {
        console.error(error);

        document.getElementById(
            "accessPointContainer"
        ).innerHTML = `
            <div class="col-12">
                <div class="alert alert-danger">
                    ${error.message}
                </div>
            </div>
        `;
    }
    finally {
        loading.classList.add("d-none");
    }
}
async function loadUserAccessPoints(userId) {
    const loading =
        document.getElementById(
            "accessPointLoading"
        );

    try {
        loading.classList.remove("d-none");

        const response =
            await fetch(
                `/User/GetUserAccessPoints?id=${encodeURIComponent(userId)}`
            );

        if (!response.ok) {
            throw new Error(
                "Failed to load user access points."
            );
        }

        currentAccessPoints =
            await response.json();

        renderAccessPoints(
            currentAccessPoints
        );

        handleRoleAccessState();
    }
    catch (error) {
        console.error(error);

        document.getElementById(
            "accessPointContainer"
        ).innerHTML = `
            <div class="col-12">
                <div class="alert alert-danger">
                    ${error.message}
                </div>
            </div>
        `;
    }
    finally {
        loading.classList.add("d-none");
    }
}
function renderAccessPoints(accessPoints) {
    const container =
        document.getElementById(
            "accessPointContainer"
        );

    container.innerHTML = "";

    if (!accessPoints ||
        accessPoints.length === 0) {

        container.innerHTML = `
            <div class="col-12">
                <div class="text-muted">
                    No access points available.
                </div>
            </div>
        `;

        return;
    }


    const grouped = {};

    accessPoints.forEach(item => {
        const moduleName =
            item.module_name || "Other";

        if (!grouped[moduleName]) {
            grouped[moduleName] = [];
        }

        grouped[moduleName].push(item);
    });


    Object.keys(grouped).forEach(
        moduleName => {

            const safeModuleId =
                moduleName
                    .replace(/[^a-zA-Z0-9]/g, "_");

            let checkboxes = "";

            grouped[moduleName]
                .forEach(item => {

                    checkboxes += `
                        <div class="form-check mb-2">
                            <input
                                class="form-check-input access-point-checkbox"
                                type="checkbox"
                                value="${item.access_point_id}"
                                id="access_${item.access_point_id}"
                                ${item.has_access ? "checked" : ""}>

                            <label
                                class="form-check-label"
                                for="access_${item.access_point_id}">
                                ${escapeHtml(item.access_name)}
                            </label>
                        </div>
                    `;
                });


            container.insertAdjacentHTML(
                "beforeend",
                `
             <div class="col-md-6 col-xl-4">
                    <div class="card border h-100">
                        <div class="card-body">

                           <div class="d-flex justify-content-between align-items-center border-bottom pb-2 mb-3">

    <span class="fw-bold">
        ${escapeHtml(moduleName)}
    </span>

    <div class="form-check mb-0">
        <input
            class="form-check-input module-select-all"
            type="checkbox"
            id="module_${safeModuleId}"
            data-module="${escapeHtml(moduleName)}">

        <label
            class="form-check-label small text-muted"
            for="module_${safeModuleId}">
            Select All
        </label>
    </div>

</div>

                            <div
                                class="module-access-group"
                                data-module="${escapeHtml(moduleName)}">

                                ${checkboxes}

                            </div>
                        </div>
                    </div>
                </div>
                `
            );
        }
    );


    document.querySelectorAll(
        ".module-select-all"
    ).forEach(check => {

        check.addEventListener(
            "change",
            function () {

                const moduleName =
                    this.dataset.module;

                document.querySelectorAll(
                    `.module-access-group[data-module="${CSS.escape(moduleName)}"] .access-point-checkbox`
                ).forEach(cb => {

                    cb.checked =
                        this.checked;
                });
            }
        );
    });


    updateModuleSelectAllStates();

    document.querySelectorAll(
        ".access-point-checkbox"
    ).forEach(cb => {

        cb.addEventListener(
            "change",
            updateModuleSelectAllStates
        );
    });
}
function updateModuleSelectAllStates() {
    document.querySelectorAll(
        ".module-select-all"
    ).forEach(moduleCheckbox => {

        const moduleName =
            moduleCheckbox.dataset.module;

        const children =
            Array.from(
                document.querySelectorAll(
                    `.module-access-group[data-module="${CSS.escape(moduleName)}"] .access-point-checkbox`
                )
            );

        if (children.length === 0) {
            moduleCheckbox.checked = false;
            return;
        }

        moduleCheckbox.checked =
            children.every(x => x.checked);

        moduleCheckbox.indeterminate =
            !moduleCheckbox.checked &&
            children.some(x => x.checked);
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
function handleRoleAccessState() {
    const role =
        document.getElementById(
            "roleName"
        )?.value?.toUpperCase() || "";

    const isAdmin =
        role === "ADMIN";

    const notice =
        document.getElementById(
            "adminAccessNotice"
        );

    if (isAdmin) {
        notice.classList.remove("d-none");
    }
    else {
        notice.classList.add("d-none");
    }

    document.querySelectorAll(
        ".access-point-checkbox, .module-select-all"
    ).forEach(cb => {

        cb.disabled = isAdmin;

        if (isAdmin) {
            cb.checked = true;
        }
    });
}
function debounceLoad() {
    clearTimeout(filterTimeout);
    filterTimeout = setTimeout(() => {
        loadUsers();
    }, 400);
}
function togglePassword() {
    const input = document.getElementById("passwordHash");
    input.type = input.type === "password" ? "text" : "password";
}
async function loadUsers() {
    try {
        const response = await fetch("/User/GetUsers");

        if (!response.ok) {
            throw new Error("Failed to load users.");
        }

        const data = await response.json();

        const searchValue = (document.getElementById("searchUser")?.value || "").toLowerCase().trim();
        const roleValue = document.getElementById("filterRole")?.value || "";
        const statusValue = document.getElementById("filterStatus")?.value ?? "";

        let filteredData = data;

        if (searchValue) {
            filteredData = filteredData.filter(x =>
                (x.user_id ?? "").toLowerCase().includes(searchValue) ||
                (x.full_name ?? "").toLowerCase().includes(searchValue) ||
                (x.username ?? "").toLowerCase().includes(searchValue)
            );
        }

        if (roleValue) {
            filteredData = filteredData.filter(x =>
                (x.role_name ?? "").toUpperCase() === roleValue
            );
        }

        if (statusValue !== "") {
            const isDeleted = statusValue === "true";
            filteredData = filteredData.filter(x =>
                Boolean(x.is_deleted) === isDeleted
            );
        }

        renderUserTable(filteredData);
    } catch (error) {
        console.error(error);
        document.getElementById("userTableBody").innerHTML = `
            <tr>
                <td colspan="6" class="text-center text-danger">${error.message}</td>
            </tr>
        `;
    }
}

function renderUserTable(data) {
    const tableBody = document.getElementById("userTableBody");
    tableBody.innerHTML = "";

    if (!data || data.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center text-muted">No users found.</td>
            </tr>
        `;
        return;
    }

    data.forEach((user, index) => {
        const statusText = String(user.is_deleted) === "true" ? "Inactive" : "Active";

        tableBody.innerHTML += `
            <tr>
                <td>${user.user_id ?? ""}</td>
                <td>${user.full_name ?? ""}</td>
                <td>${user.username ?? ""}</td>
                <td>${user.role_name ?? ""}</td>
                <td>${statusText}</td>
               <td class="text-end">
    <div class="d-flex justify-content-end gap-2">

        <button
            class="btn btn-sm btn-outline-primary rounded-3 edit-user-btn"
            data-user-id="${escapeHtml(user.user_id ?? "")}"
            data-full-name="${escapeHtml(user.full_name ?? "")}"
            data-username="${escapeHtml(user.username ?? "")}"
            data-role-name="${escapeHtml(user.role_name ?? "")}"
            data-is-deleted="${String(user.is_deleted ?? false)}">
            <i class="bi bi-pencil"></i>
            Edit
        </button>

        <button
            class="btn btn-sm btn-outline-danger rounded-3 delete-user-btn"
            data-user-id="${escapeHtml(user.user_id ?? "")}"
            data-full-name="${escapeHtml(user.full_name ?? "")}">
            <i class="bi bi-trash"></i>
            Delete
        </button>

    </div>
</td>
            </tr>
        `;
    });

    document.querySelectorAll(".edit-user-btn").forEach(btn => {
        btn.addEventListener("click", function () {
            const user = {
                user_id: this.dataset.userId,
                full_name: this.dataset.fullName,
                username: this.dataset.username,
                role_name: this.dataset.roleName,
                is_deleted: this.dataset.isDeleted === "true"
            };

            openEditUserModal(user);
        });
    });

    document.querySelectorAll(".delete-user-btn")
        .forEach(btn => {

            btn.addEventListener(
                "click",
                function () {

                    const userId =
                        this.dataset.userId;

                    const fullName =
                        this.dataset.fullName ||
                        userId;

                    deleteUser(
                        userId,
                        fullName
                    );
                }
            );
        });


}

async function deleteUser(userId, fullName) {

    if (!userId) {
        alert("User ID is required.");
        return;
    }

    const confirmed = confirm(
        `Are you sure you want to delete the account "${fullName}"?\n\n` +
        `User ID: ${userId}\n\n` +
        `The account will no longer be able to log in.`
    );

    if (!confirmed) {
        return;
    }

    try {

        const response = await fetch(
            `/User/DeleteUser?id=${encodeURIComponent(userId)}`,
            {
                method: "DELETE"
            }
        );

        const responseText =
            await response.text();

        let result = {};

        try {
            result =
                responseText
                    ? JSON.parse(responseText)
                    : {};
        }
        catch {
            result = {
                message: responseText
            };
        }

        if (!response.ok) {
            throw new Error(
                result.message ||
                responseText ||
                "Failed to delete account."
            );
        }

        alert(
            result.message ||
            "Account deleted successfully."
        );

        await loadUsers();

    }
    catch (error) {

        console.error(
            "Delete user error:",
            error
        );

        alert(
            error.message ||
            "Failed to delete account."
        );
    }
}

function clearFilters() {
    document.getElementById("searchUser").value = "";
    document.getElementById("filterRole").value = "";
    document.getElementById("filterStatus").value = "";
    loadUsers();
}

async function openAddUserModal() {
    document.getElementById(
        "userModalLabel"
    ).innerText = "Add User";

    document.getElementById(
        "userFormMode"
    ).value = "add";

    document.getElementById(
        "originalUserId"
    ).value = "";

    document.getElementById("userId").value = "";
    document.getElementById("fullName").value = "";
    document.getElementById("username").value = "";
    document.getElementById("passwordHash").value = "";
    document.getElementById("roleName").value = "";
    document.getElementById("userStatus").value = "false";

    document.getElementById(
        "userId"
    ).disabled = false;

    await loadAvailableAccessPoints();
}

async function openEditUserModal(user) {
    const userModalLabel = document.getElementById("userModalLabel");
    const userFormMode = document.getElementById("userFormMode");
    const originalUserId = document.getElementById("originalUserId");
    const userId = document.getElementById("userId");
    const fullName = document.getElementById("fullName");
    const username = document.getElementById("username");
    const passwordHash = document.getElementById("passwordHash");
    const roleName = document.getElementById("roleName");
    const userStatus = document.getElementById("userStatus");

    console.log("openEditUserModal user:", user);
    console.log("roleName element:", roleName);

    if (!userModalLabel || !userFormMode || !originalUserId || !userId || !fullName || !username || !passwordHash || !roleName || !userStatus) {
        console.error("One or more modal elements were not found.");
        return;
    }

    userModalLabel.innerText = "Edit User";
    userFormMode.value = "edit";
    originalUserId.value = user.user_id ?? "";

    userId.value = user.user_id ?? "";
    fullName.value = user.full_name ?? "";
    username.value = user.username ?? "";
    passwordHash.value = "";
    roleName.value = (user.role_name ?? "").toUpperCase();
    userStatus.value = String(user.is_deleted ?? false);

    userId.disabled = true;
    await loadUserAccessPoints(
        user.user_id
    );
    userModal.show();
}
function getSelectedAccessPointIds() {
    return Array.from(
        document.querySelectorAll(
            ".access-point-checkbox:checked"
        )
    )
        .map(x => parseInt(x.value))
        .filter(x => !isNaN(x));
}
async function saveAccessPoints(userId) {
    const role =
        document.getElementById(
            "roleName"
        ).value.toUpperCase();

    // ADMIN gets everything automatically.
    if (role === "ADMIN") {
        return;
    }

    const payload = {
        access_point_ids:
            getSelectedAccessPointIds()
    };

    const response =
        await fetch(
            `/User/SaveUserAccessPoints?id=${encodeURIComponent(userId)}`,
            {
                method: "PUT",
                headers: {
                    "Content-Type":
                        "application/json"
                },
                body:
                    JSON.stringify(payload)
            }
        );

    const responseText =
        await response.text();

    if (!response.ok) {
        throw new Error(
            responseText ||
            "Failed to save access points."
        );
    }
}
async function saveUser() {
    try {
        const mode = document.getElementById("userFormMode").value;

        const passwordValue = document.getElementById("passwordHash")?.value.trim();

        const payload = {
            user_id: document.getElementById("userId")?.value.trim() || "",
            full_name: document.getElementById("fullName")?.value.trim() || "",
            username: document.getElementById("username")?.value.trim() || "",
            role_name: document.getElementById("roleName")?.value.trim() || "",
            is_deleted: document.getElementById("userStatus")?.value === "true"
        };

        // ✅ ONLY send password if user typed something
        if (passwordValue) {
            payload.password_hash = passwordValue;
        }
        if (!payload.user_id) {
            alert("User ID is required.");
            return;
        }

        if (!payload.full_name) {
            alert("Full Name is required.");
            return;
        }
        if (!payload.role_name) {
            alert("Role is required.");
            return;
        }

        let url = "/User/AddUser";
        let method = "POST";

        if (mode === "edit") {
            url = `/User/UpdateUser?id=${encodeURIComponent(payload.user_id)}`;
            method = "PUT";
        }

        const response = await fetch(url, {
            method: method,
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        const resultText =
            await response.text();

        if (!response.ok) {
            throw new Error(
                resultText ||
                "Failed to save user."
            );
        }


        // Save selected module access
        await saveAccessPoints(
            payload.user_id
        );


        userModal.hide();


        loadUsers();
        alert(mode === "edit" ? "User updated successfully." : "User added successfully.");
    } catch (error) {
        console.error(error);
        alert(error.message);
    }
}