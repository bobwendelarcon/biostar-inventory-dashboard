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

        private static JsonObject ConvertToJsonObject(object dto)
        {
            var json = JsonSerializer.Serialize(dto);

            return JsonNode.Parse(json)?.AsObject()
                ?? new JsonObject();
        }

        private static StringContent CreateJsonContent(
            JsonObject payload)
        {
            return new StringContent(
                payload.ToJsonString(),
                Encoding.UTF8,
                "application/json"
            );
        }


        [HttpGet("preview")]
        public async Task<IActionResult> Preview(
    int supplierId,
    int year,
    int month)
        {
            if (supplierId <= 0)
            {
                return BadRequest(new
                {
                    success = false,
                    message = "Invalid supplier ID."
                });
            }

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
                "api/purchasing/supplier-evaluations/preview" +
                $"?supplierId={supplierId}" +
                $"&year={year}" +
                $"&month={month}"
            );

            return await ForwardResponse(response);
        }

        // ------------------------------------------------------------
        // Pages
        // ------------------------------------------------------------

        [HttpGet("")]
        public IActionResult Index()
        {
            return View(
                "~/Views/SupplierEvaluation/Index.cshtml"
            );
        }

        [HttpGet("details/{id:int}")]
        public IActionResult Details(int id)
        {
            ViewBag.EvaluationId = id;

            return View(
                "~/Views/SupplierEvaluation/Details.cshtml"
            );
        }

        // ------------------------------------------------------------
        // Suppliers
        // ------------------------------------------------------------

        [HttpGet("suppliers")]
        public async Task<IActionResult> GetSuppliers()
        {
            var client = CreateClient();

            var response = await client.GetAsync(
                "api/purchasing/suppliers"
            );

            return await ForwardResponse(response);
        }

        // ------------------------------------------------------------
        // Monthly summary/list
        // ------------------------------------------------------------

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
                $"api/purchasing/supplier-evaluations/summary/{year}/{month}"
            );

            return await ForwardResponse(response);
        }

        // ------------------------------------------------------------
        // Generate
        // ------------------------------------------------------------

        [HttpPost("generate")]
        public async Task<IActionResult> Generate(
            [FromBody] object dto)
        {
            var userId = GetCurrentUserId();

            if (string.IsNullOrWhiteSpace(userId))
            {
                return UnauthorizedUser();
            }

            var payload = ConvertToJsonObject(dto);

            payload["generatedBy"] = userId.Trim();

            var client = CreateClient();

            using var request = new HttpRequestMessage(
                HttpMethod.Post,
                "api/purchasing/supplier-evaluations/generate"
            );

            request.Content = CreateJsonContent(payload);

            request.Headers.TryAddWithoutValidation(
                "X-User-Id",
                userId.Trim()
            );

            var response = await client.SendAsync(request);

            return await ForwardResponse(response);
        }

        // ------------------------------------------------------------
        // Details
        // ------------------------------------------------------------

        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetById(int id)
        {
            if (id <= 0)
            {
                return BadRequest(new
                {
                    success = false,
                    message = "Invalid evaluation ID."
                });
            }

            var client = CreateClient();

            var response = await client.GetAsync(
                $"api/purchasing/supplier-evaluations/{id}"
            );

            return await ForwardResponse(response);
        }

        // ------------------------------------------------------------
        // Regenerate
        // ------------------------------------------------------------

        [HttpPost("{id:int}/regenerate")]
        public async Task<IActionResult> Regenerate(
            int id,
            [FromBody] object dto)
        {
            return await SendWorkflowRequest(
                id,
                "regenerate",
                dto
            );
        }

        // ------------------------------------------------------------
        // Workflow
        // ------------------------------------------------------------

   




        [HttpPost("{id:int}/finalize")]
        public async Task<IActionResult> Finalize(
            int id,
            [FromBody] object dto)
        {
            return await SendWorkflowRequest(
                id,
                "finalize",
                dto
            );
        }

        // ------------------------------------------------------------
        // Shared request methods
        // ------------------------------------------------------------

        private async Task<IActionResult> SendWorkflowRequest(
            int evaluationId,
            string actionRoute,
            object dto)
        {
            if (evaluationId <= 0)
            {
                return BadRequest(new
                {
                    success = false,
                    message = "Invalid evaluation ID."
                });
            }

            var userId = GetCurrentUserId();

            if (string.IsNullOrWhiteSpace(userId))
            {
                return UnauthorizedUser();
            }

            var payload = ConvertToJsonObject(dto);

            payload["actionBy"] = userId.Trim();

            return await SendPostRequest(
                "api/purchasing/supplier-evaluations/" +
                $"{evaluationId}/{actionRoute}",
                payload,
                userId
            );
        }

        private async Task<IActionResult> SendPostRequest(
            string apiUrl,
            JsonObject payload,
            string userId)
        {
            var client = CreateClient();

            using var request = new HttpRequestMessage(
                HttpMethod.Post,
                apiUrl
            );

            request.Content = CreateJsonContent(payload);

            request.Headers.TryAddWithoutValidation(
                "X-User-Id",
                userId.Trim()
            );

            var response = await client.SendAsync(request);

            return await ForwardResponse(response);
        }
    }
}