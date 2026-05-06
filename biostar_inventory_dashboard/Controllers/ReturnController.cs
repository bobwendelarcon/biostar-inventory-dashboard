using biostar_inventory_dashboard.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Text.Json;

namespace biostar_inventory_dashboard.Controllers
{
    [Authorize(Roles = "ADMIN,STAFF")]
    public class ReturnsController : Controller
    {
        private readonly ApiService _apiService;

        public ReturnsController(ApiService apiService)
        {
            _apiService = apiService;
        }

        public IActionResult Index()
        {
            return View();
        }

        [HttpGet]
        public async Task<IActionResult> GetAll(string status = "active")
        {
            try
            {
                var result = await _apiService.GetReturnsAsync(status);
                return Content(result, "application/json");
            }
            catch (Exception ex)
            {
                return StatusCode(500, ex.Message);
            }
        }

        [HttpGet]
        public async Task<IActionResult> GetById(long id)
        {
            try
            {
                var result = await _apiService.GetReturnByIdAsync(id);
                return Content(result, "application/json");
            }
            catch (Exception ex)
            {
                return StatusCode(500, ex.Message);
            }
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] JsonElement data)
        {
            try
            {
                var result = await _apiService.CreateReturnAsync(data.GetRawText());
                return Content(result, "application/json");
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPost]
        public async Task<IActionResult> ReleaseForReprocess(long id, [FromBody] JsonElement data)
        {
            try
            {
                var result = await _apiService.ReleaseReturnForReprocessAsync(id, data.GetRawText());
                return Content(result, "application/json");
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPost]
        public async Task<IActionResult> Cancel(long id)
        {
            try
            {
                var result = await _apiService.CancelReturnAsync(id);
                return Content(result, "application/json");
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }
        // return search

        [HttpGet]
        public async Task<IActionResult> SearchOutTransactions(string search = "", string lotNo = "")
        {
            try
            {
                var result = await _apiService.SearchOutTransactionsForReturnAsync(search, lotNo);
                return Content(result, "application/json");
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }
    }
}