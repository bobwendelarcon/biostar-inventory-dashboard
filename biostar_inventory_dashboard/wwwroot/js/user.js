let userModal;
let filterTimeout;

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

    loadUsers();
});

function debounceLoad() {
    clearTimeout(filterTimeout);
    filterTimeout = setTimeout(() => {
        loadUsers();
    }, 400);
}

async function loadUsers() {
    try {
        const response = await fetch("/User/GetUsers");

        if (!response.ok) {
            throw new Error("Failed to load users.");
        }

        const data = await response.json();

        const searchValue = (document.getElementById("searchUser")?.value || "").toLowerCase().trim();
        const roleValue = (document.getElementById("filterRole")?.value || "").toLowerCase().trim();
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
                (x.role_name ?? "").toLowerCase().includes(roleValue)
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

    data.forEach(user => {
        const statusText = String(user.is_deleted) === "true" ? "Inactive" : "Active";

        tableBody.innerHTML += `
            <tr>
                <td>${user.user_id ?? ""}</td>
                <td>${user.full_name ?? ""}</td>
                <td>${user.username ?? ""}</td>
                <td>${user.role_name ?? ""}</td>
                <td>${statusText}</td>
                <td class="text-end">
                    <button class="btn btn-sm btn-outline-primary rounded-3"
                        onclick='openEditUserModal(${JSON.stringify(user).replace(/'/g, "&apos;")})'>
                        Edit
                    </button>
                </td>
            </tr>
        `;
    });
}

function clearFilters() {
    document.getElementById("searchUser").value = "";
    document.getElementById("filterRole").value = "";
    document.getElementById("filterStatus").value = "";
    loadUsers();
}

function openAddUserModal() {
    document.getElementById("userModalLabel").innerText = "Add User";
    document.getElementById("userFormMode").value = "add";
    document.getElementById("originalUserId").value = "";

    document.getElementById("userId").value = "";
    document.getElementById("fullName").value = "";
    document.getElementById("username").value = "";
    document.getElementById("passwordHash").value = "";
    document.getElementById("roleName").value = "";
    document.getElementById("userStatus").value = "false";

    document.getElementById("userId").disabled = false;
}

function openEditUserModal(user) {
    document.getElementById("userModalLabel").innerText = "Edit User";
    document.getElementById("userFormMode").value = "edit";
    document.getElementById("originalUserId").value = user.user_id ?? "";

    document.getElementById("userId").value = user.user_id ?? "";
    document.getElementById("fullName").value = user.full_name ?? "";
    document.getElementById("username").value = user.username ?? "";
    document.getElementById("passwordHash").value = user.password_hash ?? "";
    document.getElementById("roleName").value = user.role_name ?? "";
    document.getElementById("userStatus").value = String(user.is_deleted ?? false);

    document.getElementById("userId").disabled = true;
    userModal.show();
}

async function saveUser() {
    try {
        const mode = document.getElementById("userFormMode").value;

        const payload = {
            user_id: document.getElementById("userId")?.value.trim() || "",
            full_name: document.getElementById("fullName")?.value.trim() || "",
            username: document.getElementById("username")?.value.trim() || "",
            password_hash: document.getElementById("passwordHash")?.value.trim() || "",
            role_name: document.getElementById("roleName")?.value.trim() || "",
            is_deleted: document.getElementById("userStatus")?.value === "true"
        };

        console.log("USER PAYLOAD:", payload);

        if (!payload.user_id) {
            alert("User ID is required.");
            return;
        }

        if (!payload.full_name) {
            alert("Full Name is required.");
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

        const resultText = await response.text();

        if (!response.ok) {
            throw new Error(resultText || "Failed to save user.");
        }

        userModal.hide();
        loadUsers();
        alert(mode === "edit" ? "User updated successfully." : "User added successfully.");
    } catch (error) {
        console.error(error);
        alert(error.message);
    }
}