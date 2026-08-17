using biostar_inventory_dashboard.Services;
using Microsoft.AspNetCore.Mvc;

namespace biostar_inventory_dashboard.Controllers.Inventory
{
    [Route("inventory/raw-material-summary")]
    public class RawMaterialSummaryController
        : Controller
    {
        private readonly ApiService _apiService;

        public RawMaterialSummaryController(
            ApiService apiService)
        {
            _apiService = apiService;
        }


        // =========================================
        // PAGE
        // =========================================

        [HttpGet("")]
        public IActionResult Index()
        {
            return View(
                "~/Views/Inventory/RawMaterialSummary/Index.cshtml"
            );
        }


        // =========================================
        // DATA
        // =========================================

        [HttpGet("data")]
        public async Task<IActionResult> GetData(
            string search = "",
            string branchId = "",
            int? categoryId = null,
            int? subCategoryId = null,
            string stockStatus = "")
        {
            try
            {
                var result =
                    await _apiService
                        .GetConsolidatedRawMaterialInventoryAsync(
                            search,
                            branchId,
                            categoryId,
                            subCategoryId,
                            stockStatus);

                return Content(
                    result,
                    "application/json");
            }
            catch (Exception ex)
            {
                return StatusCode(
                    500,
                    new
                    {
                        success = false,
                        message = ex.Message
                    });
            }
        }
    }
}