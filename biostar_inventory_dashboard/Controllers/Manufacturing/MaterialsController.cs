using Microsoft.AspNetCore.Mvc;
using System.Text;
using System.Text.Json;

namespace biostar_inventory_dashboard.Controllers.Manufacturing
{
    [Route("manufacturing/materials")]
    public class MaterialsController : Controller
    {
        private readonly IHttpClientFactory _httpClientFactory;

        public MaterialsController(IHttpClientFactory httpClientFactory)
        {
            _httpClientFactory = httpClientFactory;
        }

        private HttpClient CreateClient()
        {
            return _httpClientFactory.CreateClient("ApiClient");
        }

        [HttpGet]
        public IActionResult Index()
        {
            return View("~/Views/Manufacturing/Materials/Index.cshtml");
        }
        [HttpGet("categories")]
        public IActionResult Categories()
        {
            return View("~/Views/Manufacturing/Materials/Categories.cshtml");
        }

        [HttpGet("categories/list")]
        public async Task<IActionResult> GetCategories()
        {
            var client = CreateClient();
            var result = await client.GetStringAsync("api/manufacturing/material-categories");
            return Content(result, "application/json");
        }

        [HttpPost("categories/create")]
        public async Task<IActionResult> CreateCategory([FromBody] object dto)
        {
            var client = CreateClient();

            var content = new StringContent(
                JsonSerializer.Serialize(dto),
                Encoding.UTF8,
                "application/json"
            );

            var response = await client.PostAsync("api/manufacturing/material-categories", content);
            var result = await response.Content.ReadAsStringAsync();

            return StatusCode((int)response.StatusCode, result);
        }

        [HttpPost("categories/update/{id}")]
        public async Task<IActionResult> UpdateCategory(int id, [FromBody] object dto)
        {
            var client = CreateClient();

            var content = new StringContent(
                JsonSerializer.Serialize(dto),
                Encoding.UTF8,
                "application/json"
            );

            var response = await client.PutAsync($"api/manufacturing/material-categories/{id}", content);
            var result = await response.Content.ReadAsStringAsync();

            return StatusCode((int)response.StatusCode, result);
        }

        [HttpPost("categories/delete/{id}")]
        public async Task<IActionResult> DeleteCategory(int id)
        {
            var client = CreateClient();

            var response = await client.DeleteAsync($"api/manufacturing/material-categories/{id}");
            var result = await response.Content.ReadAsStringAsync();

            return StatusCode((int)response.StatusCode, result);
        }


        // ==========================
        // MATERIALS
        // ==========================

        [HttpGet("list")]
        public async Task<IActionResult> GetMaterials()
        {
            var client = CreateClient();
            var result = await client.GetStringAsync("api/manufacturing/materials?page=1&pageSize=100");
            return Content(result, "application/json");
        }

        [HttpPost("create")]
        public async Task<IActionResult> CreateMaterial([FromBody] object dto)
        {
            var client = CreateClient();

            var content = new StringContent(
                JsonSerializer.Serialize(dto),
                Encoding.UTF8,
                "application/json"
            );

            var response = await client.PostAsync("api/manufacturing/materials", content);
            var result = await response.Content.ReadAsStringAsync();

            return StatusCode((int)response.StatusCode, result);
        }

        [HttpPost("update/{id}")]
        public async Task<IActionResult> UpdateMaterial(int id, [FromBody] object dto)
        {
            var client = CreateClient();

            var content = new StringContent(
                JsonSerializer.Serialize(dto),
                Encoding.UTF8,
                "application/json"
            );

            var response = await client.PutAsync($"api/manufacturing/materials/{id}", content);
            var result = await response.Content.ReadAsStringAsync();

            return StatusCode((int)response.StatusCode, result);
        }

        [HttpPost("delete/{id}")]
        public async Task<IActionResult> DeleteMaterial(int id)
        {
            var client = CreateClient();

            var response = await client.DeleteAsync($"api/manufacturing/materials/{id}");
            var result = await response.Content.ReadAsStringAsync();

            return StatusCode((int)response.StatusCode, result);
        }


        // ==========================
        // MATERIAL SUB CATEGORIES
        // ==========================

        [HttpGet("subcategories/list")]
        public async Task<IActionResult> GetSubCategories()
        {
            var client = CreateClient();
            var result = await client.GetStringAsync("api/manufacturing/material-subcategories");
            return Content(result, "application/json");
        }

        [HttpGet("subcategories/by-category/{categoryId}")]
        public async Task<IActionResult> GetSubCategoriesByCategory(int categoryId)
        {
            var client = CreateClient();
            var result = await client.GetStringAsync($"api/manufacturing/material-subcategories/category/{categoryId}");
            return Content(result, "application/json");
        }

        [HttpPost("subcategories/create")]
        public async Task<IActionResult> CreateSubCategory([FromBody] object dto)
        {
            var client = CreateClient();

            var content = new StringContent(
                JsonSerializer.Serialize(dto),
                Encoding.UTF8,
                "application/json"
            );

            var response = await client.PostAsync("api/manufacturing/material-subcategories", content);
            var result = await response.Content.ReadAsStringAsync();

            return StatusCode((int)response.StatusCode, result);
        }

        [HttpPost("subcategories/update/{id}")]
        public async Task<IActionResult> UpdateSubCategory(int id, [FromBody] object dto)
        {
            var client = CreateClient();

            var content = new StringContent(
                JsonSerializer.Serialize(dto),
                Encoding.UTF8,
                "application/json"
            );

            var response = await client.PutAsync($"api/manufacturing/material-subcategories/{id}", content);
            var result = await response.Content.ReadAsStringAsync();

            return StatusCode((int)response.StatusCode, result);
        }

        [HttpPost("subcategories/delete/{id}")]
        public async Task<IActionResult> DeleteSubCategory(int id)
        {
            var client = CreateClient();

            var response = await client.DeleteAsync($"api/manufacturing/material-subcategories/{id}");
            var result = await response.Content.ReadAsStringAsync();

            return StatusCode((int)response.StatusCode, result);
        }

    }
}