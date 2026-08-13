using biostar_inventory_dashboard.Models.Inventory;
using biostar_inventory_dashboard.Services;
using Microsoft.AspNetCore.Mvc;
using System.Text.Json;

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



        [HttpGet("branches")]
        public async Task<IActionResult> GetBranches()
        {
            try
            {
                var result =
                    await _apiService.GetBranchesAsync();

                return Json(result);
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

        [HttpGet("suppliers/{materialId:int}")]
        public async Task<IActionResult> GetSuppliers(
     int materialId)
        {
            try
            {
                var result =
                    await _apiService
                        .GetPurchasingSuppliersByMaterialAsync(
                            materialId);

                return Content(
                    result,
                    "application/json");
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



        [HttpPost("manual-stock-in")]
        public async Task<IActionResult> ManualStockIn(
      [FromBody] JsonElement request)
        {
            try
            {
                var userId =
                    User.Claims
                        .FirstOrDefault(
                            c => c.Type == "user_id")
                        ?.Value
                    ??
                    User.Claims
                        .FirstOrDefault(
                            c => c.Type == "UserId")
                        ?.Value
                    ??
                    User.Identity?.Name
                    ??
                    "";

                var data =
                    JsonSerializer.Deserialize<
                        Dictionary<string, object?>>(
                            request.GetRawText())
                    ??
                    new Dictionary<string, object?>();

                data["encodedBy"] =
                    userId;

                var json =
                    JsonSerializer.Serialize(data);

                var result =
                    await _apiService
                        .ManualRawMaterialStockInAsync(
                            json);

                return Content(
                    result,
                    "application/json");
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