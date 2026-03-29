using Microsoft.AspNetCore.Mvc;
using biostar_inventory_dashboard.Services;

namespace biostar_inventory_dashboard.Controllers
{
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