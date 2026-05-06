using biostar_inventory_dashboard.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Text.Json;

namespace biostar_inventory_dashboard.Controllers
{
    [Authorize(Roles = "ADMIN,STAFF")]
    public class UserController : Controller
    {
        private readonly ApiService _apiService;

        public UserController(ApiService apiService)
        {
            _apiService = apiService;
        }

        public IActionResult Index()
        {
            return View();
        }

        [HttpGet]
        public async Task<IActionResult> GetUsers()
        {
            try
            {
                var result = await _apiService.GetUsersAsync();
                return Content(result, "application/json");
            }
            catch (Exception ex)
            {
                return StatusCode(500, ex.Message);
            }
        }

        [HttpPost]
        public async Task<IActionResult> AddUser([FromBody] JsonElement data)
        {
            try
            {
                var result = await _apiService.AddUserAsync(data.GetRawText());
                return Content(result, "application/json");
            }
            catch (Exception ex)
            {
                return StatusCode(500, ex.Message);
            }
        }

        [HttpPut]
        public async Task<IActionResult> UpdateUser(string id, [FromBody] JsonElement data)
        {
            try
            {
                var result = await _apiService.UpdateUserAsync(id, data.GetRawText());
                return Content(result, "application/json");
            }
            catch (Exception ex)
            {
                return StatusCode(500, ex.Message);
            }
        }
    }
}