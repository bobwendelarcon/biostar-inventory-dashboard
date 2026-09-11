using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using System.Text;
using System.Text.Json;

namespace biostar_inventory_dashboard.Controllers.Quality
{
    [Route("quality/qa-qc-receiving")]
    public class QaQcReceivingController : Controller
    {
        private readonly IHttpClientFactory _httpClientFactory;

        public QaQcReceivingController(
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
            ViewBag.LoggedInFullName =
                User.FindFirstValue("full_name")
                ?? User.Identity?.Name
                ?? "";

            ViewBag.LoggedInUserId =
                User.FindFirstValue("user_id")
                ?? User.FindFirstValue("UserId")
                ?? User.FindFirstValue("userId")
                ?? User.FindFirstValue(ClaimTypes.NameIdentifier)
                ?? "";

            return View(
                "~/Views/Quality/QaQcReceiving/Index.cshtml"
            );
        }

        // ============================================================
        // GET RMW RECEIVING DETAILS FOR QA/QC
        // ============================================================
        [HttpGet("incoming/{incomingReceivingId:int}")]
        public async Task<IActionResult> GetIncoming(
            int incomingReceivingId)
        {
            var client = CreateClient();

            var response =
                await client.GetAsync(
                    $"api/purchasing/qa-qc-receiving/incoming/{incomingReceivingId}"
                );

            var result =
                await response.Content.ReadAsStringAsync();

            return new ContentResult
            {
                StatusCode = (int)response.StatusCode,
                Content = result,
                ContentType = "application/json"
            };
        }

        // ============================================================
        // NEXT QA/QC RECEIVING NUMBER
        // ============================================================
        [HttpGet("next-number")]
        public async Task<IActionResult> GetNextNumber()
        {
            var client = CreateClient();

            var response =
                await client.GetAsync(
                    "api/purchasing/qa-qc-receiving/next-number"
                );

            var result =
                await response.Content.ReadAsStringAsync();

            return new ContentResult
            {
                StatusCode = (int)response.StatusCode,
                Content = result,
                ContentType = "application/json"
            };
        }

        // ============================================================
        // SAVE QA/QC RECEIVING INSPECTION
        // ============================================================
        [HttpPost("save")]
        public async Task<IActionResult> SaveInspection(
            [FromBody] object dto)
        {
            try
            {
                var userId =
                    User.FindFirstValue("user_id")
                    ?? User.FindFirstValue("UserId")
                    ?? User.FindFirstValue("userId")
                    ?? User.FindFirstValue("id")
                    ?? User.FindFirstValue(
                        ClaimTypes.NameIdentifier)
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

                using var request =
                    new HttpRequestMessage(
                        HttpMethod.Post,
                        "api/purchasing/qa-qc-receiving/save"
                    );

                request.Content =
                    new StringContent(
                        JsonSerializer.Serialize(dto),
                        Encoding.UTF8,
                        "application/json"
                    );

                request.Headers.TryAddWithoutValidation(
                    "X-User-Id",
                    userId.Trim()
                );

                var response =
                    await client.SendAsync(request);

                var result =
                    await response.Content.ReadAsStringAsync();

                return new ContentResult
                {
                    StatusCode =
                        (int)response.StatusCode,

                    Content =
                        result,

                    ContentType =
                        "application/json"
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

        [HttpGet("pending")]
        public async Task<IActionResult> GetPending()
        {
            var client = CreateClient();

            var response =
                await client.GetAsync(
                    "api/purchasing/qa-qc-receiving/pending"
                );

            var result =
                await response.Content.ReadAsStringAsync();

            return new ContentResult
            {
                StatusCode =
                    (int)response.StatusCode,

                Content =
                    result,

                ContentType =
                    "application/json"
            };
        }
    }
}