using biostar_inventory_dashboard.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace biostar_inventory_dashboard.Controllers.Reports
{
    [Authorize]
    [Route("reports/raw-material-forecast")]
    public class RawMaterialForecastController : Controller
    {
        private readonly ApiService _apiService;

        public RawMaterialForecastController(
            ApiService apiService)
        {
            _apiService = apiService;
        }

        [HttpGet("")]
        public IActionResult Index()
        {
            return View(
                "~/Views/Reports/RawMaterialForecast/Index.cshtml"
            );
        }

        [HttpGet("data")]
        public async Task<IActionResult> GetData(
            string? branchId = null,
            int? materialId = null,
            int? categoryId = null,
            string? search = null,
            int usageHistoryDays = 30,
            int safetyStockDays = 14,
            int targetCoverDays = 60,
            string? status = null)
        {
            try
            {
                var result =
                    await _apiService
                        .GetRawMaterialForecastReportAsync(
                            branchId,
                            materialId,
                            categoryId,
                            search,
                            usageHistoryDays,
                            safetyStockDays,
                            targetCoverDays,
                            status
                        );

                return Content(
                    result,
                    "application/json"
                );
            }
            catch (Exception ex)
            {
                return StatusCode(
                    500,
                    new
                    {
                        success = false,
                        message =
                            "Failed to load Raw Material Forecast / Reorder report.",
                        error = ex.Message
                    }
                );
            }
        }
    }
}