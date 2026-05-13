using biostar_inventory_dashboard.Models;
using biostar_inventory_dashboard.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json;
using System.Net.Http;
using System.Text;

namespace biostar_inventory_dashboard.Controllers
{
    [Authorize(Roles = "ADMIN,STAFF")]
    public class ProductController : Controller
    {
        private readonly ApiService _apiService;
        private readonly HttpClient _httpClient;
        private readonly string _apiBaseUrl;

        public ProductController(ApiService apiService, IConfiguration configuration)
        {
            _apiService = apiService;

            _httpClient = new HttpClient();

            _apiBaseUrl = configuration["ApiSettings:BaseUrl"]
                ?? throw new Exception("ApiSettings:BaseUrl is missing.");
        }


        public IActionResult Index()
        {
         ;
            return View();
        }

        [HttpGet]
        public async Task<IActionResult> GetProducts(
    int page = 1,
    int pageSize = 50,
    string? search = null,
    string? categoryId = null,
    bool? status = null,
    string? source = null)
        {
            var result = await _apiService.GetProductsAsync(
                page,
                pageSize,
                search,
                categoryId,
                status,
                source
            );

            return Json(result);
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


        [HttpGet]
        public async Task<IActionResult> GetProductsLookup(string? categoryId, string? search = null)
        {
            var endpoint =
                $"api/Products/lookup?categoryId={Uri.EscapeDataString(categoryId ?? "")}&search={Uri.EscapeDataString(search ?? "")}";

            var result = await _apiService.GetAsync<object>(endpoint);
            return Json(result);
        }


        [HttpPost]
        public async Task<IActionResult> ImportPreview(IFormFile file)
        {
            try
            {
                using var content = new MultipartFormDataContent();

                using var stream = file.OpenReadStream();

                content.Add(
                    new StreamContent(stream),
                    "file",
                    file.FileName
                );

                var response = await _httpClient.PostAsync(
                    $"{_apiBaseUrl}api/Products/import-preview",
                    content
                );

                var result = await response.Content.ReadAsStringAsync();

                return Content(result, "application/json");
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPost]
        public async Task<IActionResult> ImportSelected([FromBody] ProductImportRequestDto payload)
        {
            try
            {
                var json = JsonConvert.SerializeObject(payload);

                var content = new StringContent(
                    json,
                    Encoding.UTF8,
                    "application/json"
                );

                var response = await _httpClient.PostAsync(
                    $"{_apiBaseUrl}api/Products/import-selected",
                    content
                );

                var result = await response.Content.ReadAsStringAsync();

                return Content(result, "application/json");
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }
    }
}