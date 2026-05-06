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

            ViewBag.CurrentRole =
                User.FindFirst("role_name")?.Value
                ?? User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value
                ?? "";

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

        [HttpGet]
        public async Task<IActionResult> List(
    int page = 1,
    int pageSize = 50,
    string status = "ACTIVE",
    string search = "")
        {
            var result = await _apiService.GetProductToProduceListAsync(page, pageSize, status, search);
            return Content(result, "application/json");
        }

        [HttpDelete]
        public async Task<IActionResult> DeleteLine(long ptpLineId)
        {
            var result = await _apiService.DeleteProductToProduceLineAsync(ptpLineId);
            return Content(result, "application/json");
        }

        [HttpPost]
        public async Task<IActionResult> StartLine(long ptpLineId)
        {
            var result = await _apiService.StartProductToProduceLineAsync(ptpLineId);
            return Content(result, "application/json");
        }

        [HttpPost]
        public async Task<IActionResult> Produce([FromBody] JsonElement data)
        {
            var currentUser =
                User.Claims.FirstOrDefault(c => c.Type == "full_name")?.Value
                ?? User.Identity?.Name
                ?? "production";

            using var doc = JsonDocument.Parse(data.GetRawText());

            var payload = JsonSerializer.Deserialize<Dictionary<string, object?>>(
                data.GetRawText()
            ) ?? new Dictionary<string, object?>();

            payload["producedBy"] = currentUser;

            var finalJson = JsonSerializer.Serialize(payload);

            var result = await _apiService.ProduceStockAsync(finalJson);
            return Content(result, "application/json");
        }
    }
}