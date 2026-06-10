using Microsoft.AspNetCore.Mvc;
using System.Text;
using System.Text.Json;

namespace biostar_inventory_dashboard.Controllers.Purchasing.Suppliers
{
    [Route("purchasing/suppliers")]
    public class SuppliersController : Controller
    {
        private readonly IHttpClientFactory _httpClientFactory;

        public SuppliersController(IHttpClientFactory httpClientFactory)
        {
            _httpClientFactory = httpClientFactory;
        }

        private HttpClient CreateClient()
        {
            return _httpClientFactory.CreateClient("ApiClient");
        }

        [HttpGet("")]
        public IActionResult Index()
        {
            return View("~/Views/Purchasing/Suppliers/Index.cshtml");
        }

        [HttpGet("list")]
        public async Task<IActionResult> List(
            string? search,
            string? status,
            string? supplierType,
            int page = 1,
            int pageSize = 10)
        {
            var client = CreateClient();

            var url =
                $"api/purchasing/suppliers" +
                $"?search={Uri.EscapeDataString(search ?? "")}" +
                $"&status={Uri.EscapeDataString(status ?? "")}" +
                $"&supplierType={Uri.EscapeDataString(supplierType ?? "")}" +
                $"&page={page}" +
                $"&pageSize={pageSize}";

            var result = await client.GetStringAsync(url);
            return Content(result, "application/json");
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var client = CreateClient();
            var result = await client.GetStringAsync($"api/purchasing/suppliers/{id}");
            return Content(result, "application/json");
        }

        [HttpPost("create")]
        public async Task<IActionResult> Create([FromBody] JsonElement dto)
        {
            var client = CreateClient();

            var content = new StringContent(
                dto.GetRawText(),
                Encoding.UTF8,
                "application/json"
            );

            var response = await client.PostAsync("api/purchasing/suppliers", content);
            var result = await response.Content.ReadAsStringAsync();

            return StatusCode((int)response.StatusCode, result);
        }

        [HttpPut("update/{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] JsonElement dto)
        {
            var client = CreateClient();

            var content = new StringContent(
                dto.GetRawText(),
                Encoding.UTF8,
                "application/json"
            );

            var response = await client.PutAsync($"api/purchasing/suppliers/{id}", content);
            var result = await response.Content.ReadAsStringAsync();

            return StatusCode((int)response.StatusCode, result);
        }

        [HttpPost("delete/{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var client = CreateClient();

            var response = await client.DeleteAsync($"api/purchasing/suppliers/{id}");
            var result = await response.Content.ReadAsStringAsync();

            return StatusCode((int)response.StatusCode, result);
        }

        [HttpGet("materials/lookup")]
        public async Task<IActionResult> MaterialsLookup(
    string? search,
    int? categoryId,
    int? subCategoryId)
        {
            var client = CreateClient();

            var url = "api/manufacturing/materials/lookup";

            var query = new List<string>();

            if (!string.IsNullOrWhiteSpace(search))
                query.Add($"search={Uri.EscapeDataString(search)}");

            if (categoryId.HasValue)
                query.Add($"categoryId={categoryId.Value}");

            if (subCategoryId.HasValue)
                query.Add($"subCategoryId={subCategoryId.Value}");

            if (query.Any())
                url += "?" + string.Join("&", query);

            var result = await client.GetStringAsync(url);

            return Content(result, "application/json");
        }

        [HttpGet("manufacturers/lookup")]
        public async Task<IActionResult> ManufacturersLookup(string? search)
        {
            var client = CreateClient();

            var url = "api/purchasing/manufacturers/lookup";

            if (!string.IsNullOrWhiteSpace(search))
                url += $"?search={Uri.EscapeDataString(search)}";

            var result = await client.GetStringAsync(url);

            return Content(result, "application/json");
        }



        [HttpGet("{supplierId}/materials")]
        public async Task<IActionResult> GetSupplierMaterials(int supplierId)
        {
            var client = CreateClient();

            var result = await client.GetStringAsync(
                $"api/purchasing/supplier-materials/supplier/{supplierId}"
            );

            return Content(result, "application/json");
        }

        [HttpPost("materials/create")]
        public async Task<IActionResult> CreateSupplierMaterial([FromBody] JsonElement dto)
        {
            var client = CreateClient();

            var content = new StringContent(
                dto.GetRawText(),
                Encoding.UTF8,
                "application/json"
            );

            var response = await client.PostAsync("api/purchasing/supplier-materials", content);
            var result = await response.Content.ReadAsStringAsync();

            return StatusCode((int)response.StatusCode, result);
        }

        [HttpPost("materials/delete/{id}")]
        public async Task<IActionResult> DeleteSupplierMaterial(int id)
        {
            var client = CreateClient();

            var response = await client.DeleteAsync($"api/purchasing/supplier-materials/{id}");
            var result = await response.Content.ReadAsStringAsync();

            return StatusCode((int)response.StatusCode, result);
        }



        [HttpGet("{supplierId}/manufacturers")]
        public async Task<IActionResult> GetSupplierManufacturers(int supplierId)
        {
            var client = CreateClient();

            var result = await client.GetStringAsync(
                $"api/purchasing/supplier-manufacturers/supplier/{supplierId}"
            );

            return Content(result, "application/json");
        }

        [HttpPost("manufacturers/create")]
        public async Task<IActionResult> CreateSupplierManufacturer([FromBody] JsonElement dto)
        {
            var client = CreateClient();

            var content = new StringContent(
                dto.GetRawText(),
                Encoding.UTF8,
                "application/json"
            );

            var response = await client.PostAsync(
                "api/purchasing/supplier-manufacturers",
                content
            );

            var result = await response.Content.ReadAsStringAsync();

            return StatusCode((int)response.StatusCode, result);
        }

        [HttpPost("manufacturers/delete/{id}")]
        public async Task<IActionResult> DeleteSupplierManufacturer(int id)
        {
            var client = CreateClient();

            var response = await client.DeleteAsync(
                $"api/purchasing/supplier-manufacturers/{id}"
            );

            var result = await response.Content.ReadAsStringAsync();

            return StatusCode((int)response.StatusCode, result);
        }

        [HttpPost("manufacturers/new")]
        public async Task<IActionResult> CreateManufacturer([FromBody] JsonElement dto)
        {
            var client = CreateClient();

            var content = new StringContent(
                dto.GetRawText(),
                Encoding.UTF8,
                "application/json"
            );

            var response = await client.PostAsync("api/purchasing/manufacturers", content);
            var result = await response.Content.ReadAsStringAsync();

            return StatusCode((int)response.StatusCode, result);
        }
        [HttpGet("manufacturers/{id}")]
        public async Task<IActionResult> GetManufacturerById(int id)
        {
            var client = CreateClient();

            var response = await client.GetAsync($"api/purchasing/manufacturers/{id}");
            var result = await response.Content.ReadAsStringAsync();

            return StatusCode((int)response.StatusCode, result);
        }
        [HttpPut("manufacturers/{id}")]
        public async Task<IActionResult> UpdateManufacturer(int id, [FromBody] JsonElement dto)
        {
            var client = CreateClient();

            var content = new StringContent(
                dto.GetRawText(),
                Encoding.UTF8,
                "application/json"
            );

            var response = await client.PutAsync(
                $"api/purchasing/manufacturers/{id}",
                content
            );

            var result = await response.Content.ReadAsStringAsync();

            return StatusCode((int)response.StatusCode, result);
        }


    }
}