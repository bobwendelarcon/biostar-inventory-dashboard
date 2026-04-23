namespace biostar_inventory_dashboard.Models
{
    public class UserAccountDto
    {
        public string user_id { get; set; } = string.Empty;
        public string full_name { get; set; } = string.Empty;
        public string username { get; set; } = string.Empty;
        public string role_name { get; set; } = string.Empty;
        public string? profile_image { get; set; }
    }
}