using System.Text.Json;

namespace biostar_inventory_dashboard.Models
{
    //public class InventoryItem
    //{
    //    public string transaction_id { get; set; }
    //    public string product_id { get; set; }
    //    public string branch_id { get; set; }
    //    public string transaction_type { get; set; }
    //    public string lot_no { get; set; }
    //    public DateTime? expiration_date { get; set; }
    //    public DateTime? manufacturing_date { get; set; }
    //    public int quantity { get; set; }
    //    public string scanned_by { get; set; }
    //    public DateTime? timestamp { get; set; }
    //    public int is_deleted { get; set; }
    //    public string notes { get; set; }
    //}



    public class InventoryItem
    {
        public string? product_id { get; set; }
        public string? description { get; set; }
        public string? uom { get; set; }
        public string? lot_no { get; set; }
        public string? warehouse { get; set; }
        public int qty { get; set; }
        public int? pack_qty { get; set; }
        public String? pack_uom { get; set; }
        public int stock_level { get; set; }
        public string? date { get; set; }
        public string? expiration_date { get; set; }
        public string? manufacturing_date { get; set; }
    }



}
