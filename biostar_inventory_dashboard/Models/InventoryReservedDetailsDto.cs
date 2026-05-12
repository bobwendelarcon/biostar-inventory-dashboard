namespace biostar_inventory_dashboard.Models
{
    public class InventoryReservedDetailDto
    {
        public string order_no { get; set; } = "";
        public string customer_name { get; set; } = "";
        public decimal reserved_qty { get; set; }
    }
}
