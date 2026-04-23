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

        public async Task<PagedInventoryResponse> GetInventoryAsync(
      int page = 1,
      int pageSize = 30,
      string lot_no = "",
      string product = "",
      string warehouse = "",
      string stockStatus = "",
      string expiryStatus = "",
      string months = "",
      string from = "",
      string to = "",
      string order = "desc"
  )
        {
            var queryParams = new List<string>
    {
        $"page={page}",
        $"pageSize={pageSize}"
    };

            if (!string.IsNullOrWhiteSpace(lot_no))
                queryParams.Add($"lot_no={Uri.EscapeDataString(lot_no)}");

            if (!string.IsNullOrWhiteSpace(product))
                queryParams.Add($"product={Uri.EscapeDataString(product)}");

            if (!string.IsNullOrWhiteSpace(warehouse))
                queryParams.Add($"warehouse={Uri.EscapeDataString(warehouse)}");

            if (!string.IsNullOrWhiteSpace(stockStatus))
                queryParams.Add($"stockStatus={Uri.EscapeDataString(stockStatus)}");

            if (!string.IsNullOrWhiteSpace(expiryStatus))
                queryParams.Add($"expiryStatus={Uri.EscapeDataString(expiryStatus)}");

            if (!string.IsNullOrWhiteSpace(months))
                queryParams.Add($"months={Uri.EscapeDataString(months)}");

            if (!string.IsNullOrWhiteSpace(from))
                queryParams.Add($"from={Uri.EscapeDataString(from)}");

            if (!string.IsNullOrWhiteSpace(to))
                queryParams.Add($"to={Uri.EscapeDataString(to)}");

            if (!string.IsNullOrWhiteSpace(order))
                queryParams.Add($"order={Uri.EscapeDataString(order)}");

            var url = "api/inventoryDisplay";

            if (queryParams.Any())
                url += "?" + string.Join("&", queryParams);

            var response = await _httpClient.GetAsync(url);

            if (!response.IsSuccessStatusCode)
                return new PagedInventoryResponse();

            var json = await response.Content.ReadAsStringAsync();

            return JsonSerializer.Deserialize<PagedInventoryResponse>(json, _jsonOptions)
                   ?? new PagedInventoryResponse();
        }



        public async Task<string> TransferAsync(string jsonData)
        {
            var content = new StringContent(jsonData, Encoding.UTF8, "application/json");

            var response = await _httpClient.PostAsync("api/Inventory/transfer", content);

            var result = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
                throw new Exception(result);

            return result;
        }


        public async Task<string> AdjustAsync(string jsonData)
        {
            var content = new StringContent(jsonData, Encoding.UTF8, "application/json");

            var response = await _httpClient.PostAsync("api/Inventory/adjust", content);

            var result = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
                throw new Exception(result);

            return result;
        }
        public async Task<string> GetHistoryAsync(string product_id, string lot_no, string branch_id)
        {
            var url =
                $"api/Inventory/history?product_id={Uri.EscapeDataString(product_id)}" +
                $"&lot_no={Uri.EscapeDataString(lot_no)}" +
                $"&branch_id={Uri.EscapeDataString(branch_id)}";

            var response = await _httpClient.GetAsync(url);

            var result = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
                throw new Exception(result);

            return result;
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
     string full_name = "",
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


        // categories
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


        // products
        public async Task<List<dynamic>> GetProductsAsync()
        {
            var response = await _httpClient.GetAsync("api/Products");

            if (!response.IsSuccessStatusCode)
                return new List<dynamic>();

            var json = await response.Content.ReadAsStringAsync();

            return JsonSerializer.Deserialize<List<dynamic>>(json, _jsonOptions)
                   ?? new List<dynamic>();
        }
        public async Task<bool> AddProductAsync(object product)
        {
            var json = JsonSerializer.Serialize(product);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            var response = await _httpClient.PostAsync("api/Products", content);
            return response.IsSuccessStatusCode;
        }

        public async Task<bool> UpdateProductAsync(string id, object product)
        {
            var json = JsonSerializer.Serialize(product);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            var response = await _httpClient.PutAsync($"api/Products/{id}", content);
            return response.IsSuccessStatusCode;
        }

        //branches
        public async Task<List<dynamic>> GetBranchesAsync()
        {
            var response = await _httpClient.GetAsync("api/Branches");

            if (!response.IsSuccessStatusCode)
                return new List<dynamic>();

            var json = await response.Content.ReadAsStringAsync();

            return JsonSerializer.Deserialize<List<dynamic>>(json, _jsonOptions)
                   ?? new List<dynamic>();
        }

        public async Task<bool> AddBranchAsync(object branch)
        {
            var json = JsonSerializer.Serialize(branch);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            var response = await _httpClient.PostAsync("api/Branches", content);
            return response.IsSuccessStatusCode;
        }

        public async Task<bool> UpdateBranchAsync(string id, object branch)
        {
            var json = JsonSerializer.Serialize(branch);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            var response = await _httpClient.PutAsync($"api/Branches/{id}", content);
            return response.IsSuccessStatusCode;
        }


        //users

        public async Task<string> GetUsersAsync()
        {
            return await _httpClient.GetStringAsync("api/User");
        }

        public async Task<string> AddUserAsync(string jsonData)
        {
            var content = new StringContent(
                jsonData,
                System.Text.Encoding.UTF8,
                "application/json");

            var response = await _httpClient.PostAsync("api/User", content);
            var result = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
                throw new Exception(result);

            return result;
        }

        public async Task<string> UpdateUserAsync(string id, string jsonData)
        {
            var content = new StringContent(
                jsonData,
                System.Text.Encoding.UTF8,
                "application/json");

            var response = await _httpClient.PutAsync($"api/User/{id}", content);
            var result = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
                throw new Exception(result);

            return result;
        }

        //partner


        public async Task<string> GetPartnersAsync()
        {
            return await _httpClient.GetStringAsync("api/Partners");
        }

        public async Task<string> AddPartnerAsync(string jsonData)
        {
            var content = new StringContent(
                jsonData,
                System.Text.Encoding.UTF8,
                "application/json");

            var response = await _httpClient.PostAsync("api/Partners", content);
            var result = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
                throw new Exception(result);

            return result;
        }

        public async Task<string> UpdatePartnerAsync(string id, string jsonData)
        {
            var content = new StringContent(
                jsonData,
                System.Text.Encoding.UTF8,
                "application/json");

            var response = await _httpClient.PutAsync($"api/Partners/{id}", content);
            var result = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
                throw new Exception(result);

            return result;
        }

        public async Task<string> UpdateTransactionReferenceAsync(string jsonData)
        {
            var content = new StringContent(jsonData, Encoding.UTF8, "application/json");

            var response = await _httpClient.PutAsync("api/Inventory/UpdateReference", content);

            var responseBody = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
                throw new Exception(responseBody);

            return responseBody;
        }

        //login 

        public async Task<User?> LoginAsync(string username, string password)
        {
            var payload = new
            {
                username = username,
                password = password
            };

            var content = new StringContent(
                JsonSerializer.Serialize(payload),
                Encoding.UTF8,
                "application/json");

            var response = await _httpClient.PostAsync("api/User/login", content);

            if (!response.IsSuccessStatusCode)
                return null;

            var json = await response.Content.ReadAsStringAsync();

            return JsonSerializer.Deserialize<User>(json, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            });
        }




        //MyAccount

        public async Task<UserAccountDto?> GetUserByIdAsync(string userId)
        {
            var response = await _httpClient.GetAsync($"api/User/{Uri.EscapeDataString(userId)}");

            if (!response.IsSuccessStatusCode)
                return null;

            var json = await response.Content.ReadAsStringAsync();

            return JsonSerializer.Deserialize<UserAccountDto>(json, _jsonOptions);
        }

        public async Task<bool> UpdateMyAccountAsync(string userId, UpdateMyAccountDto dto)
        {
            var json = JsonSerializer.Serialize(dto);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            var response = await _httpClient.PutAsync(
                $"api/User/UpdateMyAccount/{Uri.EscapeDataString(userId)}",
                content);

            return response.IsSuccessStatusCode;
        }

        public async Task<string?> UploadProfileImageAsync(string userId, IFormFile file)
        {
            using var form = new MultipartFormDataContent();

            using var stream = file.OpenReadStream();
            using var fileContent = new StreamContent(stream);

            fileContent.Headers.ContentType =
                new System.Net.Http.Headers.MediaTypeHeaderValue(
                    string.IsNullOrWhiteSpace(file.ContentType) ? "application/octet-stream" : file.ContentType);

            form.Add(fileContent, "file", file.FileName);

            var response = await _httpClient.PostAsync(
                $"api/User/UploadProfileImage/{Uri.EscapeDataString(userId)}",
                form);

            if (!response.IsSuccessStatusCode)
                return null;

            var json = await response.Content.ReadAsStringAsync();

            using var doc = JsonDocument.Parse(json);
            if (doc.RootElement.TryGetProperty("profile_image", out var profileImageProp))
            {
                return profileImageProp.GetString();
            }

            return null;
        }

        // daily order

        public async Task<string> GetDailyOrdersAsync(
    string? className,
    int? year,
    string? month,
    string? status,
    string? search)
        {
            var query = new List<string>();

            if (!string.IsNullOrWhiteSpace(className))
                query.Add($"className={Uri.EscapeDataString(className)}");

            if (year.HasValue)
                query.Add($"year={year.Value}");

            if (!string.IsNullOrWhiteSpace(month))
                query.Add($"month={Uri.EscapeDataString(month)}");

            if (!string.IsNullOrWhiteSpace(status))
                query.Add($"status={Uri.EscapeDataString(status)}");

            if (!string.IsNullOrWhiteSpace(search))
                query.Add($"search={Uri.EscapeDataString(search)}");

            var url = "api/DailyOrders";
            if (query.Any())
                url += "?" + string.Join("&", query);

            return await _httpClient.GetStringAsync(url);
        }

        public async Task<string> GetDailyOrderDetailsAsync(long orderId)
        {
            return await _httpClient.GetStringAsync($"api/DailyOrders/{orderId}");
        }

        public async Task<string> AllocateDailyOrderAsync(long orderId)
        {
            var response = await _httpClient.PostAsync($"api/DailyOrders/{orderId}/allocate", null);
            response.EnsureSuccessStatusCode();
            return await response.Content.ReadAsStringAsync();
        }

        public async Task<string> MarkDailyOrderReadyForDispatchAsync(long orderId)
        {
            var response = await _httpClient.PostAsync($"api/DailyOrders/{orderId}/ready-for-dispatch", null);
            response.EnsureSuccessStatusCode();
            return await response.Content.ReadAsStringAsync();
        }

        public async Task<string> UpdateDailyOrderAsync(long orderId, object request)
        {
            var json = JsonSerializer.Serialize(request);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            var response = await _httpClient.PutAsync($"api/DailyOrders/{orderId}", content);
            response.EnsureSuccessStatusCode();

            return await response.Content.ReadAsStringAsync();
        }

        public async Task<string> DeleteDailyOrderAsync(long orderId)
        {
            var response = await _httpClient.DeleteAsync($"api/DailyOrders/{orderId}");
            response.EnsureSuccessStatusCode();
            return await response.Content.ReadAsStringAsync();
        }

        public async Task<string> CreateDailyOrderAsync(object request)
        {
            var json = JsonSerializer.Serialize(request);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            var response = await _httpClient.PostAsync("api/DailyOrders", content);
            response.EnsureSuccessStatusCode();

            return await response.Content.ReadAsStringAsync();
        }



        public async Task<List<ProductLookupDto>> GetProductsLookupAsync(string? categoryId, string? search)
        {
            var query = new List<string>();

            if (!string.IsNullOrWhiteSpace(categoryId))
                query.Add($"categoryId={Uri.EscapeDataString(categoryId)}");

            if (!string.IsNullOrWhiteSpace(search))
                query.Add($"search={Uri.EscapeDataString(search)}");

            var url = "api/Products/lookup";
            if (query.Any())
                url += "?" + string.Join("&", query);

            var response = await _httpClient.GetAsync(url);

            if (!response.IsSuccessStatusCode)
                return new List<ProductLookupDto>();

            var json = await response.Content.ReadAsStringAsync();
            return JsonSerializer.Deserialize<List<ProductLookupDto>>(json, _jsonOptions) ?? new List<ProductLookupDto>();
        }

        public async Task<string> GetChecklistListAsync(
     DateTime? date,
     string? status,
     string? truck,
     string? search)
        {
            var query = new List<string>();

            if (date.HasValue)
                query.Add($"date={date.Value:yyyy-MM-dd}");

            if (!string.IsNullOrWhiteSpace(status))
                query.Add($"status={Uri.EscapeDataString(status)}");

            if (!string.IsNullOrWhiteSpace(truck))
                query.Add($"truck={Uri.EscapeDataString(truck)}");

            if (!string.IsNullOrWhiteSpace(search))
                query.Add($"search={Uri.EscapeDataString(search)}");

            var url = "api/DeliveryChecklist/list";

            if (query.Any())
                url += "?" + string.Join("&", query);

            var response = await _httpClient.GetAsync(url);

            var result = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
                throw new Exception(result);

            return result;
        }

        public async Task<string> GetChecklistListAsync()
        {
            return await GetChecklistListAsync(null, null, null, null);
        }

        public async Task<string> GetReadyForChecklistAsync()
        {
            var response = await _httpClient.GetAsync("api/DeliveryChecklist/ready-for-checklist");
            response.EnsureSuccessStatusCode();
            return await response.Content.ReadAsStringAsync();
        }

        public async Task<string> GetChecklistDetailsAsync(long id)
        {
            var response = await _httpClient.GetAsync($"api/DeliveryChecklist/{id}");
            response.EnsureSuccessStatusCode();
            return await response.Content.ReadAsStringAsync();
        }

        public async Task<string> CreateChecklistAsync(object data)
        {
            var json = JsonSerializer.Serialize(data);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            var response = await _httpClient.PostAsync("api/DeliveryChecklist/create", content);
            var responseBody = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
            {
                throw new Exception(responseBody);
            }

            return responseBody;
        }

        public async Task<string> DeleteChecklistAsync(long id)
        {
            var response = await _httpClient.PostAsync($"api/DeliveryChecklist/delete/{id}", null);
            var responseBody = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
            {
                throw new Exception(responseBody);
            }

            return responseBody;
        }

        //confirm loading
        public async Task<string> ConfirmLoadingAsync(long id)
        {
            var response = await _httpClient.PostAsync($"api/DeliveryChecklist/confirm-loading/{id}", null);
            var body = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
                throw new Exception(body);

            return body;
        }

        public async Task<string> ReopenChecklistAsync(long checklistId)
        {
            var response = await _httpClient.PostAsync($"api/ChecklistOut/reopen/{checklistId}", null);

            var content = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
                throw new Exception(content);

            return content;
        }


        public async Task<string> ChangePasswordAsync(string userId, ChangePasswordDto dto)
        {
            var json = JsonSerializer.Serialize(dto);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            var response = await _httpClient.PutAsync(
                $"api/User/ChangePassword/{Uri.EscapeDataString(userId)}",
                content);

            var result = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
                throw new Exception(result);

            return result;
        }




    }
}