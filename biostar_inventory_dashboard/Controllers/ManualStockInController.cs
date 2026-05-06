using biostar_inventory_dashboard.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

[Authorize(Roles = "ADMIN,STAFF")]
public class ManualStockInController : Controller
{
    private readonly ApiService _apiService;

    public ManualStockInController(ApiService apiService)
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
        var result = await _apiService.GetBranchesAsync();
        return Json(result);
    }

    [HttpGet]
    public async Task<IActionResult> GetCategories()
    {
        var result = await _apiService.GetCategoriesAsync();
        return Json(result);
    }

    [HttpGet]
    public async Task<IActionResult> GetSuppliers()
    {
        var result = await _apiService.GetPartnersAsync();
        return Content(result, "application/json");
    }
    [HttpGet]
    public async Task<IActionResult> GetProducts(string? categoryId, string? source)
    {
        var result = await _apiService.GetProductsAsync(
            page: 1,
            pageSize: 500,
            search: null,
            categoryId: string.IsNullOrWhiteSpace(categoryId) ? null : categoryId,
            status: null, // optional, safer
            source: string.IsNullOrWhiteSpace(source) ? null : source
        );

        return Json(result.items); // 👈 IMPORTANT
    }

    [HttpPost]
    public async Task<IActionResult> Save([FromBody] object dto)
    {
        try
        {
            await _apiService.PostAsync<object, object>(
                "api/Inventory/in",
                dto
            );

            return Ok(new
            {
                success = true,
                message = "Manual Stock IN saved successfully."
            });
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