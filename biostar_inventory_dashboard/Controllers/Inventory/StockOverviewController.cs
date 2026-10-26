using biostar_inventory_dashboard.Models;
using biostar_inventory_dashboard.Services;
using Microsoft.AspNetCore.Mvc;

namespace biostar_inventory_dashboard.Controllers.Inventory
{
    [Route("Inventory/StockOverview")]
    public class StockOverviewController : Controller
    {
        private readonly ApiService _apiService;

        public StockOverviewController(ApiService apiService)
        {
            _apiService = apiService;
        }

        [HttpGet]
        public IActionResult Index(
     string productId = "",
     string search = "")
        {
            ViewBag.ProductId = productId;
            ViewBag.Search = search;

            return View();
        }

        [HttpGet("GetData")]
        public async Task<IActionResult> GetData(
     int page = 1,
     int pageSize = 25,
     string search = "",
     string warehouse = "",
     string categories = "",
     string stockStatus = "",
     string order = "asc")
        {
            try
            {
                var result = await _apiService.GetStockOverviewAsync(
                    page,
                    pageSize,
                    search,
                    warehouse,
                    categories,
                    stockStatus,
                    order
                );

                return Json(new
                {
                    success = true,
                    data = result.Data,
                    page = result.Page,
                    pageSize = result.PageSize,
                    total = result.Total,
                    totalPages = result.TotalPages
                });
            }
            catch (Exception ex)
            {
                return Json(new
                {
                    success = false,
                    message = ex.Message,
                    data = Array.Empty<object>(),
                    page = 1,
                    pageSize,
                    total = 0,
                    totalPages = 0
                });
            }
        }






        [HttpGet("DailyPrint")]
        public async Task<IActionResult> DailyPrint(
            DateTime fromDate,
            DateTime toDate,
            string warehouse = "",
            string categories = "")
        {
            if (fromDate == default || toDate == default)
                return BadRequest("Please select both dates.");

            if (fromDate.Date > toDate.Date)
                return BadRequest("Invalid date range.");

            try
            {
                var report = await _apiService.GetDailyInventoryPrintAsync(
                    fromDate,
                    toDate,
                    warehouse
                );

                if (report == null)
                    return StatusCode(502, "The inventory API returned no report.");

                if (!string.IsNullOrWhiteSpace(categories))
                {
                    var selectedCategories = categories
                        .Split('|', StringSplitOptions.RemoveEmptyEntries)
                        .Select(x => x.Trim())
                        .ToHashSet(StringComparer.OrdinalIgnoreCase);

                    report.Data = report.Data
                        .Where(x => selectedCategories.Contains(
                            x.CategoryName?.Trim() ?? ""))
                        .ToList();
                }

                ViewBag.SelectedCategories = categories;

                return View(report);
            }
            catch (Exception ex)
            {
                return StatusCode(
                    500,
                    $"Unable to load Daily Inventory Print: {ex.Message}"
                );
            }
        }




    }
}