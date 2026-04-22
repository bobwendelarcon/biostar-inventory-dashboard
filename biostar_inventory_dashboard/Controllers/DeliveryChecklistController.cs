using biostar_inventory_dashboard.Services;
using Microsoft.AspNetCore.Mvc;
using System.Text.Json;

namespace biostar_inventory_dashboard.Controllers
{
    public class DeliveryChecklistController : Controller
    {
        private readonly ApiService _apiService;

        public DeliveryChecklistController(ApiService apiService)
        {
            _apiService = apiService;
        }

        public IActionResult Index()
        {
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
    }
}