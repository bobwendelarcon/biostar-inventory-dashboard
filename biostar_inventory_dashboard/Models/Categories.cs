namespace biostar_inventory_dashboard.Models
{
    public class Categories
    {
        public string catg_id { get; set; }
        public string catg_name { get; set; }
        public string catg_desc { get; set; }
        public bool is_deleted { get; set; } = false;
        public string created_at { get; set; }
        public string updated_at { get; set; }
    }
}
