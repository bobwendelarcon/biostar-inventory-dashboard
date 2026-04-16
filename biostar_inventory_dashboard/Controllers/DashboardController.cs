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

        public IActionResult Index()
        {
            return View();
        }

        //[HttpGet]
        //public async Task<IActionResult> GetInventory()
        //{
        //    var items = await _apiService.GetInventoryAsync();
        //    return Json(items);
        //}
    }
}