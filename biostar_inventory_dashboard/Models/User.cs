
namespace biostar_inventory_dashboard.Models
{
    public class User
    {
        public string user_id { get; set; } = "";
        public string full_name { get; set; } = "";
        public string username { get; set; } = "";
        public string role_name { get; set; } = "";
        public bool is_deleted { get; set; }

        public string? profile_image { get; set; }

        // JWT authentication token returned by API login
        public string? token { get; set; }

        // Permissions returned by API login
        public List<string> access_points { get; set; } = new();
    }
}
