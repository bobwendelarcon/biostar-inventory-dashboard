document.addEventListener("DOMContentLoaded", function () {
    const btnOpenAddCategory = document.getElementById("btnOpenAddCategory");
    const btnSaveCategory = document.getElementById("btnSaveCategory");
    const searchCategory = document.getElementById("searchCategory");

    const categoryMode = document.getElementById("categoryMode");
    const catgId = document.getElementById("catg_id");
    const catgName = document.getElementById("catg_name");
    const catgDesc = document.getElementById("catg_desc");
    const catgStatus = document.getElementById("catg_status");
    const categoryModalLabel = document.getElementById("categoryModalLabel");

    if (btnOpenAddCategory) {
        btnOpenAddCategory.addEventListener("click", function () {
            clearCategoryForm();
            categoryMode.value = "add";
            categoryModalLabel.textContent = "Add Category";
            catgId.readOnly = false;
        });
    }

    document.querySelectorAll(".btn-edit-category").forEach(button => {
        button.addEventListener("click", function () {
            categoryMode.value = "edit";
            categoryModalLabel.textContent = "Edit Category";

            catgId.value = this.dataset.id || "";
            catgName.value = this.dataset.name || "";
            catgDesc.value = this.dataset.desc || "";
            catgStatus.value = this.dataset.status || "Active";

            catgId.readOnly = true;

            const modal = new bootstrap.Modal(document.getElementById("categoryModal"));
            modal.show();
        });
    });

    document.querySelectorAll(".btn-delete-category").forEach(button => {
        button.addEventListener("click", function () {
            const id = this.dataset.id;
            if (confirm(`Delete category ${id}?`)) {
                alert(`Temporary only: delete logic for ${id}`);
            }
        });
    });

    if (btnSaveCategory) {
        btnSaveCategory.addEventListener("click", async function () {
            const payload = {
                catg_id: catgId.value.trim(),
                catg_name: catgName.value.trim(),
                catg_desc: catgDesc.value.trim(),
                is_deleted: catgStatus.value === "Inactive"
            };

            if (!payload.catg_id || !payload.catg_name) {
                alert("Category ID and Category Name are required.");
                return;
            }

            try {
                let url = "";
                let successMessage = "";

                if (categoryMode.value === "add") {
                    url = "/Categories/AddCategory";
                    successMessage = "Category added successfully!";
                } else {
                    url = "/Categories/UpdateCategory";
                    successMessage = "Category updated successfully!";
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
                location.reload();

            } catch (error) {
                console.error(error);
                alert("Error saving category: " + error.message);
            }
        });
    }

    if (searchCategory) {
        searchCategory.addEventListener("keyup", function () {
            const keyword = this.value.toLowerCase();
            const rows = document.querySelectorAll("#categoryTableBody tr");

            rows.forEach(row => {
                const text = row.innerText.toLowerCase();
                row.style.display = text.includes(keyword) ? "" : "none";
            });
        });
    }

    function clearCategoryForm() {
        catgId.value = "";
        catgName.value = "";
        catgDesc.value = "";
        catgStatus.value = "Active";
    }
});