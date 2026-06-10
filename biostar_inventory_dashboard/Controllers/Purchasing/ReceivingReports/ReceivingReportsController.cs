using Microsoft.AspNetCore.Mvc;
using System.Text;
using System.Text.Json;

namespace biostar_inventory_dashboard.Controllers.Purchasing.ReceivingReports
{
    [Route("purchasing/receiving-reports")]
    public class ReceivingReportsController : Controller
    {
        private readonly IHttpClientFactory _httpClientFactory;

        public ReceivingReportsController(IHttpClientFactory httpClientFactory)
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
            return View("~/Views/Purchasing/ReceivingReports/Index.cshtml");
        }

        [HttpGet("create/{poId}")]
        public IActionResult Create(int poId)
        {
            ViewBag.PoId = poId;
            return View("~/Views/Purchasing/ReceivingReports/Create.cshtml");
        }

        [HttpGet("create-options/{poId}")]
        public async Task<IActionResult> GetCreateOptions(int poId)
        {
            var client = CreateClient();

            var response = await client.GetAsync(
                $"api/purchasing/receiving-reports/create-options/{poId}"
            );

            var result = await response.Content.ReadAsStringAsync();

            return StatusCode((int)response.StatusCode, result);
        }

        [HttpGet("next-number")]
        public async Task<IActionResult> GetNextNumber()
        {
            var client = CreateClient();

            var response = await client.GetAsync(
                "api/purchasing/receiving-reports/next-number"
            );

            var result = await response.Content.ReadAsStringAsync();

            return StatusCode((int)response.StatusCode, result);
        }

        [HttpPost("create")]
        public async Task<IActionResult> CreateRr([FromBody] object payload)
        {
            var client = CreateClient();

            var userId = User.FindFirst("user_id")?.Value
                         ?? User.FindFirst("UserId")?.Value
                         ?? User.Identity?.Name
                         ?? "";

            var json = JsonSerializer.Deserialize<Dictionary<string, object>>(
                JsonSerializer.Serialize(payload)
            );

            json["createdBy"] = userId;

            var content = new StringContent(
                JsonSerializer.Serialize(json),
                Encoding.UTF8,
                "application/json"
            );

            var response = await client.PostAsync(
                "api/purchasing/receiving-reports",
                content
            );

            var result = await response.Content.ReadAsStringAsync();

            return StatusCode((int)response.StatusCode, result);
        }

        [HttpPost("{id}/submit-qc")]
        public async Task<IActionResult> SubmitQc(int id)
        {
            var client = CreateClient();

            var content = new StringContent(
                JsonSerializer.Serialize(new { }),
                Encoding.UTF8,
                "application/json"
            );

            var response = await client.PostAsync(
                $"api/purchasing/receiving-reports/{id}/submit-qc",
                content
            );

            var result = await response.Content.ReadAsStringAsync();

            return StatusCode((int)response.StatusCode, result);
        }

        [HttpPost("{id}/accept")]
        public async Task<IActionResult> Accept(int id)
        {
            var client = CreateClient();

            var content = new StringContent(
                JsonSerializer.Serialize(new { }),
                Encoding.UTF8,
                "application/json"
            );

            var response = await client.PostAsync(
                $"api/purchasing/receiving-reports/{id}/accept",
                content
            );

            var result = await response.Content.ReadAsStringAsync();

            return StatusCode((int)response.StatusCode, result);
        }

        [HttpPost("{id}/reject")]
        public async Task<IActionResult> Reject(int id)
        {
            var client = CreateClient();

            var content = new StringContent(
                JsonSerializer.Serialize(new { }),
                Encoding.UTF8,
                "application/json"
            );

            var response = await client.PostAsync(
                $"api/purchasing/receiving-reports/{id}/reject",
                content
            );

            var result = await response.Content.ReadAsStringAsync();

            return StatusCode((int)response.StatusCode, result);
        }

        [HttpPost("{id}/commit")]
        public async Task<IActionResult> Commit(int id)
        {
            var client = CreateClient();

            var content = new StringContent(
                JsonSerializer.Serialize(new { }),
                Encoding.UTF8,
                "application/json"
            );

            var response = await client.PostAsync(
                $"api/purchasing/receiving-reports/{id}/commit",
                content
            );

            var result = await response.Content.ReadAsStringAsync();

            return StatusCode((int)response.StatusCode, result);
        }

        [HttpGet("list")]
        public async Task<IActionResult> List()
        {
            var client = CreateClient();

            var response = await client.GetAsync("api/purchasing/receiving-reports");
            var result = await response.Content.ReadAsStringAsync();

            return StatusCode((int)response.StatusCode, result);
        }

        [HttpGet("details/{id}")]
        public IActionResult Details(int id)
        {
            ViewBag.RrId = id;
            return View("~/Views/Purchasing/ReceivingReports/Details.cshtml");
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var client = CreateClient();

            var response = await client.GetAsync($"api/purchasing/receiving-reports/{id}");
            var result = await response.Content.ReadAsStringAsync();

            return StatusCode((int)response.StatusCode, result);
        }
    }
}