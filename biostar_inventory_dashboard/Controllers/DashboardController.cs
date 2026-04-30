using biostar_inventory_dashboard.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

[Authorize]
public class DashboardController : Controller
{
    private readonly ApiService _apiService;

    public DashboardController(ApiService apiService)
    {
        _apiService = apiService;
    }

    public async Task<IActionResult> Index()
    {
        var model = await _apiService.GetDashboardAsync();
        return View(model);
    }

    // ✅ ADD THIS (for auto-refresh)
    [HttpGet]
    public async Task<IActionResult> GetDashboardData()
    {
        try
        {
            var result = await _apiService.GetDashboardAsync();
            return Json(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, ex.Message);
        }
    }

    // ✅ KEEP THIS (used somewhere else)
    [HttpGet]
    public async Task<IActionResult> GetById(long id)
    {
        try
        {
            var result = await _apiService.GetProductToProduceByIdAsync(id);
            return Content(result, "application/json");
        }
        catch (Exception ex)
        {
            return StatusCode(500, ex.Message);
        }
    }

    [HttpGet]
    public async Task<IActionResult> RecentReturns()
    {
        try
        {
            var result = await _apiService.GetRecentReturnsAsync(5);
            return Content(result, "application/json");
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }
    }
}