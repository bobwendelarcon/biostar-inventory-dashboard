using biostar_inventory_dashboard.Services;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Data;
using System.Security.Claims;
using System.IdentityModel.Tokens.Jwt;
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
                var role = User.FindFirst(ClaimTypes.Role)?.Value?.Trim().ToUpper() ?? "";
                if (role == "PROBIOTICS_STAFF")
                {
                    return RedirectToAction("Index", "LaboratoryInventory");
                }
                if (role == "PRODUCTION")
                {
                    return RedirectToAction("Index", "ProductToProduce");
                }

                if (role == "PURCHASING" || role == "PURCHASING_ADMIN")
                {
                    return Redirect("/purchasing/mprf/review");
                }

                if (role == "RM_WAREHOUSE")
                {
                    return Redirect("/purchasing/mprf");
                }

                if (role == "QA_QC")
                {
                    return Redirect("/quality/qa-qc-receiving");
                }

                return RedirectToAction("Index", "Dashboard");
            }

            return View();
        }


        [HttpGet]
        public IActionResult AccessDenied()
        {
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


            // Access points are already returned by the login API.
            // No additional protected API request is needed.
            var accessCodes = user.access_points ?? new List<string>();


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

            foreach (var accessCode in accessCodes)
            {
                if (!string.IsNullOrWhiteSpace(accessCode))
                {
                    claims.Add(
                        new Claim(
                            "access_point",
                            accessCode.Trim().ToUpper()));
                }
            }

            var identity = new ClaimsIdentity(
                claims,
                CookieAuthenticationDefaults.AuthenticationScheme);

            var principal = new ClaimsPrincipal(identity);


            if (string.IsNullOrWhiteSpace(user.token))
            {
                ViewBag.Error = "Login failed: API authentication token is missing.";
                return View();
            }

            // Read the actual expiration of the JWT issued by our API.
            var tokenHandler = new JwtSecurityTokenHandler();

            if (!tokenHandler.CanReadToken(user.token))
            {
                ViewBag.Error = "Login failed: Invalid authentication token.";
                return View();
            }

            var jwtToken = tokenHandler.ReadJwtToken(user.token);

            var tokenExpiration = new DateTimeOffset(
                jwtToken.ValidTo,
                TimeSpan.Zero);

            if (tokenExpiration <= DateTimeOffset.UtcNow)
            {
                ViewBag.Error = "Login failed: Authentication token has expired.";
                return View();
            }

            // Keep the browser authenticated until the API token expires.
            var authProperties = new AuthenticationProperties
            {
                IsPersistent = true,
                IssuedUtc = DateTimeOffset.UtcNow,
                ExpiresUtc = tokenExpiration,
                AllowRefresh = false
            };
            // Store the JWT in the protected authentication ticket.
            // It will be available for authenticated API requests.
            authProperties.StoreTokens(new[]
            {
    new AuthenticationToken
    {
        Name = "access_token",
        Value = user.token
    }
});

            await HttpContext.SignInAsync(
                CookieAuthenticationDefaults.AuthenticationScheme,
                principal,
                authProperties);

            // PROBIOTICS STAFF - Laboratory Inventory landing page
            if (role == "PROBIOTICS_STAFF")
            {
                return RedirectToAction("Index", "LaboratoryInventory");
            }

            if (role == "PRODUCTION")
            {
                return RedirectToAction("Index", "ProductToProduce");
            }

            if (role == "PURCHASING" || role == "PURCHASING_ADMIN")
            {
                return Redirect("/purchasing/mprf/review");
            }

            if (role == "RM_WAREHOUSE")
            {
                return Redirect("/purchasing/mprf");
            }

            if (role == "QA_QC")
            {
                return Redirect("/quality/qa-qc-receiving");
            }

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