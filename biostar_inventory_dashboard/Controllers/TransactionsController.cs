using Microsoft.AspNetCore.Mvc;
using biostar_inventory_dashboard.Services;

namespace biostar_inventory_dashboard.Controllers
{
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
                reference,
                warehouse,
                order
            );

            return Json(data);
        }
    }
}