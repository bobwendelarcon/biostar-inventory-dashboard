using Microsoft.AspNetCore.Mvc;
using System.Text;
using System.Text.Json;

namespace biostar_inventory_dashboard.Controllers.Purchasing.PurchaseOrders
{
    [Route("purchasing/purchase-orders")]
    public class PurchaseOrdersController : Controller
    {
        private readonly IHttpClientFactory _httpClientFactory;

        public PurchaseOrdersController(IHttpClientFactory httpClientFactory)
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
            return View("~/Views/Purchasing/PurchaseOrders/Index.cshtml");
        }

        [HttpGet("create/{canvassId}")]
        public IActionResult Create(int canvassId)
        {
            ViewBag.CanvassId = canvassId;
            return View("~/Views/Purchasing/PurchaseOrders/Create.cshtml");
        }

        [HttpGet("details/{id}")]
        public IActionResult Details(int id)
        {
            ViewBag.PoId = id;
            return View("~/Views/Purchasing/PurchaseOrders/Details.cshtml");
        }

        [HttpGet("list")]
        public async Task<IActionResult> List()
        {
            var client = CreateClient();
            var result = await client.GetStringAsync("api/purchasing/purchase-orders");

            return Content(result, "application/json");
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var client = CreateClient();
            var result = await client.GetStringAsync($"api/purchasing/purchase-orders/{id}");

            return Content(result, "application/json");
        }

        [HttpGet("next-number")]
        public async Task<IActionResult> GetNextNumber()
        {
            try
            {
                var client = CreateClient();
                var result = await client.GetStringAsync("api/purchasing/purchase-orders/next-number");

                return Content(result, "application/json");
            }
            catch (Exception ex)
            {
                return BadRequest(new
                {
                    message = ex.Message
                });
            }
        }

        [HttpPost("create")]
        public async Task<IActionResult> CreatePo([FromBody] object payload)
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
                "api/purchasing/purchase-orders",
                content
            );

            var result = await response.Content.ReadAsStringAsync();

            return StatusCode((int)response.StatusCode, result);
        }

        [HttpGet("create-options/{canvassId}")]
        public async Task<IActionResult> GetCreateOptions(int canvassId)
        {
            var client = CreateClient();
            var result = await client.GetStringAsync(
                $"api/purchasing/purchase-orders/create-options/{canvassId}"
            );

            return Content(result, "application/json");
        }

        [HttpPost("{id}/submit")]
        public async Task<IActionResult> Submit(int id)
        {
            var client = CreateClient();

            var content = new StringContent(
                JsonSerializer.Serialize(new { }),
                Encoding.UTF8,
                "application/json"
            );

            var response = await client.PostAsync(
                $"api/purchasing/purchase-orders/{id}/submit",
                content
            );

            var result = await response.Content.ReadAsStringAsync();

            return StatusCode((int)response.StatusCode, result);
        }

        [HttpPost("{id}/approve")]
        public async Task<IActionResult> Approve(int id)
        {
            var client = CreateClient();

            var content = new StringContent(
                JsonSerializer.Serialize(new { }),
                Encoding.UTF8,
                "application/json"
            );

            var response = await client.PostAsync(
                $"api/purchasing/purchase-orders/{id}/approve",
                content
            );

            var result = await response.Content.ReadAsStringAsync();

            return StatusCode((int)response.StatusCode, result);
        }

        [HttpPost("{id}/cancel")]
        public async Task<IActionResult> Cancel(int id)
        {
            var client = CreateClient();

            var content = new StringContent(
                JsonSerializer.Serialize(new { }),
                Encoding.UTF8,
                "application/json"
            );

            var response = await client.PostAsync(
                $"api/purchasing/purchase-orders/{id}/cancel",
                content
            );

            var result = await response.Content.ReadAsStringAsync();

            return StatusCode((int)response.StatusCode, result);
        }

        [HttpGet("edit/{id}")]
        public IActionResult Edit(int id)
        {
            ViewBag.PoId = id;
            return View("~/Views/Purchasing/PurchaseOrders/Edit.cshtml");
        }

        [HttpGet("details-json/{id}")]
        public async Task<IActionResult> DetailsJson(int id)
        {
            var client = CreateClient();
            var result = await client.GetStringAsync($"api/purchasing/purchase-orders/{id}");
            return Content(result, "application/json");
        }

        [HttpPost("update/{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] object dto)
        {
            var client = CreateClient();

            var content = new StringContent(
                JsonSerializer.Serialize(dto),
                Encoding.UTF8,
                "application/json"
            );

            var response = await client.PutAsync(
                $"api/purchasing/purchase-orders/{id}",
                content
            );

            var result = await response.Content.ReadAsStringAsync();

            return StatusCode((int)response.StatusCode, result);
        }
    }
}