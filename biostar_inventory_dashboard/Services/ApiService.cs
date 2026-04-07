using biostar_inventory_dashboard.Models;

using System.Text.Json;
using System.Text;

namespace biostar_inventory_dashboard.Services
{
    public class ApiService
    {
        private readonly HttpClient _httpClient;
        private readonly string _baseUrl = "https://inventory-api-loha.onrender.com";

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
       

        public async Task<PagedTransactionResponse> GetTransactionsAsync(int page = 1, int pageSize = 30)
        {
            var response = await _httpClient.GetAsync(
                $"{_baseUrl}/api/Inventory?page={page}&pageSize={pageSize}"
            );

            response.EnsureSuccessStatusCode();

            var json = await response.Content.ReadAsStringAsync();

            var options = new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            };

            var result = JsonSerializer.Deserialize<PagedTransactionResponse>(json, options);

            return result ?? new PagedTransactionResponse();
        }

        //categories management api
        public async Task<List<Categories>> GetCategoriesAsync()
        {
            var response = await _httpClient.GetAsync("api/Category");

            if (!response.IsSuccessStatusCode)
                return new List<Categories>();

            var json = await response.Content.ReadAsStringAsync();

            var options = new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            };

            return JsonSerializer.Deserialize<List<Categories>>(json, options) ?? new List<Categories>();
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