using biostar_inventory_dashboard.Services;
using ClosedXML.Excel;
using Microsoft.AspNetCore.Mvc;
using System.Net.Http;
using System.Text.Json;

namespace biostar_inventory_dashboard.Controllers
{
    public class InventoryController : Controller
    {
        private readonly ApiService _apiService;

        public InventoryController(ApiService apiService)
        {
            _apiService = apiService;
        }

        public IActionResult Index()
        {
            return View();
        }

        [HttpPost]
        public async Task<IActionResult> Transfer([FromBody] JsonElement data)
        {
            try
            {
                var result = await _apiService.TransferAsync(data.GetRawText());
                return Content(result, "application/json");
            }
            catch (Exception ex)
            {
                return StatusCode(500, ex.Message);
            }
        }

        [HttpGet]
        public async Task<IActionResult> GetBranches()
        {
            try
            {
                var branches = await _apiService.GetBranchesAsync();
                return Json(branches);
            }
            catch (Exception ex)
            {
                return StatusCode(500, ex.Message);
            }
        }


       

        [HttpGet]
        public async Task<IActionResult> GetInventory(
            int page = 1,
            int pageSize = 30,
            string lot_no = "",
            String search = "",
           string warehouse = "",
string category = "",
string stockStatus = "",
            string expiryStatus = "",
            string months = "",
            string from = "",
            string to = "",
            string sortBy = "lot",
            string order = "desc"
        )
        {
            var items = await _apiService.GetInventoryAsync(
      page,
      pageSize,
      lot_no,
     search,
      warehouse,
      category,
      stockStatus,
      expiryStatus,
      months,
      from,
      to,
      sortBy,
      order
  );

            return Json(items);
        }



        [HttpPost]
        public async Task<IActionResult> Adjust([FromBody] JsonElement data)
        {
            try
            {
                var result = await _apiService.AdjustAsync(data.GetRawText());
                return Content(result, "application/json");
            }
            catch (Exception ex)
            {
                return StatusCode(500, ex.ToString());
            }
        }

        [HttpGet]
        public async Task<IActionResult> GetHistory(string product_id, string lot_no, string branch_id)
        {
            try
            {
                var result = await _apiService.GetHistoryAsync(product_id, lot_no, branch_id);
                return Content(result, "application/json");
            }
            catch (Exception ex)
            {
                return StatusCode(500, ex.ToString());
            }
        }

        [HttpGet]
        public async Task<IActionResult> ExportExcel(
    string lot_no = "",
   string search = "",
string warehouse = "",
string category = "",
    string stockStatus = "",
    string expiryStatus = "",
    string months = "",
    string from = "",
    string to = "",
    string sortBy = "lot",
    string order = "desc"
)
        {
            var result = await _apiService.GetInventoryAsync(
      1,
      100000,
      lot_no,
      search,
      warehouse,
      category,
      stockStatus,
      expiryStatus,
      months,
      from,
     to,
sortBy,
order
  );

            var items = result.Data ?? new();

            using var workbook = new XLWorkbook();
            var ws = workbook.Worksheets.Add("Inventory List");

            ws.Cell(1, 1).Value = "Generic Name";
            ws.Cell(1, 2).Value = "Brand Name / Client";
            ws.Cell(1, 3).Value = "Qty On Hand";
            ws.Cell(1, 4).Value = "Reserved Qty";
            ws.Cell(1, 5).Value = "Available Qty";
            ws.Cell(1, 6).Value = "UOM";
            ws.Cell(1, 7).Value = "Lot No";
            ws.Cell(1, 8).Value = "MFG Date";
            ws.Cell(1, 9).Value = "EXP Date";
            ws.Cell(1, 10).Value = "Remaining Months";
            ws.Cell(1, 11).Value = "Warehouse";

            int row = 2;

            foreach (var item in items)
            {
                ws.Cell(row, 1).Value = item.description;           // Generic Name
                ws.Cell(row, 2).Value = item.product_description;   // Brand Name / Client

                ws.Cell(row, 3).Value = item.qty;
                ws.Cell(row, 4).Value = item.reserved_qty;
                ws.Cell(row, 5).Value = item.available_qty;
                ws.Cell(row, 6).Value = item.uom;
                ws.Cell(row, 7).Value = item.lot_no;
                if (DateTime.TryParse(item.manufacturing_date, out var mfgDate))
                {
                    ws.Cell(row, 8).Value = mfgDate.ToString("MMMM yyyy");
                }
                else
                {
                    ws.Cell(row, 9).Value = item.manufacturing_date;
                }

                if (DateTime.TryParse(item.expiration_date, out var expDate))
                {
                    ws.Cell(row, 10).Value = expDate.ToString("MMMM yyyy");
                }
                else
                {
                    ws.Cell(row, 11).Value = item.expiration_date;
                }


                string remainingMonthsText = "-";

                if (DateTime.TryParse(item.expiration_date, out var expDate2))
                {
                    var today = DateTime.Today;

                    int years = expDate2.Year - today.Year;
                    int monthDiff = expDate2.Month - today.Month;

                    int totalMonths = years * 12 + monthDiff;

                    if (expDate2.Day < today.Day)
                        totalMonths--;

                    if (totalMonths < 0)
                        remainingMonthsText = "Expired";
                    else
                        remainingMonthsText = $"{totalMonths} mo";
                }

                ws.Cell(row, 9).Value = remainingMonthsText;


                ws.Cell(row, 10).Value = item.warehouse;

                row++;
            }

            ws.Range(1, 1, 1, 10).Style.Font.Bold = true;
            ws.Columns().AdjustToContents();
            ws.SheetView.FreezeRows(1);
            ws.RangeUsed().SetAutoFilter();

            using var stream = new MemoryStream();
            workbook.SaveAs(stream);

            return File(
                stream.ToArray(),
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                $"InventoryList_{DateTime.Now:yyyyMMdd_HHmmss}.xlsx"
            );
        }


        [HttpPut]
        public async Task<IActionResult> RenameLot([FromBody] JsonElement data)
        {
            try
            {
                var result = await _apiService.RenameLotAsync(data.GetRawText());
                return Content(result, "application/json");
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }


        [HttpGet]
        public async Task<IActionResult> GetInventoryCategories()
        {
            try
            {
                var result = await _apiService.GetInventoryCategoriesAsync();
                return Content(result, "application/json");
            }
            catch (Exception ex)
            {
                return StatusCode(500, ex.Message);
            }
        }

        [HttpPut]
        public async Task<IActionResult> UpdateLotDates([FromBody] JsonElement data)
        {
            try
            {
                var result = await _apiService.UpdateLotDatesAsync(data.GetRawText());
                return Content(result, "application/json");
            }
            catch (Exception ex)
            {
                return StatusCode(500, ex.Message);
            }
        }

        [HttpGet]
        public async Task<IActionResult> Print(
    string lot_no = "",
    string search = "",
    string warehouse = "",
    string category = "",
    string stockStatus = "",
    string expiryStatus = "",
    string months = "",
    string from = "",
    string to = "",
    string sortBy = "lot",
    string order = "desc"
)
        {
            var result = await _apiService.GetInventoryAsync(
      1,
      100000,
      lot_no,
      search,
      warehouse,
      category,
      stockStatus,
      expiryStatus,
      months,
      from,
      to,
      sortBy,
      order
  );


            // Get warehouse name
            var branches = await _apiService.GetBranchesAsync();

            string warehouseName = "All";

            if (!string.IsNullOrWhiteSpace(warehouse))
            {
                foreach (JsonElement branch in branches)
                {
                    var branchId = branch.GetProperty("branch_id").GetString();

                    if (branchId == warehouse)
                    {
                        warehouseName = branch.GetProperty("branch_name").GetString()!;
                        break;
                    }
                }
            }

            ViewBag.GeneratedAt = DateTime.Now.ToString("MMMM dd, yyyy hh:mm tt");
            ViewBag.Warehouse = warehouseName;
            ViewBag.Category = string.IsNullOrWhiteSpace(category) ? "All" : category;
            ViewBag.StockStatus = stockStatus;
            ViewBag.ExpiryStatus = expiryStatus;
            ViewBag.TotalRecords = result.Data?.Count ?? 0;
            ViewBag.PrintedBy = User.Identity?.Name ?? "Unknown";

            return View("Print", result.Data ?? new());
        }


        [HttpGet]
        public async Task<IActionResult> PrintSummary(
    string search = "",
    string warehouse = "",
    string category = "",
    string stockStatus = "",
    string order = "asc")
        {
            try
            {
                var items =
                    await _apiService.GetInventoryPrintSummaryAsync(
                        search,
                        warehouse,
                        category,
                        stockStatus,
                        order
                    );

                var branches = await _apiService.GetBranchesAsync();

                string warehouseName = "All Warehouses";

                if (!string.IsNullOrWhiteSpace(warehouse))
                {
                    foreach (JsonElement branch in branches)
                    {
                        string branchId =
                            branch.TryGetProperty("branch_id", out var idProperty)
                                ? idProperty.GetString() ?? ""
                                : "";

                        if (branchId == warehouse)
                        {
                            warehouseName =
                                branch.TryGetProperty(
                                    "branch_name",
                                    out var nameProperty)
                                    ? nameProperty.GetString() ?? warehouse
                                    : warehouse;

                            break;
                        }
                    }
                }

                ViewBag.GeneratedAt =
                    DateTime.Now.ToString("MMMM dd, yyyy hh:mm tt");

                ViewBag.Warehouse = warehouseName;

                ViewBag.Category =
                    string.IsNullOrWhiteSpace(category)
                        ? "All Categories"
                        : category;

                ViewBag.StockStatus =
                    string.IsNullOrWhiteSpace(stockStatus)
                        ? "All"
                        : stockStatus;

                ViewBag.TotalRecords = items.Count;

                ViewBag.PrintedBy =
                    User.Identity?.Name ?? "Unknown";

                return View("PrintSummary", items);
            }
            catch (Exception ex)
            {
                return Content(
                    $"Failed to load inventory summary: {ex.Message}"
                );
            }
        }
    }
}