using biostar_inventory_dashboard.Services;
using Microsoft.AspNetCore.Mvc;

namespace biostar_inventory_dashboard.Controllers
{
    public class ProductController : Controller
    {
        private readonly ApiService _apiService;

        public ProductController(ApiService apiService)
        {
            _apiService = apiService;
        }



        public IActionResult Index()
        {
         ;
            return View();
        }

        [HttpGet]
        public async Task<IActionResult> GetProducts()
        {
            var data = await _apiService.GetProductsAsync();
            return Json(data);
        }


        [HttpPost]
        public async Task<IActionResult> AddProduct([FromBody] object dto)
        {
            var success = await _apiService.AddProductAsync(dto);

            if (!success)
                return BadRequest("Failed to add product.");

            return Ok("Product added successfully.");
        }

        [HttpPost]
        public async Task<IActionResult> UpdateProduct(string id, [FromBody] object dto)
        {
            var success = await _apiService.UpdateProductAsync(id, dto);

            if (!success)
                return BadRequest("Failed to update product.");

            return Ok("Product updated successfully.");
        }
    }
}