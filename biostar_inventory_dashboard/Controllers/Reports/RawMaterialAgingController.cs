using biostar_inventory_dashboard.Services;
using Microsoft.AspNetCore.Mvc;

namespace biostar_inventory_dashboard.Controllers.Reports
{
    [Route("reports/raw-material-aging")]
    public class RawMaterialAgingController : Controller
    {
        private readonly ApiService _apiService;

        public RawMaterialAgingController(
            ApiService apiService)
        {
            _apiService = apiService;
        }


        [HttpGet("")]
        public IActionResult Index()
        {
            return View(
                "~/Views/Reports/RawMaterialAging/Index.cshtml"
            );
        }


        [HttpGet("data")]
        public async Task<IActionResult> GetData(
            [FromQuery] string? branchId = null,
            [FromQuery] int? categoryId = null,
            [FromQuery] string? search = null,
            [FromQuery] string? movementStatus = null,
            [FromQuery] int? minimumDaysIdle = null,
            [FromQuery] int? maximumDaysIdle = null)
        {
            try
            {
                var result =
                    await _apiService
                        .GetRawMaterialAgingReportAsync(
                            branchId,
                            categoryId,
                            search,
                            movementStatus,
                            minimumDaysIdle,
                            maximumDaysIdle
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