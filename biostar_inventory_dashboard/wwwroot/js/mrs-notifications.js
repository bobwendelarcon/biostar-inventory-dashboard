
(function () {
    "use strict";

    const REFRESH_INTERVAL = 30000;

    let isLoading = false;
    let refreshTimer = null;

    function updateBadges(count, tooltip = "") {

        const badgeIds = [
            "rawMaterialMrsBadge",
            "materialRequisitionBadge"
        ];

        badgeIds.forEach(id => {

            const badge = document.getElementById(id);

            if (!badge)
                return;

            badge.textContent = count;
            badge.title = tooltip;

            badge.style.display =
                count > 0 ? "inline-block" : "none";
        });
    }

    async function loadMrsNotifications() {

        if (isLoading || document.hidden)
            return;

        isLoading = true;

        try {

            const response = await fetch(
                "/inventory/material-requisitions/notification-counts",
                {
                    method: "GET",
                    cache: "no-store",
                    credentials: "same-origin",
                    headers: {
                        "Accept": "application/json"
                    }
                }
            );

            // Stop polling when session or access is invalid.
            if (response.status === 401 ||
                response.status === 403 ||
                response.redirected) {

                updateBadges(0);
                stopPolling();
                return;
            }

            if (!response.ok)
                throw new Error(
                    `HTTP ${response.status}`
                );

            const data = await response.json();

            const allocation = Number(data.pendingAllocation);
            const staff = Number(data.pendingStaffApproval);
            const head = Number(data.pendingHeadApproval);
            const total = Number(data.totalPending);

            const counts = [
                allocation,
                staff,
                head,
                total
            ];

            if (!counts.every(value =>
                Number.isSafeInteger(value) && value >= 0
            ) || total !== allocation + staff + head) {

                throw new Error(
                    "Invalid MRS notification response."
                );
            }

            const tooltip =
                `Pending Allocation: ${allocation}\n` +
                `Pending Staff Approval: ${staff}\n` +
                `Pending Head Approval: ${head}\n` +
                `Total Pending: ${total}`;

            updateBadges(total, tooltip);

        } catch (error) {

            console.warn(
                "Unable to load MRS notifications:",
                error
            );

            // Hide unavailable counts instead of
            // displaying outdated information.
            updateBadges(0);

        } finally {

            isLoading = false;
        }
    }

    function stopPolling() {

        if (refreshTimer !== null) {

            clearInterval(refreshTimer);
            refreshTimer = null;
        }
    }


    function bindBadgeNavigation() {

        const badgeIds = [
            "rawMaterialMrsBadge",
            "materialRequisitionBadge"
        ];

        badgeIds.forEach(function (id) {

            const badge = document.getElementById(id);

            if (!badge) {
                return;
            }

            badge.style.cursor = "pointer";

            badge.addEventListener("click", function (event) {

                event.preventDefault();
                event.stopPropagation();

                window.location.href =
                    "/inventory/material-requisitions?filter=PENDING_MY_ACTION";
            });
        });
    }


    function initializeMrsNotifications() {

        const parentBadge =
            document.getElementById("rawMaterialMrsBadge");

        const childBadge =
            document.getElementById("materialRequisitionBadge");

        // Do not send requests if the user
        // cannot access the MRS module.
        if (!parentBadge && !childBadge)
            return;

        if (refreshTimer !== null)
            return;

        // Enable clickable notification badges.
        bindBadgeNavigation();

        // Load notification counts immediately.
        loadMrsNotifications();

        refreshTimer = setInterval(
            loadMrsNotifications,
            REFRESH_INTERVAL
        );


        // Refresh immediately when the user
        // returns to the browser tab.
        document.addEventListener(
            "visibilitychange",
            function () {

                if (!document.hidden &&
                    refreshTimer !== null) {

                    loadMrsNotifications();
                }
            }
        );
    }

    if (document.readyState === "loading") {

        document.addEventListener(
            "DOMContentLoaded",
            initializeMrsNotifications
        );

    } else {

        initializeMrsNotifications();
    }

})();
