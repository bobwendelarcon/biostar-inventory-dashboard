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





    }
}