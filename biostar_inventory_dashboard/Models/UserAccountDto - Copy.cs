namespace biostar_inventory_dashboard.Models
{
    public class UpdateMyAccountDto
    {
        public string full_name { get; set; } = string.Empty;
        public string username { get; set; } = string.Empty;
        public string? password_hash { get; set; }
    }
}