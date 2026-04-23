using biostar_inventory_dashboard.Models;
using biostar_inventory_dashboard.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace biostar_inventory_dashboard.Controllers
{
    [Authorize]
    public class AccountController : Controller
    {
        private readonly ApiService _apiService;

        public AccountController(ApiService apiService)
        {
            _apiService = apiService;
        }

        [HttpGet]
        public async Task<IActionResult> MyAccount()
        {
            var userId = User.FindFirst("user_id")?.Value
                      ?? User.FindFirst("UserId")?.Value
                      ?? "";

            if (string.IsNullOrWhiteSpace(userId))
            {
                TempData["Error"] = "User not found.";
                return RedirectToAction("Index", "Login");
            }

            var user = await _apiService.GetUserByIdAsync(userId);

            if (user == null)
            {
                TempData["Error"] = "Unable to load account details.";
                return RedirectToAction("Index", "Dashboard");
            }

            if (string.IsNullOrWhiteSpace(user.profile_image))
            {
                user.profile_image = "/images/default-user.png";
            }

            return View(user);
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> UpdateMyAccount(UpdateMyAccountDto dto)
        {
            try
            {
                var userId = User.FindFirst("user_id")?.Value
                          ?? User.FindFirst("UserId")?.Value
                          ?? "";

                if (string.IsNullOrWhiteSpace(userId))
                {
                    TempData["Error"] = "User not found.";
                    return RedirectToAction("MyAccount");
                }

                if (string.IsNullOrWhiteSpace(dto.full_name))
                {
                    TempData["Error"] = "Full name is required.";
                    return RedirectToAction("MyAccount");
                }

                if (string.IsNullOrWhiteSpace(dto.username))
                {
                    TempData["Error"] = "Username is required.";
                    return RedirectToAction("MyAccount");
                }

                var success = await _apiService.UpdateMyAccountAsync(userId, dto);

                TempData[success ? "Success" : "Error"] =
                    success ? "Account updated successfully." : "Failed to update account.";

                return RedirectToAction("MyAccount");
            }
            catch (Exception ex)
            {
                TempData["Error"] = ex.Message;
                return RedirectToAction("MyAccount");
            }
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> UploadProfileImage(IFormFile file)
        {
            try
            {
                var userId = User.FindFirst("user_id")?.Value
                          ?? User.FindFirst("UserId")?.Value
                          ?? "";

                if (string.IsNullOrWhiteSpace(userId))
                {
                    TempData["Error"] = "User not found.";
                    return RedirectToAction("MyAccount");
                }

                if (file == null || file.Length == 0)
                {
                    TempData["Error"] = "Please select an image.";
                    return RedirectToAction("MyAccount");
                }

                var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".webp" };
                var ext = Path.GetExtension(file.FileName).ToLowerInvariant();

                if (!allowedExtensions.Contains(ext))
                {
                    TempData["Error"] = "Only JPG, JPEG, PNG, and WEBP files are allowed.";
                    return RedirectToAction("MyAccount");
                }

                var result = await _apiService.UploadProfileImageAsync(userId, file);

                if (string.IsNullOrWhiteSpace(result))
                {
                    TempData["Error"] = "Failed to upload profile image.";
                    return RedirectToAction("MyAccount");
                }

                TempData["Success"] = "Profile image uploaded successfully.";
                return RedirectToAction("MyAccount");
            }
            catch (Exception ex)
            {
                TempData["Error"] = ex.Message;
                return RedirectToAction("MyAccount");
            }
        }

        [HttpGet]
        public IActionResult ChangePassword()
        {
            return View();
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> ChangePassword(ChangePasswordDto dto)
        {
            try
            {
                var userId = User.FindFirst("user_id")?.Value
                          ?? User.FindFirst("UserId")?.Value
                          ?? "";

                if (string.IsNullOrWhiteSpace(userId))
                {
                    TempData["Error"] = "User not found.";
                    return RedirectToAction("ChangePassword");
                }

                await _apiService.ChangePasswordAsync(userId, dto);

                TempData["Success"] = "Password changed successfully.";
                return RedirectToAction("ChangePassword");
            }
            catch (Exception ex)
            {
                TempData["Error"] = ex.Message;
                return RedirectToAction("ChangePassword");
            }
        }
    }
}