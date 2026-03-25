using Microsoft.AspNetCore.Mvc;

namespace InventoryDashboard.Controllers
{
    public class AccountController : Controller
    {
        public IActionResult Logout()
        {
            // later: clear session / auth
            return RedirectToAction("Index", "Home");
        }
    }
}