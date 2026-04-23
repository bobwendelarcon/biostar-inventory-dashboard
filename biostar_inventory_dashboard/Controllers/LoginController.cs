using biostar_inventory_dashboard.Services;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace biostar_inventory_dashboard.Controllers
{
    [AllowAnonymous]
    public class LoginController : Controller
    {
        private readonly ApiService _apiService;

        public LoginController(ApiService apiService)
        {
            _apiService = apiService;
        }

        [HttpGet]
        public IActionResult Index()
        {
            if (User.Identity != null && User.Identity.IsAuthenticated)
            {
                return RedirectToAction("Index", "Dashboard");
            }

            return View();
        }

        [HttpPost]
        public async Task<IActionResult> Index(string username, string password)
        {
            if (string.IsNullOrWhiteSpace(username) || string.IsNullOrWhiteSpace(password))
            {
                ViewBag.Error = "Username and password are required.";
                return View();
            }

            var user = await _apiService.LoginAsync(username, password);

            if (user == null)
            {
                ViewBag.Error = "Invalid username or password.";
                return View();
            }

            var role = (user.role_name ?? "").Trim().ToUpper();

            if (role == "WAREHOUSE")
            {
                ViewBag.Error = "Warehouse account is for Android use only.";
                return View();
            }

            var fullName = string.IsNullOrWhiteSpace(user.full_name) ? username : user.full_name;

            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.Name, fullName),
                new Claim("full_name", fullName),
                new Claim("username", user.username ?? username),
                new Claim("user_id", user.user_id?.ToString() ?? ""),
                new Claim("UserId", user.user_id?.ToString() ?? ""),
                new Claim(ClaimTypes.Role, role),
                new Claim("role", role),
                new Claim("profile_image", user.profile_image ?? "")
            };

            var identity = new ClaimsIdentity(
                claims,
                CookieAuthenticationDefaults.AuthenticationScheme);

            var principal = new ClaimsPrincipal(identity);

            await HttpContext.SignInAsync(
                CookieAuthenticationDefaults.AuthenticationScheme,
                principal);

            return RedirectToAction("Index", "Dashboard");
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Logout()
        {
            await HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);

            Response.Cookies.Delete("BiostarAuth");

            return RedirectToAction("Index", "Login");
        }
    }
}