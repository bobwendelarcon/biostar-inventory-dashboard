document.addEventListener("DOMContentLoaded", function () {

    loadTransactions();

    document
        .getElementById("btnSearch")
        ?.addEventListener("click", function () {
            loadTransactions();
        });

    document
        .getElementById("btnClear")
        ?.addEventListener("click", function () {
            clearFilters();
        });

    document
        .getElementById("btnRefresh")
        ?.addEventListener("click", function () {
            loadTransactions();
        });
});


async function loadTransactions() {

    const tbody =
        document.getElementById("transactionTableBody");

    tbody.innerHTML = `
        <tr>
            <td colspan="12"
                class="text-center text-muted py-4">
                Loading inventory transactions...
            </td>
        </tr>
    `;

    const search =
        document.getElementById("transactionSearch")?.value ?? "";

    const branchId =
        document.getElementById("branchFilter")?.value ?? "";

    const movement =
        document.getElementById("movementFilter")?.value ?? "";

    const transactionType =
        document.getElementById("transactionTypeFilter")?.value ?? "";

    const fromDate =
        document.getElementById("fromDate")?.value ?? "";

    const toDate =
        document.getElementById("toDate")?.value ?? "";

    const params =
        new URLSearchParams();

    if (search)
        params.append("search", search);

    if (branchId)
        params.append("branchId", branchId);

    if (movement)
        params.append("movement", movement);

    if (transactionType)
        params.append(
            "transactionType",
            transactionType
        );

    if (fromDate)
        params.append("fromDate", fromDate);

    if (toDate)
        params.append("toDate", toDate);


    try {

        const response = await fetch(
            `/inventory/raw-material-transactions/data?${params.toString()}`
        );

        if (!response.ok) {

            const text =
                await response.text();

            console.error(text);

            tbody.innerHTML = `
                <tr>
                    <td colspan="12"
                        class="text-center text-danger py-4">
                        Failed to load inventory transactions.
                    </td>
                </tr>
            `;

            return;
        }

        const result =
            await response.json();

        renderSummary(result.summary);
        renderTransactions(result.items || []);

        loadBranchOptions(
            result.items || []
        );

    }
    catch (error) {

        console.error(error);

        tbody.innerHTML = `
            <tr>
                <td colspan="12"
                    class="text-center text-danger py-4">
                    Error loading inventory transactions.
                </td>
            </tr>
        `;
    }
}


function renderSummary(summary) {

    summary = summary || {};

    document.getElementById(
        "totalTransactions"
    ).textContent =
        formatNumber(
            summary.totalTransactions || 0
        );

    document.getElementById(
        "totalIn"
    ).textContent =
        formatNumber(
            summary.inTransactions || 0
        );

    document.getElementById(
        "totalOut"
    ).textContent =
        formatNumber(
            summary.outTransactions || 0
        );

    document.getElementById(
        "todayTransactions"
    ).textContent =
        formatNumber(
            summary.todayTransactions || 0
        );
}


function renderTransactions(items) {

    const tbody =
        document.getElementById(
            "transactionTableBody"
        );

    if (!items.length) {

        tbody.innerHTML = `
            <tr>
                <td colspan="13"
                    class="text-center text-muted py-4">
                    No inventory transactions found.
                </td>
            </tr>
        `;

        return;
    }


    tbody.innerHTML =
        items.map(x => {

            const isOut =
                x.movement === "OUT";

            const movementBadge =
                isOut
                    ? `<span class="badge bg-danger">OUT</span>`
                    : `<span class="badge bg-success">IN</span>`;

            const transactionDate =
                splitDateTime(
                    x.transactionDate
                );

            const qty =
                isOut
                    ? x.quantityOut
                    : x.quantityIn;

            const remarks =
                x.remarks || "-";

            return `
                <tr>

                    <!-- MATERIAL -->
                    <td>
                        <div class="fw-semibold">
                            ${escapeHtml(
                x.materialName || ""
            )}
                        </div>

                        <div class="small text-muted">
                            ${escapeHtml(
                x.materialCode || ""
            )}
                        </div>
                    </td>


                    <!-- LOT -->
                    <td>
                        ${escapeHtml(
                x.lotDisplay ||
                x.lotNo ||
                "-"
            )}
                    </td>


                    <!-- DATE -->
                    <td>
                        ${escapeHtml(
                transactionDate.date
            )}
                    </td>


                    <!-- TIME -->
                    <td>
                        ${escapeHtml(
                transactionDate.time
            )}
                    </td>


                    <!-- WAREHOUSE -->
                    <td>
                        <div>
                            ${escapeHtml(
                x.branchName ||
                x.branchId ||
                "-"
            )}
                        </div>

                        <div class="small text-muted">
                            ${escapeHtml(
                x.branchId || ""
            )}
                        </div>
                    </td>


                    <!-- TYPE -->
                    <td>
                        ${movementBadge}

                        <div class="small text-muted mt-1">
                            ${formatTransactionType(
                x.transactionType
            )}
                        </div>
                    </td>


                    <!-- QTY -->
                    <td class="text-end fw-semibold
                               ${isOut
                    ? "text-danger"
                    : "text-success"}">
                        ${formatQty(qty || 0)}
                    </td>


                    <!-- UOM -->
                    <td>
                        ${escapeHtml(
                        x.uom || ""
                    )}
                    </td>


                 


                    <!-- USER -->
                    <td>
                        ${escapeHtml(
                        x.encodedBy || "-"
                    )}
                    </td>


                    <!-- REFERENCE -->
                    <td>
                        <div class="fw-semibold">
                            ${escapeHtml(
                        x.referenceNo || "-"
                    )}
                        </div>

                        <div class="small text-muted">
                            ${escapeHtml(
                        x.referenceType || ""
                    )}
                        </div>
                    </td>


                    <!-- REMARKS -->
                    <td>
                        <div class="transaction-remarks"
                             title="${escapeHtml(remarks)}">
                            ${escapeHtml(remarks)}
                        </div>
                    </td>


                    <!-- ACTION -->
                    <td>
                        <button type="button"
                                class="btn btn-sm btn-outline-primary"
                                onclick="viewTransaction(${x.transactionId})">
                            View
                        </button>
                    </td>

                </tr>
            `;

        }).join("");
}


function viewTransaction(transactionId) {

    console.log(
        "Transaction ID:",
        transactionId
    );
}


function splitDateTime(value) {

    if (!value) {
        return {
            date: "-",
            time: "-"
        };
    }

    // If API sends UTC without Z, treat it as UTC.
    let normalizedValue = value;

    if (
        typeof normalizedValue === "string" &&
        !normalizedValue.endsWith("Z") &&
        !/[+-]\d{2}:\d{2}$/.test(normalizedValue)
    ) {
        normalizedValue += "Z";
    }

    const date = new Date(normalizedValue);

    if (Number.isNaN(date.getTime())) {
        return {
            date: "-",
            time: "-"
        };
    }

    return {
        date: date.toLocaleDateString(
            "en-PH",
            {
                timeZone: "Asia/Manila",
                year: "numeric",
                month: "long",
                day: "numeric"
            }
        ),

        time: date.toLocaleTimeString(
            "en-PH",
            {
                timeZone: "Asia/Manila",
                hour: "numeric",
                minute: "2-digit",
                second: "2-digit",
                hour12: true
            }
        )
    };
}

function loadBranchOptions(items) {

    const select =
        document.getElementById(
            "branchFilter"
        );

    if (!select)
        return;

    const selected =
        select.value;

    const branches =
        new Map();

    items.forEach(x => {

        if (!x.branchId)
            return;

        branches.set(
            x.branchId,
            x.branchName ||
            x.branchId
        );
    });


    const existing =
        Array.from(
            select.options
        )
            .map(x => x.value)
            .filter(Boolean);


    branches.forEach(
        (name, id) => {

            if (existing.includes(id))
                return;

            const option =
                document.createElement(
                    "option"
                );

            option.value = id;
            option.textContent = name;

            select.appendChild(option);
        });


    select.value = selected;
}


function clearFilters() {

    document.getElementById(
        "transactionSearch"
    ).value = "";

    document.getElementById(
        "branchFilter"
    ).value = "";

    document.getElementById(
        "movementFilter"
    ).value = "";

    document.getElementById(
        "transactionTypeFilter"
    ).value = "";

    document.getElementById(
        "fromDate"
    ).value = "";

    document.getElementById(
        "toDate"
    ).value = "";

    loadTransactions();
}


function formatTransactionType(value) {

    if (!value)
        return "-";

    switch (
    value.toUpperCase()
    ) {

        case "MATERIAL_PURCHASE_RECEIPT":
            return "Purchase Receipt";

        case "OPENING_BALANCE":
            return "Opening Balance";

        case "MANUAL_IN":
            return "Manual Stock In";

        case "ADJUSTMENT_IN":
            return "Adjustment In";

        case "MATERIAL_ISSUE":
            return "Material Issue";

        case "ADJUSTMENT_OUT":
            return "Adjustment Out";

        default:
            return value
                .replaceAll("_", " ")
                .toLowerCase()
                .replace(
                    /\b\w/g,
                    c => c.toUpperCase()
                );
    }
}


function formatQty(value) {

    const number =
        Number(value || 0);

    return number.toLocaleString(
        undefined,
        {
            minimumFractionDigits: 0,
            maximumFractionDigits: 4
        }
    );
}


function formatNumber(value) {

    return Number(
        value || 0
    ).toLocaleString();
}


function formatDateTime(value) {

    if (!value)
        return "-";

    let utcValue = value;

    if (
        typeof utcValue === "string" &&
        !utcValue.endsWith("Z") &&
        !/[+-]\d{2}:\d{2}$/.test(utcValue)
    ) {
        utcValue += "Z";
    }

    const date =
        new Date(utcValue);

    if (Number.isNaN(date.getTime()))
        return "-";

    return date.toLocaleString(
        "en-PH",
        {
            timeZone: "Asia/Manila",
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
            second: "2-digit",
            hour12: true
        }
    );
}


function escapeHtml(value) {

    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}