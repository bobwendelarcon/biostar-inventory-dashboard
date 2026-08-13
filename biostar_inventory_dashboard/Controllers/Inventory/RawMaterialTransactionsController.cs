using biostar_inventory_dashboard.Services;
using Microsoft.AspNetCore.Mvc;

namespace biostar_inventory_dashboard.Controllers.Inventory
{
    [Route("inventory/raw-material-transactions")]
    public class RawMaterialTransactionsController : Controller
    {
        private readonly ApiService _apiService;

        public RawMaterialTransactionsController(
            ApiService apiService)
        {
            _apiService = apiService;
        }

        [HttpGet("")]
        public IActionResult Index()
        {
            return View(
                "~/Views/Inventory/RawMaterialTransactions/Index.cshtml"
            );
        }

        [HttpGet("data")]
        public async Task<IActionResult> GetData(
            string search = "",
            string branchId = "",
            string movement = "",
            string transactionType = "",
            string fromDate = "",
            string toDate = "")
        {
            try
            {
                var result =
                    await _apiService
                        .GetRawMaterialTransactionsAsync(
                            search,
                            branchId,
                            movement,
                            transactionType,
                            fromDate,
                            toDate);

                return Content(
                    result,
                    "application/json"
                );
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = ex.Message
                });
            }
        }
    }
}