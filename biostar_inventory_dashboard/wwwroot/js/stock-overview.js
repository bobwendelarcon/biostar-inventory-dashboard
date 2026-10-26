let stockOverviewItems = [];
let currentPage = 1;
let pageSize = 25;

let totalRecords = 0;
let totalPages = 0;

document.addEventListener("DOMContentLoaded", async function () {
    const searchInput =
        document.getElementById("stockOverviewSearch");

    const categorySelect =
        document.getElementById("stockOverviewCategory");

    const warehouseSelect =
        document.getElementById("stockOverviewWarehouse");

    const statusSelect =
        document.getElementById("stockOverviewStatus");

    const previousButton =
        document.getElementById("btnPrevPage");

    const nextButton =
        document.getElementById("btnNextPage");

    const printButton =
        document.getElementById("btnInventoryPrint");


    printButton?.addEventListener("click", function () {
        const search =
            document.getElementById("stockOverviewSearch")
                ?.value.trim() || "";

        const category =
            document.getElementById("stockOverviewCategory")
                ?.value || "";

        const warehouse =
            document.getElementById("stockOverviewWarehouse")
                ?.value || "";

        const stockStatus =
            document.getElementById("stockOverviewStatus")
                ?.value || "";

        const params = new URLSearchParams({
            search,
            warehouse,
            categories: category,
            stockStatus,
            order: "asc"
        });

        window.open(
            `/Inventory/PrintSummary?${params.toString()}`,
            "_blank"
        );
    });

    searchInput?.addEventListener(
        "input",
        debounce(function () {
            currentPage = 1;
            loadStockOverview();
        }, 300)
    );

    categorySelect?.addEventListener(
        "change",
        function () {
            currentPage = 1;
            loadStockOverview();
        }
    );

    warehouseSelect?.addEventListener(
        "change",
        function () {
            currentPage = 1;
            loadStockOverview();
        }
    );

    statusSelect?.addEventListener(
        "change",
        function () {
            currentPage = 1;
            loadStockOverview();
        }
    );

    previousButton?.addEventListener(
        "click",
        function () {
            if (currentPage <= 1) {
                return;
            }

            currentPage--;
            loadStockOverview();
        }
    );

    nextButton?.addEventListener(
        "click",
        function () {
            if (
                totalPages === 0 ||
                currentPage >= totalPages
            ) {
                return;
            }

            currentPage++;
            loadStockOverview();
        }
    );
    await loadStockOverviewCategories();
    await loadStockOverview();
});

async function loadStockOverview() {
    const tbody =
        document.getElementById("stockOverviewTableBody");

    if (!tbody) return;

    tbody.innerHTML = `
        <tr>
            <td colspan="10"
                class="text-center text-muted py-4">
                Loading stock overview...
            </td>
        </tr>
    `;

    const search =
        document.getElementById("stockOverviewSearch")
            ?.value.trim() || "";

    const category =
        document.getElementById("stockOverviewCategory")
            ?.value || "";

    const warehouse =
        document.getElementById("stockOverviewWarehouse")
            ?.value || "";

    const stockStatus =
        document.getElementById("stockOverviewStatus")
            ?.value || "";

    const query = new URLSearchParams({
        page: currentPage.toString(),
        pageSize: pageSize.toString(),
        search,
        warehouse,
        categories: category,
        stockStatus,
        order: "asc"
    });

    try {
        const response = await fetch(
            `/Inventory/StockOverview/GetData?${query.toString()}`,
            {
                headers: {
                    "Accept": "application/json"
                },
                cache: "no-store"
            }
        );

        if (!response.ok) {
            throw new Error(
                `Request failed with status ${response.status}`
            );
        }

        const result = await response.json();

        if (!result.success) {
            throw new Error(
                result.message ||
                "Unable to load stock overview."
            );
        }

        stockOverviewItems =
            Array.isArray(result.data)
                ? result.data
                : [];

        currentPage = Number(result.page || 1);
        pageSize = Number(result.pageSize || 25);
        totalRecords = Number(result.total || 0);
        totalPages = Number(result.totalPages || 0);

        
        renderStockOverview();
        updatePagination();
    }
    catch (error) {
        console.error(error);

        tbody.innerHTML = `
            <tr>
                <td colspan="10"
                    class="text-center text-danger py-4">
                    ${escapeHtml(
            error.message ||
            "Unable to load stock overview."
        )}
                </td>
            </tr>
        `;

        totalRecords = 0;
        totalPages = 0;

        updatePagination();
    }
}

function updatePagination() {
    const info =
        document.getElementById("lblPaginationInfo");

    const currentPageButton =
        document.getElementById("btnCurrentPage");

    const previousButton =
        document.getElementById("btnPrevPage");

    const nextButton =
        document.getElementById("btnNextPage");

    const start =
        totalRecords === 0
            ? 0
            : ((currentPage - 1) * pageSize) + 1;

    const end = Math.min(
        currentPage * pageSize,
        totalRecords
    );

    if (info) {
        info.textContent =
            `Showing ${start}-${end} of ${totalRecords} products`;
    }

    if (currentPageButton) {
        currentPageButton.textContent =
            totalPages > 0
                ? `Page ${currentPage} of ${totalPages}`
                : "Page 0 of 0";
    }

    if (previousButton) {
        previousButton.disabled =
            currentPage <= 1;
    }

    if (nextButton) {
        nextButton.disabled =
            totalPages === 0 ||
            currentPage >= totalPages;
    }
}
function renderStockOverview() {
    const tbody =
        document.getElementById("stockOverviewTableBody");

    const resultCount =
        document.getElementById("stockOverviewResultCount");

    if (!tbody) return;

    if (resultCount) {
        resultCount.textContent =
            `${totalRecords} product(s)`;
    }

    if (!stockOverviewItems.length) {
        tbody.innerHTML = `
            <tr>
                <td colspan="10"
                    class="text-center text-muted py-4">
                    No inventory products found.
                </td>
            </tr>
        `;

        return;
    }

    tbody.innerHTML = stockOverviewItems
        .map(item => {
            const status =
                (item.stockStatus || "NORMAL")
                    .trim()
                    .toUpperCase();

            const badgeClass =
                status === "OUT OF STOCK"
                    ? "bg-danger"
                    : status === "LOW STOCK"
                        ? "bg-warning text-dark"
                        : "bg-success";

            const deficitClass =
                Number(item.deficitQty || 0) > 0
                    ? "text-danger fw-semibold"
                    : "text-muted";

            return `
                <tr>
                    <td>
                        <div class="fw-semibold">
                            ${escapeHtml(item.productName || "-")}
                        </div>

                        ${item.productDescription
                    ? `
                                <div class="small text-muted">
                                    ${escapeHtml(
                        item.productDescription
                    )}
                                </div>
                              `
                    : ""}
                    </td>

                    <td>
                        ${escapeHtml(
                        item.categoryName || "Uncategorized"
                    )}
                    </td>

                    <td class="text-end">
                        ${formatNumber(item.totalQty)}
                        ${escapeHtml(item.uom || "")}
                    </td>

                    <td class="text-end">
                        ${formatNumber(item.reservedQty)}
                        ${escapeHtml(item.uom || "")}
                    </td>

                    <td class="text-end fw-semibold">
                        ${formatNumber(item.availableQty)}
                        ${escapeHtml(item.uom || "")}
                    </td>

                    <td class="text-end">
                        ${formatNumber(item.stockLevel)}
                        ${escapeHtml(item.uom || "")}
                    </td>

                    <td class="text-end ${deficitClass}">
                        ${formatNumber(item.deficitQty)}
                        ${escapeHtml(item.uom || "")}
                    </td>

                    <td>
                        <span class="badge ${badgeClass}">
                            ${escapeHtml(status)}
                        </span>
                    </td>

                    <td>
                        ${escapeHtml(item.packDisplay || "-")}
                    </td>

                    <td class="text-center">
                      <a class="btn btn-sm btn-outline-primary"
   target="_blank"
   rel="noopener noreferrer"
   href="/Inventory?productId=${encodeURIComponent(
       item.productId || ""
   )}&search=${encodeURIComponent(
       item.productName || ""
   )}">
    View Lots
</a>
                    </td>
                </tr>
            `;
        })
        .join("");
}

async function loadStockOverviewCategories() {
    const select =
        document.getElementById("stockOverviewCategory");

    if (!select) return;

    try {
        const response = await fetch(
            "/Inventory/GetInventoryCategories",
            {
                headers: {
                    "Accept": "application/json"
                },
                cache: "no-store"
            }
        );

        if (!response.ok) {
            throw new Error("Failed to load categories.");
        }

        const categories = await response.json();

        select.innerHTML = `
            <option value="">All Categories</option>

            ${(Array.isArray(categories) ? categories : [])
                .map(category => `
                    <option value="${escapeHtml(category)}">
                        ${escapeHtml(category)}
                    </option>
                `)
                .join("")}
        `;
    }
    catch (error) {
        console.error(error);
    }
}



function debounce(callback, delay) {
    let timer;

    return function (...args) {
        clearTimeout(timer);

        timer = setTimeout(
            () => callback.apply(this, args),
            delay
        );
    };
}

function formatNumber(value) {
    const number = Number(value || 0);

    return number.toLocaleString("en-PH", {
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



document.addEventListener("DOMContentLoaded", function () {

    const fromInput =
        document.getElementById("dailyInventoryFromDate");

    const toInput =
        document.getElementById("dailyInventoryToDate");

    const generateButton =
        document.getElementById("btnGenerateDailyInventory");

    if (!fromInput || !toInput || !generateButton)
        return;


    const dailyModal =
        document.getElementById("dailyInventoryPrintModal");

    const dailyCategoryList =
        document.getElementById("dailyInventoryCategoryList");

    const dailySelectAll =
        document.getElementById("dailySelectAllCategories");

    function getDailyCategoryCheckboxes() {
        return Array.from(
            dailyCategoryList.querySelectorAll(
                ".daily-category-checkbox"
            )
        );
    }

    function updateDailySelectAll() {
        const checkboxes = getDailyCategoryCheckboxes();

        dailySelectAll.checked =
            checkboxes.length > 0 &&
            checkboxes.every(x => x.checked);

        dailySelectAll.indeterminate =
            checkboxes.some(x => x.checked) &&
            !dailySelectAll.checked;
    }

    function populateDailyCategories() {
        const sourceSelect =
            document.getElementById("stockOverviewCategory");

        if (!sourceSelect || !dailyCategoryList)
            return;

        dailyCategoryList.innerHTML = "";

        const options = Array.from(sourceSelect.options)
            .filter(x => x.value.trim() !== "");

        if (!options.length) {
            dailyCategoryList.innerHTML =
                '<div class="text-danger small">' +
                'No categories available. Please try again.' +
                '</div>';

            return;
        }

        options.forEach((option, index) => {
            const wrapper = document.createElement("div");
            wrapper.className = "form-check mb-2";

            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.className =
                "form-check-input daily-category-checkbox";
            checkbox.id = `dailyCategory_${index}`;
            checkbox.value = option.value;
            checkbox.checked = true;

            const label = document.createElement("label");
            label.className = "form-check-label";
            label.htmlFor = checkbox.id;
            label.textContent = option.textContent.trim();

            wrapper.appendChild(checkbox);
            wrapper.appendChild(label);
            dailyCategoryList.appendChild(wrapper);

            checkbox.addEventListener(
                "change",
                updateDailySelectAll
            );
        });

        updateDailySelectAll();
    }

    dailySelectAll?.addEventListener("change", function () {
        getDailyCategoryCheckboxes().forEach(checkbox => {
            checkbox.checked = this.checked;
        });

        updateDailySelectAll();
    });

    // Populate after the modal is opened.
    // The main category dropdown has already been
    // loaded asynchronously on page initialization.
    dailyModal?.addEventListener("show.bs.modal", function () {
        populateDailyCategories();
    });


    // Philippine calendar date.
    function phToday() {
        return new Intl.DateTimeFormat("en-CA", {
            timeZone: "Asia/Manila",
            year: "numeric",
            month: "2-digit",
            day: "2-digit"
        }).format(new Date());
    }

    const today = phToday();

    fromInput.value = today;
    toInput.value = today;

    fromInput.max = today;
    toInput.max = today;

    generateButton.addEventListener("click", function () {

        const fromDate = fromInput.value;
        const toDate = toInput.value;

        if (!fromDate || !toDate) {
            alert("Please select both dates.");
            return;
        }

        if (fromDate > toDate) {
            alert("From Date cannot be later than To Date.");
            return;
        }

        if (toDate > phToday()) {
            alert("Future dates are not allowed.");
            return;
        }



        const categoryCheckboxes = getDailyCategoryCheckboxes();

        const selectedCategories = categoryCheckboxes
            .filter(x => x.checked)
            .map(x => x.value);

        if (!categoryCheckboxes.length) {
            alert("Categories are not loaded. Please try again.");
            return;
        }

        if (!selectedCategories.length) {
            alert("Please select at least one category.");
            return;
        }

        const params = new URLSearchParams({
            fromDate,
            toDate,
            warehouse:
                document.getElementById("stockOverviewWarehouse")
                    ?.value || ""
        });

        // Apply category filtering when not all are selected.
        if (selectedCategories.length < categoryCheckboxes.length) {
            params.set(
                "categories",
                selectedCategories.join("|")
            );
        }




        window.open(
            `/Inventory/StockOverview/DailyPrint?${params.toString()}`,
            "_blank",
            "noopener,noreferrer"
        );

    });

});
