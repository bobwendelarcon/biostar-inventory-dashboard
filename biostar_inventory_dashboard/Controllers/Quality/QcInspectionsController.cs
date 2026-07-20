using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
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
            try
            {
                var userId =
                    User.FindFirstValue("user_id")
                    ?? User.FindFirstValue("UserId")
                    ?? User.FindFirstValue("userId")
                    ?? User.FindFirstValue("id")
                    ?? User.FindFirstValue(ClaimTypes.NameIdentifier)
                    ?? User.FindFirstValue("sub")
                    ?? User.Identity?.Name;

                if (string.IsNullOrWhiteSpace(userId))
                {
                    return Unauthorized(new
                    {
                        message =
                            "Dashboard login does not contain a valid user ID."
                    });
                }

                var client = CreateClient();

                using var request = new HttpRequestMessage(
                    HttpMethod.Post,
                    $"api/purchasing/qc-inspections/{id}/save-inspection"
                );

                request.Content = new StringContent(
                    JsonSerializer.Serialize(dto),
                    Encoding.UTF8,
                    "application/json"
                );

                request.Headers.TryAddWithoutValidation(
                    "X-User-Id",
                    userId.Trim()
                );

                var response = await client.SendAsync(request);

                var result =
                    await response.Content.ReadAsStringAsync();

                return new ContentResult
                {
                    StatusCode = (int)response.StatusCode,
                    Content = result,
                    ContentType = "application/json"
                };
            }
            catch (Exception ex)
            {
                return BadRequest(new
                {
                    message = ex.Message
                });
            }
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