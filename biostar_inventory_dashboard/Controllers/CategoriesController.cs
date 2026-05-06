using biostar_inventory_dashboard.Models;
using biostar_inventory_dashboard.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace biostar_inventory_dashboard.Controllers
{
    [Authorize(Roles = "ADMIN,STAFF,PRODUCTION")]
    public class CategoriesController : Controller
    {
        private readonly ApiService _apiService;

        public CategoriesController(ApiService apiService)
        {
            _apiService = apiService;
        }

        public async Task<IActionResult> Index()
        {
            var categories = await _apiService.GetCategoriesAsync();
            return View(categories);
        }

        [HttpPost]
        public async Task<IActionResult> AddCategory([FromBody] Categories category)
        {
            if (category == null)
                return BadRequest("Invalid data");

            if (string.IsNullOrWhiteSpace(category.catg_name))
                return BadRequest("Category name is required.");

            // Important: frontend no longer sends catg_id
            category.catg_id = null;

            var success = await _apiService.AddCategoryAsync(category);

            if (!success)
                return StatusCode(500, "Failed to save category");

            return Ok(new { message = "Category added successfully" });
        }

        [HttpPost]
        public async Task<IActionResult> UpdateCategory([FromBody] Categories category)
        {
            if (category == null || string.IsNullOrWhiteSpace(category.catg_id))
                return BadRequest("Invalid category data.");

            try
            {
                var success = await _apiService.UpdateCategoryAsync(category);

                if (!success)
                    return StatusCode(500, "Failed to update category.");

                return Ok(new { message = "Category updated successfully." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error updating category: {ex.Message}");
            }
        }

        [HttpGet]
        public async Task<IActionResult> GetCategories()
        {
            var data = await _apiService.GetCategoriesAsync();
            return Json(data);
        }
    }


}

//public class CategoriesController : Controller
//{
//    public IActionResult Index()
//    {
//        var categories = new List<Categories>
//        {
//            new Categories
//            {
//                catg_id = "CAT001",
//                catg_name = "Raw Materials",
//                catg_desc = "Materials used in production",
//                is_deleted = false
//            },
//            new Categories
//            {
//                catg_id = "CAT002",
//                catg_name = "Finished Goods",
//                catg_desc = "Ready for sale",
//                is_deleted = false
//            }
//        };

//        return View(categories);
//    }
//}
