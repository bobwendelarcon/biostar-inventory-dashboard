using biostar_inventory_dashboard.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace biostar_inventory_dashboard.Controllers
{
    [Authorize(Roles = "ADMIN,STAFF")]
    public class ReportsController : Controller
    {
        private readonly ApiService _apiService;

        public ReportsController(ApiService apiService)
        {
            _apiService = apiService;
        }

        public IActionResult Index()
        {
            return View();
        }

        [HttpGet]
        public async Task<IActionResult> DeliveryKpi(
            DateTime? dateFrom,
            DateTime? dateTo,
            string? customerId,
            string? routeName,
            string? region)
        {
            var query = BuildQuery(new Dictionary<string, string?>
            {
                ["dateFrom"] = dateFrom?.ToString("yyyy-MM-dd"),
                ["dateTo"] = dateTo?.ToString("yyyy-MM-dd"),
                ["customerId"] = customerId,
                ["routeName"] = routeName,
                ["region"] = region
            });

            var result = await _apiService.GetAsync<object>($"api/Reports/delivery-kpi{query}");
            return Json(result);
        }

        [HttpGet]
        public async Task<IActionResult> NearExpiry(
            string? branchId,
            string? productId,
            string? expiryStatus,
            int? monthsLeft)
        {
            var query = BuildQuery(new Dictionary<string, string?>
            {
                ["branchId"] = branchId,
                ["productId"] = productId,
                ["expiryStatus"] = expiryStatus,
                ["monthsLeft"] = monthsLeft?.ToString()
            });

            var result = await _apiService.GetAsync<object>($"api/Reports/near-expiry{query}");
            return Json(result);
        }

        [HttpGet]
        public async Task<IActionResult> Returns(
            DateTime? dateFrom,
            DateTime? dateTo,
            string? customerId)
        {
            var query = BuildQuery(new Dictionary<string, string?>
            {
                ["dateFrom"] = dateFrom?.ToString("yyyy-MM-dd"),
                ["dateTo"] = dateTo?.ToString("yyyy-MM-dd"),
                ["customerId"] = customerId
            });

            var result = await _apiService.GetAsync<object>($"api/Reports/returns{query}");
            return Json(result);
        }

        [HttpGet]
        public async Task<IActionResult> Inventory(
            string? branchId,
            string? productId,
            string? expiryStatus,
            string? stockStatus)
        {
            var query = BuildQuery(new Dictionary<string, string?>
            {
                ["branchId"] = branchId,
                ["productId"] = productId,
                ["expiryStatus"] = expiryStatus,
                ["stockStatus"] = stockStatus
            });

            var result = await _apiService.GetAsync<object>($"api/Reports/inventory{query}");
            return Json(result);
        }

        [HttpGet]
        public async Task<IActionResult> Branches()
        {
            var result = await _apiService.GetAsync<object>("api/Branches");
            return Json(result);
        }

        [HttpGet]
        public async Task<IActionResult> Products()
        {
            var result = await _apiService.GetAsync<object>("api/Products");
            return Json(result);
        }

        [HttpGet]
        public async Task<IActionResult> Customers()
        {
            var result = await _apiService.GetAsync<object>("api/Partners");
            return Json(result);
        }

        private static string BuildQuery(Dictionary<string, string?> values)
        {
            var query = values
                .Where(x => !string.IsNullOrWhiteSpace(x.Value))
                .Select(x => $"{Uri.EscapeDataString(x.Key)}={Uri.EscapeDataString(x.Value!)}");

            var finalQuery = string.Join("&", query);

            return string.IsNullOrWhiteSpace(finalQuery)
                ? ""
                : "?" + finalQuery;
        }
    }
}