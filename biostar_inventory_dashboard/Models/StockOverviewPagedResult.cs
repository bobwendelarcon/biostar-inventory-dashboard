namespace biostar_inventory_dashboard.Models
{
    public class StockOverviewPagedResult
    {
        public List<InventoryProductSummaryDto> Data { get; set; } = new();

        public int Page { get; set; }

        public int PageSize { get; set; }

        public int Total { get; set; }

        public int TotalPages { get; set; }
    }
}