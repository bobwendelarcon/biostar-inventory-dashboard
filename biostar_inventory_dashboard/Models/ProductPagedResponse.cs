namespace biostar_inventory_dashboard.Models
{
    public class ProductPagedResponse
    {
        public List<object> items { get; set; } = new();
        public int page { get; set; }
        public int pageSize { get; set; }
        public int totalRecords { get; set; }
        public int totalPages { get; set; }
    }
}
