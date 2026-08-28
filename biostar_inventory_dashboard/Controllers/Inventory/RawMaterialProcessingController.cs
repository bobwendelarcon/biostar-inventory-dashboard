using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using System.Text;
using System.Text.Json;

namespace biostar_inventory_dashboard.Controllers.Inventory
{
    [Route("inventory/raw-material-processing")]
    public class RawMaterialProcessingController : Controller
    {
        private readonly IHttpClientFactory _httpClientFactory;

        public RawMaterialProcessingController(
            IHttpClientFactory httpClientFactory)
        {
            _httpClientFactory = httpClientFactory;
        }

        private HttpClient CreateClient()
        {
            return _httpClientFactory.CreateClient("ApiClient");
        }

        private string? GetUserId()
        {
            return
                User.FindFirstValue("user_id")
                ?? User.FindFirstValue("UserId")
                ?? User.FindFirstValue("userId")
                ?? User.FindFirstValue("id")
                ?? User.FindFirstValue(ClaimTypes.NameIdentifier)
                ?? User.FindFirstValue("sub")
                ?? User.Identity?.Name;
        }

        [HttpGet]
        public IActionResult Index()
        {
            return View(
                "~/Views/Inventory/RawMaterialProcessing/Index.cshtml"
            );
        }

        [HttpGet("list")]
        public async Task<IActionResult> List()
        {
            var client = CreateClient();

            var response = await client.GetAsync(
                "api/inventory/raw-material-processing"
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
        // START WEIGHING
        // ============================================================

        [HttpPost("lines/{id:int}/start-weighing")]
        public async Task<IActionResult> StartWeighing(int id)
        {
            try
            {
                var userId = GetUserId();

                if (string.IsNullOrWhiteSpace(userId))
                {
                    return Unauthorized(new
                    {
                        message = "Dashboard login does not contain a valid user ID."
                    });
                }

                var client = CreateClient();

                using var request = new HttpRequestMessage(
                    HttpMethod.Post,
                    $"api/inventory/raw-material-processing/lines/{id}/start-weighing"
                );

                request.Headers.TryAddWithoutValidation(
                    "X-User-Id",
                    userId.Trim()
                );

                request.Content = new StringContent(
                    "{}",
                    Encoding.UTF8,
                    "application/json"
                );

                var response =
                    await client.SendAsync(request);

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

        // ============================================================
        // COMPLETE WEIGHING
        // ============================================================

        [HttpPost("lines/{id:int}/complete-weighing")]
        public async Task<IActionResult> CompleteWeighing(
            int id,
            [FromBody] object dto)
        {
            try
            {
                var userId = GetUserId();

                if (string.IsNullOrWhiteSpace(userId))
                {
                    return Unauthorized(new
                    {
                        message = "Dashboard login does not contain a valid user ID."
                    });
                }

                var client = CreateClient();

                using var request = new HttpRequestMessage(
                    HttpMethod.Post,
                    $"api/inventory/raw-material-processing/lines/{id}/complete-weighing"
                );

                request.Headers.TryAddWithoutValidation(
                    "X-User-Id",
                    userId.Trim()
                );

                request.Content = new StringContent(
                    JsonSerializer.Serialize(dto),
                    Encoding.UTF8,
                    "application/json"
                );

                var response =
                    await client.SendAsync(request);

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

        // ============================================================
        // COMPLETE STICKER
        // ============================================================

        [HttpPost("lines/{id:int}/complete-sticker")]
        public async Task<IActionResult> CompleteSticker(int id)
        {
            try
            {
                var userId = GetUserId();

                if (string.IsNullOrWhiteSpace(userId))
                {
                    return Unauthorized(new
                    {
                        message = "Dashboard login does not contain a valid user ID."
                    });
                }

                var client = CreateClient();

                using var request = new HttpRequestMessage(
                    HttpMethod.Post,
                    $"api/inventory/raw-material-processing/lines/{id}/complete-sticker"
                );

                request.Headers.TryAddWithoutValidation(
                    "X-User-Id",
                    userId.Trim()
                );

                request.Content = new StringContent(
                    "{}",
                    Encoding.UTF8,
                    "application/json"
                );

                var response =
                    await client.SendAsync(request);

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

        // ============================================================
        // CREATE FINAL RR
        // ============================================================

        [HttpPost("processing/{processingId:int}/final-rr")]
        public async Task<IActionResult> CreateFinalRr(
            int processingId,
            [FromBody] object dto)
        {
            try
            {
                var userId = GetUserId();

                if (string.IsNullOrWhiteSpace(userId))
                {
                    return Unauthorized(new
                    {
                        message = "Dashboard login does not contain a valid user ID."
                    });
                }

                var client = CreateClient();

                using var request = new HttpRequestMessage(
                    HttpMethod.Post,
                    $"api/inventory/final-receiving/processing/{processingId}"
                );

                request.Headers.TryAddWithoutValidation(
                    "X-User-Id",
                    userId.Trim()
                );

                request.Content = new StringContent(
                    JsonSerializer.Serialize(dto),
                    Encoding.UTF8,
                    "application/json"
                );

                var response =
                    await client.SendAsync(request);

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


        // ============================================================
        // COMMIT FINAL RR TO INVENTORY
        // ============================================================

        [HttpPost("processing/{processingId:int}/commit-final-rr")]
        public async Task<IActionResult> CommitFinalRr(
            int processingId,
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
                        $"api/inventory/final-receiving/processing/{processingId}/commit"
                    );

                request.Headers.TryAddWithoutValidation(
                    "X-User-Id",
                    userId.Trim()
                );

                request.Content =
                    new StringContent(
                        JsonSerializer.Serialize(dto),
                        Encoding.UTF8,
                        "application/json"
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
    }
}