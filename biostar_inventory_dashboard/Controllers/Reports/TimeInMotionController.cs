using biostar_inventory_dashboard.Services;
using Microsoft.AspNetCore.Mvc;

namespace biostar_inventory_dashboard.Controllers.Reports
{
    [Route("reports/time-in-motion")]
    public class TimeInMotionController : Controller
    {
        private readonly ApiService _apiService;

        public TimeInMotionController(
            ApiService apiService)
        {
            _apiService = apiService;
        }


        [HttpGet("")]
        public IActionResult Index()
        {
            return View(
                "~/Views/Reports/TimeInMotion/Index.cshtml"
            );
        }


        [HttpGet("data")]
        public async Task<IActionResult> GetData()
        {
            try
            {
                var result =
                    await _apiService
                        .GetTimeInMotionReportAsync();

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