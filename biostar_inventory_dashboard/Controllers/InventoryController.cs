using biostar_inventory_dashboard.Services;
using Microsoft.AspNetCore.Mvc;
using System.Text.Json;
using ClosedXML.Excel;

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
            string product = "",
            string warehouse = "",
            string stockStatus = "",
            string expiryStatus = "",
            string months = "",
            string from = "",
            string to = "",
            string order = "desc"
        )
        {
            var items = await _apiService.GetInventoryAsync(
                page,
                pageSize,
                lot_no,
                product,
                warehouse,
                stockStatus,
                expiryStatus,
                months,
                from,
                to,
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
    string product = "",
    string warehouse = "",
    string stockStatus = "",
    string expiryStatus = "",
    string months = "",
    string from = "",
    string to = "",
    string order = "desc"
)
        {
            var result = await _apiService.GetInventoryAsync(
                1, 100000,
                lot_no, product, warehouse,
                stockStatus, expiryStatus, months,
                from, to, order
            );

            var items = result.Data ?? new();

            using var workbook = new XLWorkbook();
            var ws = workbook.Worksheets.Add("Inventory List");

            ws.Cell(1, 1).Value = "Product / Description";
            ws.Cell(1, 2).Value = "Qty On Hand";
            ws.Cell(1, 3).Value = "Reserved Qty";
            ws.Cell(1, 4).Value = "Available Qty";
            ws.Cell(1, 5).Value = "UOM";
            ws.Cell(1, 6).Value = "Lot No";
            ws.Cell(1, 7).Value = "MFG Date";
            ws.Cell(1, 8).Value = "EXP Date";
            ws.Cell(1, 9).Value = "Warehouse";

            int row = 2;

            foreach (var item in items)
            {
                ws.Cell(row, 1).Value = item.description;
                ws.Cell(row, 2).Value = item.qty;
                ws.Cell(row, 3).Value = item.reserved_qty;
                ws.Cell(row, 4).Value = item.available_qty;
                ws.Cell(row, 5).Value = item.uom;
                ws.Cell(row, 6).Value = item.lot_no;
                ws.Cell(row, 7).Value = item.manufacturing_date;
                ws.Cell(row, 8).Value = item.expiration_date;
                ws.Cell(row, 9).Value = item.warehouse;

                row++;
            }

            ws.Range(1, 1, 1, 9).Style.Font.Bold = true;
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



    }
}