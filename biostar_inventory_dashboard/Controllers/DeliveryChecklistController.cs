using biostar_inventory_dashboard.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Text.Json;


namespace biostar_inventory_dashboard.Controllers
{
    [Authorize(Roles = "ADMIN,STAFF")]
    public class DeliveryChecklistController : Controller
    {
        private readonly ApiService _apiService;

        public DeliveryChecklistController(ApiService apiService)
        {
            _apiService = apiService;
        }

        //public IActionResult Index()
        //{
        //    return View();
        //}

        public IActionResult Index()
        {
            ViewBag.CurrentUser =
                User.Identity?.Name
                ?? HttpContext.Session.GetString("FullName")
                ?? HttpContext.Session.GetString("Username")
                ?? "UNKNOWN";

            return View();
        }
        public IActionResult Print(long id)
        {
            ViewBag.ChecklistId = id;
            return View();
        }
        //[HttpGet]
        //public async Task<IActionResult> GetChecklistList()
        //{
        //    try
        //    {
        //        var result = await _apiService.GetChecklistListAsync();
        //        return Content(result, "application/json");
        //    }
        //    catch (Exception ex)
        //    {
        //        return StatusCode(500, ex.Message);
        //    }
        //}

        [HttpGet]
        public async Task<IActionResult> GetReadyForChecklist()
        {
            try
            {
                var result = await _apiService.GetReadyForChecklistAsync();
                return Content(result, "application/json");
            }
            catch (Exception ex)
            {
                return StatusCode(500, ex.Message);
            }
        }

        [HttpGet]
        public async Task<IActionResult> GetChecklistDetails(long id)
        {
            try
            {
                var result = await _apiService.GetChecklistDetailsAsync(id);
                return Content(result, "application/json");
            }
            catch (Exception ex)
            {
                return StatusCode(500, ex.Message);
            }
        }

        [HttpPost]
        public async Task<IActionResult> CreateChecklist([FromBody] JsonElement data)
        {
            try
            {
                var result = await _apiService.CreateChecklistAsync(data);
                return Content(result, "application/json");
            }
            catch (HttpRequestException ex)
            {
                return StatusCode(500, ex.Message);
            }
            catch (Exception ex)
            {
                return StatusCode(500, ex.Message);
            }
        }

        [HttpPost]
        public async Task<IActionResult> DeleteChecklist(long id)
        {
            try
            {
                var result = await _apiService.DeleteChecklistAsync(id);
                return Content(result, "application/json");
            }
            catch (Exception ex)
            {
                return StatusCode(500, ex.Message);
            }
        }

        //confirm loading

        [HttpPost]
        public async Task<IActionResult> ConfirmLoading(long id)
        {
            try
            {
                var result = await _apiService.ConfirmLoadingAsync(id);
                return Content(result, "application/json");
            }
            catch (Exception ex)
            {
                return StatusCode(500, ex.Message);
            }
        }

        [HttpPost]
        public async Task<IActionResult> ReopenChecklist(long checklistId)
        {
            try
            {
                var result = await _apiService.ReopenChecklistAsync(checklistId);
                return Content(result, "application/json");
            }
            catch (Exception ex)
            {
                return BadRequest(new
                {
                    success = false,
                    message = ex.Message
                });
            }
        }

        [HttpPost]
        public async Task<IActionResult> CompleteLine([FromBody] JsonElement data)
        {
            try
            {
                var result = await _apiService.CompleteChecklistLineAsync(data);
                return Content(result, "application/json");
            }
            catch (Exception ex)
            {
                return BadRequest(new
                {
                    success = false,
                    message = ex.Message
                });
            }
        }

        [HttpGet]
        public async Task<IActionResult> GetChecklistList(DateTime? date, string? status, string? truck, string? search)
        {
            try
            {
                var result = await _apiService.GetChecklistListAsync(date, status, truck, search);
                return Content(result, "application/json");
            }
            catch (Exception ex)
            {
                return StatusCode(500, ex.Message);
            }
        }

        [HttpPost]
        public async Task<IActionResult> UpdateChecklistLineLot([FromBody] JsonElement data)
        {
            try
            {
                var result = await _apiService.UpdateChecklistLineLotAsync(data);
                return Content(result, "application/json");
            }
            catch (Exception ex)
            {
                return BadRequest(new
                {
                    success = false,
                    message = ex.Message
                });
            }
        }

        [HttpGet]
        public async Task<IActionResult> GetAvailableLotsForChecklistLine(long checklistLineId)
        {
            try
            {
                var result = await _apiService.GetAvailableLotsForChecklistLineAsync(checklistLineId);
                return Content(result, "application/json");
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        [HttpPost]
        public async Task<IActionResult> ReplaceChecklistLots([FromBody] JsonElement data)
        {
            try
            {
                var result = await _apiService.ReplaceChecklistLotsAsync(data);
                return Content(result, "application/json");
            }
            catch (Exception ex)
            {
                return BadRequest(new
                {
                    success = false,
                    message = ex.Message
                });
            }
        }

        [HttpPost]
        public async Task<IActionResult> CompleteCustomer([FromBody] JsonElement data)
        {
            try
            {
                var result = await _apiService.CompleteChecklistCustomerAsync(data);
                return Content(result, "application/json");
            }
            catch (Exception ex)
            {
                return BadRequest(new
                {
                    success = false,
                    message = ex.Message
                });
            }
        }

        [HttpPost]
        public async Task<IActionResult> CompleteLines([FromBody] JsonElement data)
        {
            try
            {
                var result = await _apiService.CompleteChecklistLinesAsync(data);
                return Content(result, "application/json");
            }
            catch (Exception ex)
            {
                return BadRequest(new
                {
                    success = false,
                    message = ex.Message
                });
            }
        }

        [HttpPost]
        public async Task<IActionResult> DeleteChecklistLine(long checklistLineId)
        {
            try
            {
                var result = await _apiService.DeleteChecklistLineAsync(checklistLineId);
                return Content(result, "application/json");
            }
            catch (Exception ex)
            {
                return BadRequest(new
                {
                    success = false,
                    message = ex.Message
                });
            }
        }

        [HttpGet]
        public async Task<IActionResult> GetAvailableLinesForChecklist(long checklistId)
        {
            try
            {
                var result =
                    await _apiService.GetAvailableLinesForChecklistAsync(checklistId);

                return Content(result, "application/json");
            }
            catch (Exception ex)
            {
                return StatusCode(500, ex.Message);
            }
        }

        [HttpPost]
        public async Task<IActionResult> AddLinesToChecklist(
    [FromBody] JsonElement data)
        {
            try
            {
                var result = await _apiService
                    .AddLinesToChecklistAsync(data);

                return Content(result, "application/json");
            }
            catch (Exception ex)
            {
                return BadRequest(new
                {
                    success = false,
                    message = ex.Message
                });
            }
        }

        [HttpPost]
        public async Task<IActionResult> RemoveCustomerFromChecklist(
    [FromBody] JsonElement data)
        {
            try
            {
                var result = await _apiService
                    .RemoveCustomerFromChecklistAsync(data);

                return Content(result, "application/json");
            }
            catch (Exception ex)
            {
                return BadRequest(new
                {
                    success = false,
                    message = ex.Message
                });
            }
        }

        [HttpPost]
        public async Task<IActionResult> UpdateTripInfo(
    [FromBody] JsonElement data)
        {
            try
            {
                var result = await _apiService
                    .UpdateChecklistTripInfoAsync(data);

                return Content(result, "application/json");
            }
            catch (Exception ex)
            {
                return BadRequest(new
                {
                    success = false,
                    message = ex.Message
                });
            }
        }
    }
}