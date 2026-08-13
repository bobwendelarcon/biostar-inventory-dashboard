using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;

namespace biostar_inventory_dashboard.Controllers.Purchasing
{
    [Route("purchasing/supplier-evaluation")]
    public class SupplierEvaluationController : Controller
    {
        private readonly IHttpClientFactory _httpClientFactory;

        public SupplierEvaluationController(
            IHttpClientFactory httpClientFactory)
        {
            _httpClientFactory = httpClientFactory;
        }

        private HttpClient CreateClient()
        {
            return _httpClientFactory.CreateClient("ApiClient");
        }

        private string? GetCurrentUserId()
        {
            return User.FindFirstValue("user_id")
                ?? User.FindFirstValue("UserId")
                ?? User.FindFirstValue("userId")
                ?? User.FindFirstValue("id")
                ?? User.FindFirstValue(ClaimTypes.NameIdentifier)
                ?? User.FindFirstValue("sub")
                ?? User.Identity?.Name;
        }

        private IActionResult UnauthorizedUser()
        {
            return Unauthorized(new
            {
                success = false,
                message =
                    "Dashboard login does not contain a valid user ID."
            });
        }

        private static async Task<IActionResult> ForwardResponse(
            HttpResponseMessage response)
        {
            var result =
                await response.Content.ReadAsStringAsync();

            return new ContentResult
            {
                StatusCode = (int)response.StatusCode,
                Content = string.IsNullOrWhiteSpace(result)
                    ? "{}"
                    : result,
                ContentType = "application/json"
            };
        }

        private static JsonObject ConvertToJsonObject(
            object dto)
        {
            var json =
                JsonSerializer.Serialize(dto);

            return JsonNode.Parse(json)?.AsObject()
                ?? new JsonObject();
        }

        private static StringContent CreateJsonContent(
            JsonObject payload)
        {
            return new StringContent(
                payload.ToJsonString(),
                Encoding.UTF8,
                "application/json");
        }


        // ============================================================
        // PAGES
        // ============================================================

        [HttpGet("")]
        public IActionResult Index()
        {
            return View(
                "~/Views/SupplierEvaluation/Index.cshtml");
        }

        [HttpGet("details/{id:int}")]
        public IActionResult Details(int id)
        {
            ViewBag.EvaluationId = id;

            return View(
                "~/Views/SupplierEvaluation/Details.cshtml");
        }


        // ============================================================
        // SUPPLIERS
        // ============================================================

        [HttpGet("suppliers")]
        public async Task<IActionResult> GetSuppliers()
        {
            var client = CreateClient();

            var response = await client.GetAsync(
                "api/purchasing/suppliers");

            return await ForwardResponse(response);
        }


        // ============================================================
        // EVALUATION LIST
        // ============================================================

        [HttpGet("list")]
        public async Task<IActionResult> GetEvaluations(
            int? supplierId,
            int? year,
            int? month,
            string? status,
            string? search)
        {
            var parameters =
                new List<string>();

            if (supplierId.HasValue &&
                supplierId.Value > 0)
            {
                parameters.Add(
                    $"supplierId={supplierId.Value}");
            }

            if (year.HasValue &&
                year.Value >= 2000)
            {
                parameters.Add(
                    $"evaluationYear={year.Value}");
            }

            if (month.HasValue &&
                month.Value is >= 1 and <= 12)
            {
                parameters.Add(
                    $"evaluationMonth={month.Value}");
            }

            if (!string.IsNullOrWhiteSpace(status))
            {
                parameters.Add(
                    "status=" +
                    Uri.EscapeDataString(
                        status.Trim()));
            }

            if (!string.IsNullOrWhiteSpace(search))
            {
                parameters.Add(
                    "search=" +
                    Uri.EscapeDataString(
                        search.Trim()));
            }

            var url =
                "api/purchasing/supplier-evaluations";

            if (parameters.Count > 0)
            {
                url += "?" +
                    string.Join("&", parameters);
            }

            var client = CreateClient();

            var response =
                await client.GetAsync(url);

            return await ForwardResponse(response);
        }


        // ============================================================
        // MONTHLY SUMMARY
        // ============================================================

        [HttpGet("monthly-summary")]
        public async Task<IActionResult> GetMonthlySummary(
            int year,
            int month)
        {
            if (year < 2000)
            {
                return BadRequest(new
                {
                    success = false,
                    message = "Invalid evaluation year."
                });
            }

            if (month is < 1 or > 12)
            {
                return BadRequest(new
                {
                    success = false,
                    message = "Invalid evaluation month."
                });
            }

            var client = CreateClient();

            var response = await client.GetAsync(
                $"api/purchasing/supplier-evaluations/" +
                $"summary/{year}/{month}");

            return await ForwardResponse(response);
        }


        // ============================================================
        // DETAILS
        // ============================================================

        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetById(
            int id)
        {
            if (id <= 0)
            {
                return BadRequest(new
                {
                    success = false,
                    message =
                        "Invalid evaluation ID."
                });
            }

            var client = CreateClient();

            var response = await client.GetAsync(
                $"api/purchasing/supplier-evaluations/{id}");

            return await ForwardResponse(response);
        }


        // ============================================================
        // RELIABILITY / PURCHASING INPUT
        // ============================================================

        [HttpPut("{id:int}/reliability")]
        public async Task<IActionResult> SaveReliability(
            int id,
            [FromBody] object dto)
        {
            if (id <= 0)
            {
                return BadRequest(new
                {
                    success = false,
                    message =
                        "Invalid evaluation ID."
                });
            }

            var userId =
                GetCurrentUserId();

            if (string.IsNullOrWhiteSpace(userId))
            {
                return UnauthorizedUser();
            }

            var payload =
                ConvertToJsonObject(dto);

            payload["updatedBy"] =
                userId.Trim();

            var client =
                CreateClient();

            using var request =
                new HttpRequestMessage(
                    HttpMethod.Put,
                    $"api/purchasing/supplier-evaluations/" +
                    $"{id}/reliability");

            request.Content =
                CreateJsonContent(payload);

            request.Headers.TryAddWithoutValidation(
                "X-User-Id",
                userId.Trim());

            var response =
                await client.SendAsync(request);

            return await ForwardResponse(response);
        }


        // ============================================================
        // FINALIZE
        // ============================================================

        [HttpPost("{id:int}/finalize")]
        public async Task<IActionResult> Finalize(
            int id,
            [FromBody] object dto)
        {
            if (id <= 0)
            {
                return BadRequest(new
                {
                    success = false,
                    message =
                        "Invalid evaluation ID."
                });
            }

            var userId =
                GetCurrentUserId();

            if (string.IsNullOrWhiteSpace(userId))
            {
                return UnauthorizedUser();
            }

            var payload =
                ConvertToJsonObject(dto);

            payload["actionBy"] =
                userId.Trim();

            var client =
                CreateClient();

            using var request =
                new HttpRequestMessage(
                    HttpMethod.Post,
                    $"api/purchasing/supplier-evaluations/" +
                    $"{id}/finalize");

            request.Content =
                CreateJsonContent(payload);

            request.Headers.TryAddWithoutValidation(
                "X-User-Id",
                userId.Trim());

            var response =
                await client.SendAsync(request);

            return await ForwardResponse(response);
        }
    }
}