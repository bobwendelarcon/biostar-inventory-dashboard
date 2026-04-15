<script>
    document.addEventListener("DOMContentLoaded", function () {
    const sidebar = document.getElementById("desktopSidebar");
    const toggleBtn = document.getElementById("sidebarToggleBtn");
    const mainContent = document.querySelector(".main-content");

    if (!sidebar || !toggleBtn) return;

    const savedState = localStorage.getItem("sidebarState");

    if (savedState === "collapsed") {
        sidebar.classList.add("collapsed");
    mainContent?.classList.add("sidebar-collapsed");
    } else {
        sidebar.classList.remove("collapsed");
    mainContent?.classList.remove("sidebar-collapsed");
    }

    toggleBtn.addEventListener("click", function (e) {
        e.preventDefault();
    e.stopPropagation();

    sidebar.classList.toggle("collapsed");

    const isCollapsed = sidebar.classList.contains("collapsed");

    if (isCollapsed) {
        mainContent?.classList.add("sidebar-collapsed");
    localStorage.setItem("sidebarState", "collapsed");
        } else {
        mainContent?.classList.remove("sidebar-collapsed");
    localStorage.setItem("sidebarState", "expanded");
        }
    });
});
</script>