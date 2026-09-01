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
        [HttpGet]
        public async Task<IActionResult> GetAvailableAccessPoints()
        {
            try
            {
                var result =
                    await _apiService
                        .GetAvailableAccessPointsAsync();

                return Content(
                    result,
                    "application/json");
            }
            catch (Exception ex)
            {
                return StatusCode(
                    500,
                    ex.Message);
            }
        }
    //    [HttpGet]
    //    public async Task<IActionResult> GetUserAccessPoints(
    //string id)
    //    {
    //        try
    //        {
    //            var result =
    //                await _apiService
    //                    .GetUserAccessPointsAsync(id);

    //            return Content(
    //                result,
    //                "application/json");
    //        }
    //        catch (Exception ex)
    //        {
    //            return StatusCode(
    //                500,
    //                ex.Message);
    //        }
    //    }
        [HttpPut]
        public async Task<IActionResult> SaveUserAccessPoints(
    string id,
    [FromBody] JsonElement data)
        {
            try
            {
                var result =
                    await _apiService
                        .SaveUserAccessPointsAsync(
                            id,
                            data.GetRawText());

                return Content(
                    result,
                    "application/json");
            }
            catch (Exception ex)
            {
                return StatusCode(
                    500,
                    ex.Message);
            }
        }

        [HttpGet]
        public async Task<IActionResult> GetUserAccessPoints(string id)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(id))
                    return BadRequest(new { message = "User ID is required." });

                var result =
                    await _apiService.GetUserAccessPointsAsync(id);

                return Content(result, "application/json");
            }
            catch (Exception ex)
            {
                return StatusCode(500, ex.Message);
            }
        }

        [HttpGet]
        public async Task<IActionResult> GetUserAccessCodes(string id)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(id))
                    return BadRequest(new { message = "User ID is required." });

                var result =
                    await _apiService.GetUserAccessCodesAsync(id);

                return Content(result, "application/json");
            }
            catch (Exception ex)
            {
                return StatusCode(500, ex.Message);
            }
        }

        [HttpDelete]
        public async Task<IActionResult> DeleteUser(string id)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(id))
                {
                    return BadRequest(new
                    {
                        message = "User ID is required."
                    });
                }

                var currentUserId =
                    User.FindFirst("user_id")?.Value
                    ?? User.FindFirst("UserId")?.Value
                    ?? "";

                if (string.Equals(
                    currentUserId,
                    id,
                    StringComparison.OrdinalIgnoreCase))
                {
                    return BadRequest(new
                    {
                        message = "You cannot delete your own account."
                    });
                }

                var role =
                    User.FindFirst(System.Security.Claims.ClaimTypes.Role)
                        ?.Value
                        ?.ToUpper()
                    ?? "";

                if (role != "ADMIN")
                {
                    return Forbid();
                }

                var result =
                    await _apiService.DeleteUserAsync(id);

                return Content(
                    result,
                    "application/json");
            }
            catch (Exception ex)
            {
                return StatusCode(
                    500,
                    ex.Message);
            }
        }


    }
}