using Microsoft.AspNetCore.Mvc;
using System.Text;
using System.Text.Json;

namespace biostar_inventory_dashboard.Controllers.Purchasing
{
    [Route("purchasing/mprf")]
    public class MprfController : Controller
    {
        private readonly IHttpClientFactory _httpClientFactory;

        public MprfController(IHttpClientFactory httpClientFactory)
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
            return View("~/Views/Purchasing/Mprf/Index.cshtml");
        }

        [HttpGet("create")]
        public IActionResult Create()
        {
            return View("~/Views/Purchasing/Mprf/Create.cshtml");
        }

        [HttpGet("list")]
        public async Task<IActionResult> GetList()
        {
            var client = CreateClient();

            var userId = User.FindFirst("user_id")?.Value
                         ?? User.FindFirst("UserId")?.Value;

            var url = "api/purchasing/mprf";

            if (!string.IsNullOrWhiteSpace(userId))
            {
                url += $"?userId={Uri.EscapeDataString(userId)}";
            }

            var json = await client.GetStringAsync(url);

            var data = JsonSerializer.Deserialize<List<Dictionary<string, object?>>>(json,
                new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                }) ?? new();

            foreach (var item in data)
            {
                var requestedBy = item.ContainsKey("requested_by")
                    ? item["requested_by"]?.ToString()
                    : null;

                var status = item.ContainsKey("status")
                    ? item["status"]?.ToString()
                    : null;

                item["can_edit"] =
                    !string.IsNullOrWhiteSpace(userId)
                    && requestedBy == userId
                   && (status == "DRAFT" || status == "RETURNED");
            }

            return Json(data);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var client = CreateClient();
            var result = await client.GetStringAsync($"api/purchasing/mprf/{id}");
            return Content(result, "application/json");
        }

        [HttpPost("create")]
        public async Task<IActionResult> CreateMprf([FromBody] JsonElement dto)
        {
            var client = CreateClient();

            var userId = User.FindFirst("user_id")?.Value
                         ?? User.FindFirst("UserId")?.Value;

            using var document = JsonDocument.Parse(dto.GetRawText());
            var root = document.RootElement;

            var payload = new Dictionary<string, object?>
            {
                ["mprf_no"] = root.TryGetProperty("mprf_no", out var mprfNo) ? mprfNo.GetString() : null,
                ["category"] = root.TryGetProperty("category", out var category) ? category.GetString() : null,
                ["request_date"] = root.TryGetProperty("request_date", out var requestDate) ? requestDate.GetString() : null,
                ["week"] = root.TryGetProperty("week", out var week) ? week.GetString() : null,
                ["requested_by"] = userId,
                ["lines"] = root.TryGetProperty("lines", out var lines)
                    ? JsonSerializer.Deserialize<object>(lines.GetRawText())
                    : new List<object>()
            };

            var content = new StringContent(
                JsonSerializer.Serialize(payload),
                Encoding.UTF8,
                "application/json"
            );

            var response = await client.PostAsync("api/purchasing/mprf", content);
            var result = await response.Content.ReadAsStringAsync();

            return StatusCode((int)response.StatusCode, result);
        }
        [HttpPost("{id}/submit")]
        public async Task<IActionResult> Submit(int id)
        {
            var client = CreateClient();

            var response = await client.PostAsync($"api/purchasing/mprf/{id}/submit", null);
            var result = await response.Content.ReadAsStringAsync();

            return StatusCode((int)response.StatusCode, result);
        }

        [HttpPost("delete/{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var client = CreateClient();

            var response = await client.DeleteAsync($"api/purchasing/mprf/{id}");
            var result = await response.Content.ReadAsStringAsync();

            return StatusCode((int)response.StatusCode, result);
        }

        [HttpGet("materials/lookup")]
        public async Task<IActionResult> GetMaterialsLookup([FromQuery] string? search = null)
        {
            var client = CreateClient();

            var url = "api/manufacturing/materials/lookup";

            if (!string.IsNullOrWhiteSpace(search))
            {
                url += $"?search={Uri.EscapeDataString(search)}";
            }

            var response = await client.GetAsync(url);
            var result = await response.Content.ReadAsStringAsync();

            return StatusCode((int)response.StatusCode, result);
        }


        [HttpGet("view/{id}")]
        public IActionResult ViewMprf(int id)
        {
            ViewBag.MprfId = id;
            ViewBag.Mode = "VIEW";
            return View("~/Views/Purchasing/Mprf/View.cshtml");
        }

        [HttpGet("edit/{id}")]
        public IActionResult Edit(int id)
        {
            ViewBag.MprfId = id;
            ViewBag.Mode = "EDIT";

            return View("~/Views/Purchasing/Mprf/Create.cshtml");
        }

        [HttpPost("update/{id}")]
        public async Task<IActionResult> UpdateMprf(int id, [FromBody] JsonElement dto)
        {
            var client = CreateClient();

            var userId = User.FindFirst("user_id")?.Value
                         ?? User.FindFirst("UserId")?.Value;

            if (string.IsNullOrWhiteSpace(userId))
                return Unauthorized("Dashboard user account not found.");

            using var document = JsonDocument.Parse(dto.GetRawText());
            var root = document.RootElement;

            var payload = new Dictionary<string, object?>
            {
                ["mprf_no"] = root.TryGetProperty("mprf_no", out var mprfNo) ? mprfNo.GetString() : null,
                ["category"] = root.TryGetProperty("category", out var category) ? category.GetString() : null,
                ["request_date"] = root.TryGetProperty("request_date", out var requestDate) ? requestDate.GetString() : null,
                ["week"] = root.TryGetProperty("week", out var week) ? week.GetString() : null,
                ["requested_by"] = userId,
                ["lines"] = root.TryGetProperty("lines", out var lines)
                    ? JsonSerializer.Deserialize<object>(lines.GetRawText())
                    : new List<object>()
            };

            var content = new StringContent(
                JsonSerializer.Serialize(payload),
                Encoding.UTF8,
                "application/json"
            );

            var response = await client.PutAsync($"api/purchasing/mprf/{id}", content);
            var result = await response.Content.ReadAsStringAsync();

            return StatusCode((int)response.StatusCode, result);
        }


        //MPRF Review

        [HttpGet("review")]
        public IActionResult Review()
        {
            return View("~/Views/Purchasing/Mprf/Review.cshtml");
        }

        [HttpGet("review-list")]
        public async Task<IActionResult> GetReviewList()
        {
            var client = CreateClient();
            var result = await client.GetStringAsync("api/purchasing/mprf/review-list");
            return Content(result, "application/json");
        }
        [HttpPost("{id}/review")]
        public async Task<IActionResult> ReviewMprf(int id, [FromBody] JsonElement dto)
        {
            var client = CreateClient();

            var userId = User.FindFirst("user_id")?.Value
                         ?? User.FindFirst("UserId")?.Value;

            if (string.IsNullOrWhiteSpace(userId))
                return Unauthorized("Dashboard user account not found.");

            using var document = JsonDocument.Parse(dto.GetRawText());
            var root = document.RootElement;

            var payload = new Dictionary<string, object?>
            {
                ["reviewed_by"] = userId,
                ["review_decision"] = root.TryGetProperty("review_decision", out var decision)
                    ? decision.GetString()
                    : null,
                ["review_remarks"] = root.TryGetProperty("review_remarks", out var remarks)
                    ? remarks.GetString()
                    : null,
                ["lines"] = root.TryGetProperty("lines", out var lines)
                    ? JsonSerializer.Deserialize<object>(lines.GetRawText())
                    : new List<object>()
            };

            var content = new StringContent(
                JsonSerializer.Serialize(payload),
                Encoding.UTF8,
                "application/json"
            );

            var response = await client.PostAsync($"api/purchasing/mprf/{id}/review", content);
            var result = await response.Content.ReadAsStringAsync();

            return StatusCode((int)response.StatusCode, result);
        }

      //  canvassing

        [HttpGet("canvassing")]
        public IActionResult Canvassing()
        {
            return View("~/Views/Purchasing/Mprf/Canvassing.cshtml");
        }

     //   supplier

        [HttpGet("suppliers")]
        public IActionResult Suppliers()
        {
            return View("~/Views/Purchasing/Suppliers/Index.cshtml");
        }

        //supplier evaluation
        [HttpGet("supplier-evaluation")]
        public IActionResult SupplierEvaluation()
        {
            return View("~/Views/Purchasing/SupplierEvaluation/Index.cshtml");
        }


        //MPRF NO

        [HttpGet("next-no")]
        public async Task<IActionResult> GetNextMprfNo()
        {
            var client = CreateClient();

            var response =
                await client.GetAsync(
                    "api/purchasing/mprf/next-no");

            var result =
                await response.Content.ReadAsStringAsync();

            return StatusCode(
                (int)response.StatusCode,
                result);
        }

        [HttpGet("materials/{materialId:int}/qty-on-hand")]
        public async Task<IActionResult> GetMaterialQtyOnHand(
            int materialId)
        {
            var client = CreateClient();

            var response =
                await client.GetAsync(
                    $"api/purchasing/mprf/materials/" +
                    $"{materialId}/qty-on-hand");

            var result =
                await response.Content.ReadAsStringAsync();

            return StatusCode(
                (int)response.StatusCode,
                result);
        }
    }
}