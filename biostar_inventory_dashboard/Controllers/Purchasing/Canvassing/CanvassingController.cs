using Microsoft.AspNetCore.Mvc;
using System.Text;
using System.Text.Json;

namespace biostar_inventory_dashboard.Controllers.Purchasing.Canvassing
{
    [Route("purchasing/canvassing")]
    public class CanvassingController : Controller
    {
        private readonly IHttpClientFactory _httpClientFactory;

        public CanvassingController(IHttpClientFactory httpClientFactory)
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
            return View("~/Views/Purchasing/Canvassing/Index.cshtml");
        }

        [HttpGet("details-page/{id}")]
        public IActionResult DetailsPage(int id)
        {
            ViewBag.CanvassId = id;
            return View("~/Views/Purchasing/Canvassing/Canvassing.cshtml");
        }
        [HttpGet("list")]
        public async Task<IActionResult> List(
    string? search,
    string? status,
    int page = 1,
    int pageSize = 10)
        {
            var client = CreateClient();

            var url =
                $"api/purchasing/canvassing?search={Uri.EscapeDataString(search ?? "")}&status={Uri.EscapeDataString(status ?? "")}&page={page}&pageSize={pageSize}";

            var result = await client.GetStringAsync(url);

            return Content(result, "application/json");
        }

        [HttpPost("create-from-mprf/{mprfId}")]
        public async Task<IActionResult> CreateFromMprf(int mprfId)
        {
            var client = CreateClient();

            var content = new StringContent(
                JsonSerializer.Serialize(new { }),
                Encoding.UTF8,
                "application/json"
            );

            var response = await client.PostAsync(
                $"api/purchasing/canvassing/from-mprf/{mprfId}",
                content
            );

            var result = await response.Content.ReadAsStringAsync();

            return StatusCode((int)response.StatusCode, result);
        }
        [HttpGet("details/{id}")]
        public async Task<IActionResult> GetDetails(int id)
        {
            var client = CreateClient();
            var result = await client.GetStringAsync($"api/purchasing/canvassing/{id}");

            return Content(result, "application/json");
        }

        [HttpGet("materials/{materialId}/suppliers")]
        public async Task<IActionResult> GetLinkedSuppliers(int materialId)
        {
            var client = CreateClient();
            var result = await client.GetStringAsync($"api/purchasing/canvassing/materials/{materialId}/suppliers");

            return Content(result, "application/json");
        }

        [HttpPost("quotes/create")]
        public async Task<IActionResult> CreateQuote([FromBody] object dto)
        {
            var client = CreateClient();

            var content = new StringContent(
                JsonSerializer.Serialize(dto),
                Encoding.UTF8,
                "application/json"
            );

            var response = await client.PostAsync("api/purchasing/canvassing/quotes", content);
            var result = await response.Content.ReadAsStringAsync();

            return StatusCode((int)response.StatusCode, result);
        }

        [HttpPost("{canvassId}/complete")]
        public async Task<IActionResult> Complete(int canvassId)
        {
            var client = CreateClient();

            var content = new StringContent(
                JsonSerializer.Serialize(new { }),
                Encoding.UTF8,
                "application/json"
            );

            var response = await client.PostAsync(
                $"api/purchasing/canvassing/{canvassId}/complete",
                content
            );

            var result = await response.Content.ReadAsStringAsync();

            return StatusCode((int)response.StatusCode, result);
        }

        [HttpPost("quotes/update/{quoteId}")]
        public async Task<IActionResult> UpdateQuote(int quoteId, [FromBody] object dto)
        {
            var client = CreateClient();

            var content = new StringContent(
                JsonSerializer.Serialize(dto),
                Encoding.UTF8,
                "application/json"
            );

            var response = await client.PutAsync(
                $"api/purchasing/canvassing/quotes/{quoteId}",
                content
            );

            var result = await response.Content.ReadAsStringAsync();

            return StatusCode((int)response.StatusCode, result);
        }

        [HttpPost("{canvassId}/recommend")]
        public async Task<IActionResult> Recommend(int canvassId)
        {
            var client = CreateClient();

            var content = new StringContent(
                JsonSerializer.Serialize(new { }),
                Encoding.UTF8,
                "application/json"
            );

            var response = await client.PostAsync(
                $"api/purchasing/canvassing/{canvassId}/recommend",
                content
            );

            var result = await response.Content.ReadAsStringAsync();

            return StatusCode((int)response.StatusCode, result);
        }

        [HttpPost("quotes/{quoteId}/recommend")]
        public async Task<IActionResult> ManualRecommend(int quoteId)
        {
            var client = CreateClient();

            var content = new StringContent(
                JsonSerializer.Serialize(new { }),
                Encoding.UTF8,
                "application/json"
            );

            var response = await client.PostAsync(
                $"api/purchasing/canvassing/quotes/{quoteId}/recommend",
                content
            );

            var result = await response.Content.ReadAsStringAsync();

            return StatusCode((int)response.StatusCode, result);
        }
    }
}