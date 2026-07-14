using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Text;
using System.Text.Json;

namespace biostar_inventory_dashboard.Controllers.Quality
{
    //[Authorize(Roles = "QA_QC")]
    [Route("quality/qc-inspections")]
    public class QcInspectionsController : Controller
    {
        private readonly IHttpClientFactory _httpClientFactory;

        public QcInspectionsController(
            IHttpClientFactory httpClientFactory)
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
            return View(
                "~/Views/Quality/QcInspections/Index.cshtml"
            );
        }

        [HttpGet("details/{id:int}")]
        public IActionResult Details(int id)
        {
            ViewBag.QcId = id;

            return View(
                "~/Views/Quality/QcInspections/Details.cshtml"
            );
        }

        [HttpGet("list")]
        public async Task<IActionResult> List()
        {
            var client = CreateClient();

            var response = await client.GetAsync(
                "api/purchasing/qc-inspections"
            );

            var result =
                await response.Content.ReadAsStringAsync();

            return StatusCode(
                (int)response.StatusCode,
                result
            );
        }

        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetById(int id)
        {
            var client = CreateClient();

            var response = await client.GetAsync(
                $"api/purchasing/qc-inspections/{id}"
            );

            var result =
                await response.Content.ReadAsStringAsync();

            return StatusCode(
                (int)response.StatusCode,
                result
            );
        }

        [HttpPost("{id:int}/save-inspection")]
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

            var result =
                await response.Content.ReadAsStringAsync();

            return StatusCode(
                (int)response.StatusCode,
                result
            );
        }

        [HttpPost("{id:int}/complete")]
        public async Task<IActionResult> CompleteInspection(int id)
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

            var result =
                await response.Content.ReadAsStringAsync();

            return StatusCode(
                (int)response.StatusCode,
                result
            );
        }
    }
}