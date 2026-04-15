using biostar_inventory_dashboard.Services;
using Microsoft.AspNetCore.Mvc;
using System.Text.Json;

namespace biostar_inventory_dashboard.Controllers
{
    public class InventoryController : Controller
    {
        private readonly ApiService _apiService;

        public InventoryController(ApiService apiService)
        {
            _apiService = apiService;
        }

        public IActionResult Index()
        {
            return View();
        }

        [HttpPost]
        public async Task<IActionResult> Transfer([FromBody] JsonElement data)
        {
            try
            {
                var result = await _apiService.TransferAsync(data.GetRawText());
                return Content(result, "application/json");
            }
            catch (Exception ex)
            {
                return StatusCode(500, ex.Message);
            }
        }

        [HttpGet]
        public async Task<IActionResult> GetBranches()
        {
            try
            {
                var branches = await _apiService.GetBranchesAsync();
                return Json(branches);
            }
            catch (Exception ex)
            {
                return StatusCode(500, ex.Message);
            }
        }

        [HttpGet]
        public async Task<IActionResult> GetInventory(
            int page = 1,
            int pageSize = 30,
            string lot_no = "",
            string product = "",
            string warehouse = "",
            string stockStatus = "",
            string expiryStatus = "",
            string months = "",
            string from = "",
            string to = "",
            string order = "desc"
        )
        {
            var items = await _apiService.GetInventoryAsync(
                page,
                pageSize,
                lot_no,
                product,
                warehouse,
                stockStatus,
                expiryStatus,
                months,
                from,
                to,
                order
            );

            return Json(items);
        }
    }
}