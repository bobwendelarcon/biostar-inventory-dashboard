using biostar_inventory_dashboard.Services;
using Microsoft.AspNetCore.Mvc;

namespace biostar_inventory_dashboard.Controllers.Reports
{
    [Route("reports/raw-material-usage-trend")]
    public class RawMaterialUsageTrendController : Controller
    {
        private readonly ApiService _apiService;

        public RawMaterialUsageTrendController(
            ApiService apiService)
        {
            _apiService = apiService;
        }


        [HttpGet("")]
        public IActionResult Index()
        {
            return View(
                "~/Views/Reports/RawMaterialUsageTrend/Index.cshtml"
            );
        }


        [HttpGet("data")]
        public async Task<IActionResult> GetData(
            DateTime? fromDate = null,
            DateTime? toDate = null,
            string? branchId = null,
            int? materialId = null,
            int? categoryId = null,
            string? search = null)
        {
            try
            {
                var result =
                    await _apiService
                        .GetRawMaterialUsageTrendReportAsync(
                            fromDate,
                            toDate,
                            branchId,
                            materialId,
                            categoryId,
                            search
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
                        message = ex.Message
                    }
                );
            }
        }
    }
}