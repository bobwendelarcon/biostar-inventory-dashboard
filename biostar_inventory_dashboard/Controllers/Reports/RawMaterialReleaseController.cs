using biostar_inventory_dashboard.Services;
using Microsoft.AspNetCore.Mvc;

namespace biostar_inventory_dashboard.Controllers.Reports
{
    [Route("reports/raw-material-release")]
    public class RawMaterialReleaseController : Controller
    {
        private readonly ApiService _apiService;

        public RawMaterialReleaseController(
            ApiService apiService)
        {
            _apiService = apiService;
        }


        [HttpGet("")]
        public IActionResult Index()
        {
            return View(
                "~/Views/Reports/RawMaterialRelease/Index.cshtml"
            );
        }


        [HttpGet("data")]
        public async Task<IActionResult> GetData(
            [FromQuery] DateTime? fromDate = null,
            [FromQuery] DateTime? toDate = null,
            [FromQuery] string? branchId = null,
            [FromQuery] int? materialId = null,
            [FromQuery] string? search = null)
        {
            try
            {
                var result =
                    await _apiService
                        .GetRawMaterialReleaseReportAsync(
                            fromDate,
                            toDate,
                            branchId,
                            materialId,
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