using biostar_inventory_dashboard.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace biostar_inventory_dashboard.Controllers
{
    [Authorize]
    public class DashboardController : Controller
    {
        private readonly ApiService _apiService;

        public DashboardController(ApiService apiService)
        {
            _apiService = apiService;
        }

        public async Task<IActionResult> Index()
        {
            var model = await _apiService.GetDashboardAsync();
            return View(model);
        }
        [HttpGet]
        public async Task<IActionResult> GetDashboardData()
        {
            var data = await _apiService.GetDashboardAsync();
            return Json(data);
        }
    }
}