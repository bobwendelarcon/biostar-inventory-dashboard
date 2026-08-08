namespace biostar_inventory_dashboard.Models.Inventory
{
    public class RawMaterialInventoryViewModel
    {
        public string Search { get; set; } = "";

        public string BranchId { get; set; } = "";

        public int? CategoryId { get; set; }

        public string StockStatus { get; set; } = "";

        public string ExpiryStatus { get; set; } = "";

        public string FromDate { get; set; } = "";

        public string ToDate { get; set; } = "";
    }
}