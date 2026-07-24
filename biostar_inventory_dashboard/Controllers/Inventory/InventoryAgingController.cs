using biostar_inventory_dashboard.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using System.Text.Json;

namespace biostar_inventory_dashboard.Controllers.Inventory
{
    [Authorize]
    public class InventoryAgingController : Controller
    {
        private readonly ApiService _apiService;

        public InventoryAgingController(ApiService apiService)
        {
            _apiService = apiService;
        }

        [HttpGet]
        public IActionResult Index()
        {
            return View();
        }

        [HttpGet]
        public async Task<IActionResult> GetInventory(
      int page = 1,
      int pageSize = 30,
      string search = "",
      string lotNo = "",
      string warehouse = "",
      string status = "",
      int? minimumDays = null,
      int? maximumDays = null,
      string order = "desc")
        {
            try
            {
                var result =
                    await _apiService.GetInventoryAgingAsync(
                        page,
                        pageSize,
                        search,
                        lotNo,
                        warehouse,
                        status,
                        minimumDays,
                        maximumDays,
                        order
                    );

                return Content(
                    result,
                    "application/json"
                );
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

        [HttpPost]
        public async Task<IActionResult> Verify([FromBody] JsonElement data)
        {
            try
            {
                var request =
                    JsonSerializer.Deserialize<InventoryCleanupRequest>(
                        data.GetRawText(),
                        new JsonSerializerOptions
                        {
                            PropertyNameCaseInsensitive = true
                        });

                if (request == null)
                {
                    return BadRequest(new
                    {
                        success = false,
                        message = "Invalid verification request."
                    });
                }

                if (string.IsNullOrWhiteSpace(request.ProductId))
                {
                    return BadRequest(new
                    {
                        success = false,
                        message = "Product is required."
                    });
                }

                if (string.IsNullOrWhiteSpace(request.BranchId))
                {
                    return BadRequest(new
                    {
                        success = false,
                        message = "Warehouse is required."
                    });
                }

                if (string.IsNullOrWhiteSpace(request.LotNo))
                {
                    return BadRequest(new
                    {
                        success = false,
                        message = "Lot number is required."
                    });
                }

                if (request.PhysicalQty < 0)
                {
                    return BadRequest(new
                    {
                        success = false,
                        message = "Physical quantity cannot be negative."
                    });
                }

                if (string.IsNullOrWhiteSpace(request.Reason))
                {
                    return BadRequest(new
                    {
                        success = false,
                        message = "Reason is required."
                    });
                }

                var userId =
                    User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                    ?? User.FindFirst("user_id")?.Value
                    ?? User.Identity?.Name
                    ?? "SYSTEM";

                var remarks =
                    $"Inventory Aging & Cleanup | " +
                    $"Reason: {request.Reason} | " +
                    $"System Qty: {request.SystemQty} | " +
                    $"Physical Qty: {request.PhysicalQty}";

                if (!string.IsNullOrWhiteSpace(request.Remarks))
                {
                    remarks += $" | Remarks: {request.Remarks.Trim()}";
                }

                var adjustmentPayload = new
                {
                    product_id = request.ProductId,
                    branch_id = request.BranchId,
                    lot_no = request.LotNo,

                    // SET means the final inventory quantity will equal PhysicalQty.
                    adjustment_type = "SET",
                    quantity = request.PhysicalQty,

                    adjusted_by = userId,
                    reference_type = "INVENTORY_CLEANUP",

                    dr_no = "",
                    inv_no = "",
                    po_no = "",

                    remarks
                };

                var json = JsonSerializer.Serialize(adjustmentPayload);

                var result = await _apiService.AdjustAsync(json);

                return Content(result, "application/json");
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = ex.Message
                }.ToString());
            }
        }

        public class InventoryCleanupRequest
        {
            public string ProductId { get; set; } = "";
            public string BranchId { get; set; } = "";
            public string LotNo { get; set; } = "";

            public decimal SystemQty { get; set; }
            public decimal PhysicalQty { get; set; }

            public string Reason { get; set; } = "";
            public string Remarks { get; set; } = "";
        }
    }
}