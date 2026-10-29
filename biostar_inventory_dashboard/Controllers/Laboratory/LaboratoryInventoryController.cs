
using biostar_inventory_dashboard.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Text.Json.Nodes;
using System.Threading.Tasks;

namespace biostar_inventory_dashboard.Controllers
{
    [Authorize]
    [Route("LaboratoryInventory")]
    public class LaboratoryInventoryController : Controller
    {
        private readonly ApiService _apiService;

        public LaboratoryInventoryController(ApiService apiService)
        {
            _apiService = apiService;
        }

        // =====================================================
        // PAGES
        // =====================================================

        [Authorize(Policy = "LAB_INVENTORY_LIST")]
        [HttpGet("")]
        [HttpGet("Index")]
        public IActionResult Index()
        {
            return View();
        }

        [Authorize(Policy = "LAB_INVENTORY_TRANSACTIONS")]
        [HttpGet("Transactions")]
        public IActionResult Transactions()
        {
            return View();
        }

        // =====================================================
        // MASTER DATA
        // =====================================================
        [Authorize(Policy = "LAB_INVENTORY_ANY")]
        [HttpGet("GetCategories")]
        public async Task<IActionResult> GetCategories()
        {
            return await GetJsonAsync(
                () => _apiService.GetLaboratoryCategoriesAsync());
        }
        [Authorize(Policy = "LAB_INVENTORY_LIST")]
        [HttpPost("SaveCategory")]
        public async Task<IActionResult> SaveCategory(
            [FromBody] System.Text.Json.JsonElement data)
        {
            return await GetJsonAsync(
                () => _apiService.SaveLaboratoryCategoryAsync(
                    data.GetRawText()));
        }
        [Authorize(Policy = "LAB_INVENTORY_ANY")]
        [HttpGet("GetBrands")]
        public async Task<IActionResult> GetBrands()
        {
            return await GetJsonAsync(
                () => _apiService.GetLaboratoryBrandsAsync());
        }
        [Authorize(Policy = "LAB_INVENTORY_LIST")]
        [HttpPost("SaveBrand")]
        public async Task<IActionResult> SaveBrand(
            [FromBody] System.Text.Json.JsonElement data)
        {
            return await GetJsonAsync(
                () => _apiService.SaveLaboratoryBrandAsync(
                    data.GetRawText()));
        }
        [Authorize(Policy = "LAB_INVENTORY_ANY")]
        [HttpGet("GetLocations")]
        public async Task<IActionResult> GetLocations()
        {
            return await GetJsonAsync(
                () => _apiService.GetLaboratoryLocationsAsync());
        }
        [Authorize(Policy = "LAB_INVENTORY_LIST")]
        [HttpPost("SaveLocation")]
        public async Task<IActionResult> SaveLocation(
            [FromBody] System.Text.Json.JsonElement data)
        {
            return await GetJsonAsync(
                () => _apiService.SaveLaboratoryLocationAsync(
                    data.GetRawText()));
        }

        // =====================================================
        // ITEMS
        // =====================================================
        [Authorize(Policy = "LAB_INVENTORY_LIST")]
        [HttpGet("GetItems")]
        public async Task<IActionResult> GetItems(string search = "")
        {
            return await GetJsonAsync(
                () => _apiService.GetLaboratoryItemsAsync(search));
        }
        [Authorize(Policy = "LAB_INVENTORY_LIST")]
        [HttpPost("SaveItem")]
        public async Task<IActionResult> SaveItem(
            [FromBody] System.Text.Json.JsonElement data)
        {
            return await GetJsonAsync(
                () => _apiService.SaveLaboratoryItemAsync(
                    data.GetRawText()));
        }


        // =====================================================
        // DELETE LABORATORY ITEM (SOFT DELETE)
        // =====================================================

        [Authorize(Policy = "LAB_INVENTORY_LIST")]
        [HttpPost("DeleteItem/{itemId:long}")]
        public async Task<IActionResult> DeleteItem(long itemId)
        {
            return await GetJsonAsync(
                () => _apiService.DeactivateLaboratoryItemAsync(itemId));
        }


        [HttpGet("Items")]
        [Authorize(Policy = "LAB_INVENTORY_LIST")]
        public IActionResult Items()
        {
            return View();
        }

        // =====================================================
        // INVENTORY
        // =====================================================
        [Authorize(Policy = "LAB_INVENTORY_LIST")]
        [HttpGet("GetInventory")]
        public async Task<IActionResult> GetInventory(
            string search = "",
            long? categoryId = null,
            long? brandId = null,
            long? locationId = null,
            string stockStatus = "")
        {
            return await GetJsonAsync(
                () => _apiService.GetLaboratoryInventoryAsync(
                    search,
                    categoryId,
                    brandId,
                    locationId,
                    stockStatus));
        }
        [Authorize(Policy = "LAB_INVENTORY_LIST")]
        [HttpPost("CreateInventory")]
        public async Task<IActionResult> CreateInventory(
            [FromBody] System.Text.Json.JsonElement data)
        {
            return await GetJsonAsync(
                () => _apiService.CreateLaboratoryInventoryAsync(
                    data.GetRawText()));
        }
        [Authorize(Policy = "LAB_INVENTORY_LIST")]
        [HttpPut("UpdateInventoryDetails/{inventoryId:long}")]
        public async Task<IActionResult> UpdateInventoryDetails(
            long inventoryId,
            [FromBody] System.Text.Json.JsonElement data)
        {
            return await GetJsonAsync(
                () => _apiService.UpdateLaboratoryInventoryDetailsAsync(
                    inventoryId,
                    data.GetRawText()));
        }

        // =====================================================
        // STOCK MOVEMENTS
        // =====================================================
        [Authorize(Policy = "LAB_INVENTORY_LIST")]
        [HttpPost("StockIn")]
        public async Task<IActionResult> StockIn(
     [FromBody] System.Text.Json.JsonElement data)
        {
            return await GetJsonAsync(() =>
                _apiService.LaboratoryStockInAsync(
                    AddPerformedBy(data)));
        }
        [Authorize(Policy = "LAB_INVENTORY_LIST")]
        [HttpPost("StockOut")]
        public async Task<IActionResult> StockOut(
     [FromBody] System.Text.Json.JsonElement data)
        {
            return await GetJsonAsync(() =>
                _apiService.LaboratoryStockOutAsync(
                    AddPerformedBy(data)));
        }
        [Authorize(Policy = "LAB_INVENTORY_LIST")]
        [HttpPost("Adjust")]
        public async Task<IActionResult> Adjust(
     [FromBody] System.Text.Json.JsonElement data)
        {
            return await GetJsonAsync(() =>
                _apiService.LaboratoryAdjustAsync(
                    AddPerformedBy(data)));
        }

        private string AddPerformedBy(
    System.Text.Json.JsonElement data)
        {
            var username = User.FindFirst("username")?.Value;

            if (string.IsNullOrWhiteSpace(username))
            {
                throw new UnauthorizedAccessException(
                    "Authenticated username was not found.");
            }

            var payload = JsonNode.Parse(data.GetRawText())
                as JsonObject
                ?? throw new ArgumentException(
                    "Invalid stock movement request.");

            payload["performed_by"] = username;

            return payload.ToJsonString();
        }

        // =====================================================
        // TRANSACTIONS
        // =====================================================
        [Authorize(Policy = "LAB_INVENTORY_TRANSACTIONS")]
        [HttpGet("GetTransactions")]
        public async Task<IActionResult> GetTransactions(
            string search = "",
            long? locationId = null,
            string movement = "",
            string referenceType = "",
            DateTime? fromDate = null,
            DateTime? toDate = null)
        {
            return await GetJsonAsync(
                () => _apiService.GetLaboratoryTransactionsAsync(
                    search,
                    locationId,
                    movement,
                    referenceType,
                    fromDate,
                    toDate));
        }

        [Authorize(Policy = "LAB_INVENTORY_TRANSACTIONS")]
        [HttpGet("GetTransactionSummary")]
        public async Task<IActionResult> GetTransactionSummary()
        {
            return await GetJsonAsync(
                () => _apiService.GetLaboratoryTransactionSummaryAsync());
        }

        // =====================================================
        // SHARED RESPONSE HANDLER
        // =====================================================

        private async Task<IActionResult> GetJsonAsync(
            Func<Task<string>> action)
        {
            try
            {
                var json = await action();

                return Content(
                    json,
                    "application/json");
            }
            catch (Exception ex)
            {
                Response.StatusCode = 500;

                return Json(new
                {
                    success = false,
                    message = ex.Message
                });
            }
        }
    }
}
