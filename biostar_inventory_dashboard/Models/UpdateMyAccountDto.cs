namespace biostar_inventory_dashboard.Models
{
    public class UpdateMyAccountDto
    {
        public string full_name { get; set; } = "";
        public string username { get; set; } = "";
        public string? password { get; set; } // nullable
    }
}