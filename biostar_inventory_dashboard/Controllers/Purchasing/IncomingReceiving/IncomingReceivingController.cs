using Microsoft.AspNetCore.Mvc;
using System.Text;
using System.Text.Json;

namespace biostar_inventory_dashboard.Controllers.Purchasing.IncomingReceiving
{
    [Route("purchasing/incoming-receiving")]
    public class IncomingReceivingController : Controller
    {
        private readonly IHttpClientFactory _httpClientFactory;

        public IncomingReceivingController(
            IHttpClientFactory httpClientFactory)
        {
            _httpClientFactory = httpClientFactory;
        }

        private HttpClient CreateClient()
        {
            return _httpClientFactory.CreateClient("ApiClient");
        }


        // ============================================================
        // GET SCHEDULE FOR INCOMING RECEIVING
        // ============================================================

        [HttpGet("schedule/{scheduleId:int}")]
        public async Task<IActionResult> GetSchedule(
            int scheduleId)
        {
            var client = CreateClient();

            var response = await client.GetAsync(
                $"api/purchasing/incoming-receiving/schedule/{scheduleId}"
            );

            var result =
                await response.Content.ReadAsStringAsync();

            return StatusCode(
                (int)response.StatusCode,
                result
            );
        }


        // ============================================================
        // NEXT IR NUMBER
        // ============================================================

        [HttpGet("next-number")]
        public async Task<IActionResult> GetNextNumber()
        {
            var client = CreateClient();

            var response = await client.GetAsync(
                "api/purchasing/incoming-receiving/next-number"
            );

            var result =
                await response.Content.ReadAsStringAsync();

            return StatusCode(
                (int)response.StatusCode,
                result
            );
        }


        // ============================================================
        // CREATE INCOMING RECEIVING
        // ============================================================

        [HttpPost]
        public async Task<IActionResult> Create(
            [FromBody] object payload)
        {
            var client = CreateClient();

            var userId =
                User.FindFirst("user_id")?.Value
                ?? User.FindFirst("UserId")?.Value
                ?? User.Identity?.Name
                ?? "";

            var userRole =
                User.FindFirst(
                    System.Security.Claims.ClaimTypes.Role
                )?.Value
                ?? User.FindFirst("role")?.Value
                ?? "";


            var json =
                JsonSerializer.Deserialize<
                    Dictionary<string, object>>(
                        JsonSerializer.Serialize(payload)
                    )
                ?? new Dictionary<string, object>();


            // Do not trust the browser for CreatedBy.
            // Use the logged-in Dashboard user.
            json["createdBy"] = userId;


            var content =
                new StringContent(
                    JsonSerializer.Serialize(json),
                    Encoding.UTF8,
                    "application/json"
                );


            var response = await client.PostAsync(
                "api/purchasing/incoming-receiving",
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