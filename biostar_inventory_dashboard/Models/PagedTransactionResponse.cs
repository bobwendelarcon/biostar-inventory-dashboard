namespace biostar_inventory_dashboard.Models
{
    public class PagedTransactionResponse
    {
        public int total { get; set; }
        public int page { get; set; }
        public int pageSize { get; set; }
        public List<TransactionItem> data { get; set; } = new();
    }
}