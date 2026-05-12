using biostar_inventory_dashboard.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Text.Json;

namespace biostar_inventory_dashboard.Controllers
{
    [Authorize(Roles = "ADMIN,STAFF")]
    public class DailyOrderController : Controller
    {
        private readonly ApiService _apiService;

        public DailyOrderController(ApiService apiService)
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
        public async Task<IActionResult> GetOrders(
            string? className,
            int? year,
            string? month,
            string? status,
            string? search)
        {
            try
            {
                var result = await _apiService.GetDailyOrdersAsync(className, year, month, status, search);
                return Content(result, "application/json");
            }
            catch (Exception ex)
            {
                return StatusCode(500, ex.Message);
            }
        }

        [HttpGet]
        public async Task<IActionResult> GetOrderDetails(long orderId)
        {
            try
            {
                var result = await _apiService.GetDailyOrderDetailsAsync(orderId);
                return Content(result, "application/json");
            }
            catch (Exception ex)
            {
                return StatusCode(500, ex.Message);
            }
        }

        [HttpPost]
        public async Task<IActionResult> AllocateOrder(long orderId, [FromBody] System.Text.Json.JsonElement request)
        {
            try
            {
                var result = await _apiService.AllocateDailyOrderAsync(orderId, request.GetRawText());
                return Content(result, "application/json");
            }
            catch (Exception ex)
            {
                return StatusCode(500, ex.Message);
            }
        }

        [HttpPost]
        public async Task<IActionResult> MarkReadyForDispatch(long orderId)
        {
            try
            {
                var result = await _apiService.MarkDailyOrderReadyForDispatchAsync(orderId);
                return Content(result, "application/json");
            }
            catch (Exception ex)
            {
                return StatusCode(500, ex.Message);
            }
        }

        [HttpPut]
        public async Task<IActionResult> UpdateOrder(long orderId, [FromBody] object request)
        {
            try
            {
                var result = await _apiService.UpdateDailyOrderAsync(orderId, request);
                return Content(result, "application/json");
            }
            catch (Exception ex)
            {
                return StatusCode(500, ex.Message);
            }
        }

        [HttpDelete]
        public async Task<IActionResult> DeleteOrder(long orderId)
        {
            try
            {
                var result = await _apiService.DeleteDailyOrderAsync(orderId);
                return Content(result, "application/json");
            }
            catch (Exception ex)
            {
                return StatusCode(500, ex.Message);
            }
        }
        [HttpPost]
        public async Task<IActionResult> CreateOrder([FromBody] object request)
        {
            try
            {
                var result = await _apiService.CreateDailyOrderAsync(request);
                return Content(result, "application/json");
            }
            catch (Exception ex)
            {
                return StatusCode(500, ex.Message);
            }
        }

        [HttpGet]
        public async Task<IActionResult> GetCategories()
        {
            try
            {
                var result = await _apiService.GetCategoriesAsync();
                return Json(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, ex.Message);
            }
        }

        [HttpGet]
        public async Task<IActionResult> GetProductsLookup(string? categoryId, string? search)
        {
            try
            {
                var result = await _apiService.GetProductsLookupAsync(categoryId, search);
                return Json(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, ex.Message);
            }
        }

        [HttpGet]
        public async Task<IActionResult> GetCustomers()
        {
            try
            {
                var result = await _apiService.GetPartnersAsync();
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
                var result = await _apiService.GetBranchesAsync();
                return Json(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, ex.Message);
            }
        }

        [HttpPost]
        public async Task<IActionResult> ManualAllocateOrder(
    long orderId,
    [FromBody] JsonElement request)
        {
            try
            {
                var result = await _apiService
                    .ManualAllocateOrderAsync(
                        orderId,
                        request.GetRawText());

                return Content(result, "application/json");
            }
            catch (Exception ex)
            {
                return StatusCode(500, ex.Message);
            }
        }

        [HttpGet]
        public async Task<IActionResult> GetAvailableLots(long orderId)
        {
            try
            {
                var result = await _apiService.GetAvailableLotsAsync(orderId);
                return Content(result, "application/json");
            }
            catch (Exception ex)
            {
                return StatusCode(500, ex.Message);
            }
        }

        [HttpPut]
        public async Task<IActionResult> UpdateLineRequiredQty(
      long orderId,
      long orderLineId,
      [FromBody] JsonElement request)
        {
            try
            {
                var result = await _apiService.UpdateDailyOrderLineRequiredQtyAsync(
                    orderId,
                    orderLineId,
                    request
                );

                return Content(result, "application/json");
            }
            catch (Exception ex)
            {
                return StatusCode(500, ex.Message);
            }
        }

        [HttpDelete]
        public async Task<IActionResult> ClearLineAllocation(
            long orderId,
            long orderLineId)
        {
            try
            {
                var result = await _apiService.ClearDailyOrderLineAllocationAsync(
                    orderId,
                    orderLineId
                );

                return Content(result, "application/json");
            }
            catch (Exception ex)
            {
                return StatusCode(500, ex.Message);
            }
        }

        [HttpPost]
        public async Task<IActionResult> BackToAllocation(long orderId)
        {
            try
            {
                var result = await _apiService.BackToAllocationDailyOrderAsync(orderId);
                return Content(result, "application/json");
            }
            catch (Exception ex)
            {
                return StatusCode(500, ex.Message);
            }
        }


    }
}