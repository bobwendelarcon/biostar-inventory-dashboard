using biostar_inventory_dashboard.Services;
using Microsoft.AspNetCore.Mvc;

namespace biostar_inventory_dashboard.Controllers
{
    public class BranchController : Controller
    {
        private readonly ApiService _apiService;

        public BranchController(ApiService apiService)
        {
            _apiService = apiService;
        }

        public IActionResult Index()
        {
            return View();
        }

        [HttpGet]
        public async Task<IActionResult> GetBranches()
        {
            var data = await _apiService.GetBranchesAsync();
            return Json(data);
        }

        [HttpPost]
        public async Task<IActionResult> AddBranch([FromBody] object dto)
        {
            var success = await _apiService.AddBranchAsync(dto);

            if (!success)
                return BadRequest("Failed to add branch.");

            return Ok("Branch added successfully.");
        }

        [HttpPost]
        public async Task<IActionResult> UpdateBranch(string id, [FromBody] object dto)
        {
            var success = await _apiService.UpdateBranchAsync(id, dto);

            if (!success)
                return BadRequest("Failed to update branch.");

            return Ok("Branch updated successfully.");
        }
    }
}