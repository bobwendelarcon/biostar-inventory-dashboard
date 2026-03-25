using System.Text.Json;

namespace biostar_inventory_dashboard.Models
{



    public class TransactionItem
    {
        public string transaction_id { get; set; }
        public string product_id { get; set; }
        public string branch_id { get; set; }
        public string transaction_type { get; set; }
        public string lot_no { get; set; }
        public string expiration_date { get; set; }
        public string manufacturing_date { get; set; }
        public int quantity { get; set; }
        public string scanned_by { get; set; }
        public JsonElement timestamp { get; set; }
        //  public int is_deleted { get; set; }
        public string notes { get; set; }
    }

}
