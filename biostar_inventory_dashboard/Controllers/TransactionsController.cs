using biostar_inventory_dashboard.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Text.Json;

namespace biostar_inventory_dashboard.Controllers
{
    [Authorize]
    public class TransactionsController : Controller
    {
        private readonly ApiService _apiService;

        public TransactionsController(ApiService apiService)
        {
            _apiService = apiService;
        }

        public IActionResult Index()
        {
            return View();
        }

        [HttpPut]
        public async Task<IActionResult> UpdateReference([FromBody] JsonElement data)
        {
            try
            {
                var result = await _apiService.UpdateTransactionReferenceAsync(data.GetRawText());
                return Content(result, "application/json");
            }
            catch (Exception ex)
            {
                return StatusCode(500, ex.Message);
            }
        }

        [HttpGet]
        public async Task<IActionResult> GetTransactions(
            int page = 1,
            int pageSize = 30,
            string lot_no = "",
            string product = "",
            string type = "",
            string from = "",
            string to = "",
            string scanned_by = "",
            string full_name = "",
            string reference = "",
            string warehouse = "",
            string order = "desc"
        )
        {
            var data = await _apiService.GetTransactionsAsync(
                page,
                pageSize,
                lot_no,
                product,
                type,
                from,
                to,
                scanned_by,
                full_name,
                reference,
                warehouse,
                order
            );

            return Json(data);
        }
    }
}