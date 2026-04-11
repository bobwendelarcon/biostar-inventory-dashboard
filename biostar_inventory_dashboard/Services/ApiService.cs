using biostar_inventory_dashboard.Models;
using System.Text;
using System.Text.Json;

namespace biostar_inventory_dashboard.Services
{
    public class ApiService
    {
        private readonly HttpClient _httpClient;
        private readonly JsonSerializerOptions _jsonOptions;

        public ApiService(HttpClient httpClient)
        {
            _httpClient = httpClient;
            _jsonOptions = new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            };
        }

        public async Task<List<InventoryItem>> GetInventoryAsync()
        {
            var response = await _httpClient.GetAsync("api/inventoryDisplay");

            if (!response.IsSuccessStatusCode)
                return new List<InventoryItem>();

            var json = await response.Content.ReadAsStringAsync();
            return JsonSerializer.Deserialize<List<InventoryItem>>(json, _jsonOptions) ?? new List<InventoryItem>();
        }

        public async Task<PagedTransactionResponse> GetTransactionsAsync(
     int page = 1,
     int pageSize = 30,
     string lot_no = "",
     string product = "",
     string type = "",
     string from = "",
     string to = "",
     string scanned_by = "",
     string reference = "",
     string warehouse = "",
     string order = "desc")
        {
            var url = $"api/Inventory?page={page}&pageSize={pageSize}";

            if (!string.IsNullOrWhiteSpace(lot_no))
                url += $"&lot_no={Uri.EscapeDataString(lot_no)}";

            if (!string.IsNullOrWhiteSpace(product))
                url += $"&product={Uri.EscapeDataString(product)}";

            if (!string.IsNullOrWhiteSpace(type))
                url += $"&type={Uri.EscapeDataString(type)}";

            if (!string.IsNullOrWhiteSpace(from))
                url += $"&from={Uri.EscapeDataString(from)}";

            if (!string.IsNullOrWhiteSpace(to))
                url += $"&to={Uri.EscapeDataString(to)}";

            if (!string.IsNullOrWhiteSpace(scanned_by))
                url += $"&scanned_by={Uri.EscapeDataString(scanned_by)}";

            if (!string.IsNullOrWhiteSpace(reference))
                url += $"&reference={Uri.EscapeDataString(reference)}";

            if (!string.IsNullOrWhiteSpace(warehouse))
                url += $"&warehouse={Uri.EscapeDataString(warehouse)}";

            if (!string.IsNullOrWhiteSpace(order))
                url += $"&order={Uri.EscapeDataString(order)}";

            var response = await _httpClient.GetAsync(url);

            if (!response.IsSuccessStatusCode)
                return new PagedTransactionResponse();

            var json = await response.Content.ReadAsStringAsync();
            return JsonSerializer.Deserialize<PagedTransactionResponse>(json, _jsonOptions) ?? new PagedTransactionResponse();
        }

        public async Task<List<Categories>> GetCategoriesAsync()
        {
            var response = await _httpClient.GetAsync("api/Category");

            if (!response.IsSuccessStatusCode)
                return new List<Categories>();

            var json = await response.Content.ReadAsStringAsync();
            return JsonSerializer.Deserialize<List<Categories>>(json, _jsonOptions) ?? new List<Categories>();
        }

        public async Task<bool> AddCategoryAsync(Categories category)
        {
            var json = JsonSerializer.Serialize(category);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            var response = await _httpClient.PostAsync("api/Category", content);
            return response.IsSuccessStatusCode;
        }

        public async Task<bool> UpdateCategoryAsync(Categories category)
        {
            var json = JsonSerializer.Serialize(category);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            var response = await _httpClient.PutAsync($"api/Category/{category.catg_id}", content);
            return response.IsSuccessStatusCode;
        }
    }
}