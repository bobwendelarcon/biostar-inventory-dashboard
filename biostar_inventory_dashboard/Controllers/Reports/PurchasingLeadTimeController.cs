using biostar_inventory_dashboard.Services;
using Microsoft.AspNetCore.Mvc;

namespace biostar_inventory_dashboard.Controllers.Reports
{
    [Route("reports/purchasing-lead-time")]
    public class PurchasingLeadTimeController : Controller
    {
        private readonly ApiService _apiService;

        public PurchasingLeadTimeController(
            ApiService apiService)
        {
            _apiService = apiService;
        }


        [HttpGet("")]
        public IActionResult Index()
        {
            return View(
                "~/Views/Reports/PurchasingLeadTime/Index.cshtml"
            );
        }


        [HttpGet("data")]
        public async Task<IActionResult> GetData()
        {
            try
            {
                var result =
                    await _apiService
                        .GetPurchasingLeadTimeReportAsync();

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