using System.Text.Json;

namespace biostar_inventory_dashboard.Models
{




    //public class InventoryItem
    //{
    //    public string? product_id { get; set; }
    //    public string? description { get; set; }
    //    public string? uom { get; set; }
    //    public string? lot_no { get; set; }
    //    public string? warehouse { get; set; }
    //    public int qty { get; set; }
    //    public int? pack_qty { get; set; }
    //    public String? pack_uom { get; set; }
    //    public int stock_level { get; set; }
    //    public string? date { get; set; }
    //    public string? expiration_date { get; set; }
    //    public string? manufacturing_date { get; set; }
    //}

    namespace biostar_inventory_dashboard.Models
    {
        public class InventoryItem
        {
            public string product_id { get; set; } = "";
            public string branch_id { get; set; } = "";
            public string description { get; set; } = "";
            public string uom { get; set; } = "";
            public decimal pack_qty { get; set; }
            public string pack_uom { get; set; } = "";
            public string lot_no { get; set; } = "";
            public string warehouse { get; set; } = "";
            public decimal qty { get; set; }
            public string date { get; set; } = "";
            public string manufacturing_date { get; set; } = "";
            public string expiration_date { get; set; } = "";
        }
    }



}
