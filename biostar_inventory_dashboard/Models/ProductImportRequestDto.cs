namespace biostar_inventory_dashboard.Models
{
    public class ProductImportRequestDto
    {
        public string FileToken { get; set; } = "";
        public List<string> SelectedSheets { get; set; } = new();
    }
}
