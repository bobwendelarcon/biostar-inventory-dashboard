using biostar_inventory_dashboard.Services;
using Microsoft.AspNetCore.Mvc;
using System.Text.Json;

namespace biostar_inventory_dashboard.Controllers
{
    public class ProductToProduceController : Controller
    {
        private readonly ApiService _apiService;

        public ProductToProduceController(ApiService apiService)
        {
            _apiService = apiService;
        }

        public IActionResult Index()
        {
            ViewBag.CurrentUser =
                User.Claims.FirstOrDefault(c => c.Type == "full_name")?.Value
                ?? User.Identity?.Name
                ?? "admin";

            return View();
        }

        [HttpGet]
        public async Task<IActionResult> GetPlanningShortages()
        {
            var result = await _apiService.GetPlanningShortagesAsync();
            return Content(result, "application/json");
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] JsonElement data)
        {
            var result = await _apiService.CreateProductToProduceAsync(data.GetRawText());
            return Content(result, "application/json");
        }

        [HttpGet]
        public async Task<IActionResult> GetById(long id)
        {
            var result = await _apiService.GetProductToProduceByIdAsync(id);
            return Content(result, "application/json");
        }
    }
}