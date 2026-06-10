using Microsoft.AspNetCore.Mvc;
using System.Text;
using System.Text.Json;

namespace biostar_inventory_dashboard.Controllers.Purchasing.QcInspections
{
    [Route("purchasing/qc-inspections")]
    public class QcInspectionsController : Controller
    {
        private readonly IHttpClientFactory _httpClientFactory;

        public QcInspectionsController(IHttpClientFactory httpClientFactory)
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
            return View("~/Views/Purchasing/QcInspections/Index.cshtml");
        }

        [HttpGet("details/{id}")]
        public IActionResult Details(int id)
        {
            ViewBag.QcId = id;
            return View("~/Views/Purchasing/QcInspections/Details.cshtml");
        }

        [HttpGet("list")]
        public async Task<IActionResult> List()
        {
            var client = CreateClient();

            var result = await client.GetStringAsync(
                "api/purchasing/qc-inspections"
            );

            return Content(result, "application/json");
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var client = CreateClient();

            var result = await client.GetStringAsync(
                $"api/purchasing/qc-inspections/{id}"
            );

            return Content(result, "application/json");
        }

        [HttpPost("{id}/save-inspection")]
        public async Task<IActionResult> SaveInspection(
            int id,
            [FromBody] object dto)
        {
            var client = CreateClient();

            var content = new StringContent(
                JsonSerializer.Serialize(dto),
                Encoding.UTF8,
                "application/json"
            );

            var response = await client.PostAsync(
                $"api/purchasing/qc-inspections/{id}/save-inspection",
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
                $"api/purchasing/qc-inspections/{id}/commit",
                content
            );

            var result = await response.Content.ReadAsStringAsync();

            return StatusCode((int)response.StatusCode, result);
        }
    }
}