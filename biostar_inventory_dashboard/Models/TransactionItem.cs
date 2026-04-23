using System.Text.Json;

namespace biostar_inventory_dashboard.Models
{
    public class TransactionItem
    {
        public long? transaction_id { get; set; }
        public string? product_id { get; set; }
        public string? branch_id { get; set; }
        public string? branch_name { get; set; }
        public string? transaction_type { get; set; }

        public string? product_name { get; set; }

        public string? uom { get; set; }
        public string? pack_uom { get; set; }
        public decimal? pack_qty { get; set; }

        public string remarks { get; set; } = "";
        public string? lot_no { get; set; }
        public string? expiration_date { get; set; }
        public string? manufacturing_date { get; set; }
        public decimal quantity { get; set; }
        public string? scanned_by { get; set; }
        public string? full_name { get; set; }
        public string? created_at { get; set; }
        public string? notes { get; set; }

        public string? supplier_id { get; set; }
        public string? customer_id { get; set; }

        public string? supplier_name { get; set; }
        public string? customer_name { get; set; }

        //transaction out 
        public string? dr_no { get; set; }
        public string? inv_no { get; set; }
        public string? po_no { get; set; }

        public string? order_no { get; set; }
        public string? checklist_no { get; set; }


    }
}