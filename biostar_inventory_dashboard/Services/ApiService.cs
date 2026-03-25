using biostar_inventory_dashboard.Models;

using System.Text.Json;

namespace biostar_inventory_dashboard.Services
{
    public class ApiService
    {
        private readonly HttpClient _httpClient;

        public ApiService(HttpClient httpClient)
        {
            _httpClient = httpClient;
        }

        public async Task<List<InventoryItem>> GetInventoryAsync()
        {
            var response = await _httpClient.GetAsync("api/inventoryDisplay");

            if (!response.IsSuccessStatusCode)
                return new List<InventoryItem>();

            var json = await response.Content.ReadAsStringAsync();

            var options = new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            };

            return JsonSerializer.Deserialize<List<InventoryItem>>(json, options) ?? new List<InventoryItem>();
        }
        public async Task<List<TransactionItem>> GetTransactionsAsync()
        {
            var response = await _httpClient.GetAsync("api/Inventory"); // or your transaction endpoint

            if (!response.IsSuccessStatusCode)
                return new List<TransactionItem>();

            var json = await response.Content.ReadAsStringAsync();

            var options = new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            };

            return JsonSerializer.Deserialize<List<TransactionItem>>(json, options) ?? new List<TransactionItem>();
        }
    }


}