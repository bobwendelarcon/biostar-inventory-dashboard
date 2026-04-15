using biostar_inventory_dashboard.Models.biostar_inventory_dashboard.Models;

namespace biostar_inventory_dashboard.Models
{
    public class PagedInventoryResponse
    {
        public List<InventoryItem> Data { get; set; } = new();
        public int Total { get; set; }
        public int Page { get; set; }
        public int PageSize { get; set; }
    }
}