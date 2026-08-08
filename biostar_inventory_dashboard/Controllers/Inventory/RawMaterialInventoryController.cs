using biostar_inventory_dashboard.Models.Inventory;
using biostar_inventory_dashboard.Services;
using Microsoft.AspNetCore.Mvc;

namespace biostar_inventory_dashboard.Controllers.Inventory
{
    [Route("inventory/raw-materials")]
    public class RawMaterialInventoryController : Controller
    {
        private readonly ApiService _apiService;

        public RawMaterialInventoryController(ApiService apiService)
        {
            _apiService = apiService;
        }

        [HttpGet("")]
        public IActionResult Index()
        {
            return View(new RawMaterialInventoryViewModel());
        }

        [HttpGet("data")]
        public async Task<IActionResult> GetData(
            string search = "",
            string branchId = "",
            int? categoryId = null,
            string stockStatus = "",
            string expiryStatus = "",
            string fromDate = "",
            string toDate = "")
        {
            try
            {
                var result =
                    await _apiService.GetRawMaterialInventoryAsync(
                        search,
                        branchId,
                        categoryId,
                        stockStatus,
                        expiryStatus,
                        fromDate,
                        toDate);

                return Content(result, "application/json");
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = ex.Message
                });
            }
        }


        [HttpGet("{materialLotId:int}/transactions")]
        public async Task<IActionResult> GetTransactions(int materialLotId)
        {
            try
            {
                var result =
                    await _apiService
                        .GetRawMaterialInventoryTransactionsAsync(
                            materialLotId);

                return Content(result, "application/json");
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = ex.Message
                });
            }
        }
    }
}