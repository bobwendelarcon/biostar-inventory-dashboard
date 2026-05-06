using biostar_inventory_dashboard.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Text.Json;


namespace biostar_inventory_dashboard.Controllers
{
    [Authorize(Roles = "ADMIN,STAFF")]
    [Route("Partner")]
    public class PartnerController : Controller
    {
        private readonly ApiService _apiService;

        public PartnerController(ApiService apiService)
        {
            _apiService = apiService;
        }

        [HttpGet("")]
        public IActionResult Index()
        {
            return View();
        }

        [HttpGet("GetPartners")]
        public async Task<IActionResult> GetPartners()
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

        [HttpPost("AddPartner")]
        public async Task<IActionResult> AddPartner([FromBody] JsonElement data)
        {
            try
            {
                var result = await _apiService.AddPartnerAsync(data.GetRawText());
                return Content(result, "application/json");
            }
            catch (Exception ex)
            {
                return StatusCode(500, ex.Message);
            }
        }

        [HttpPut("UpdatePartner")]
        public async Task<IActionResult> UpdatePartner(string id, [FromBody] JsonElement data)
        {
            try
            {
                var result = await _apiService.UpdatePartnerAsync(id, data.GetRawText());
                return Content(result, "application/json");
            }
            catch (Exception ex)
            {
                return StatusCode(500, ex.Message);
            }
        }
    }
}