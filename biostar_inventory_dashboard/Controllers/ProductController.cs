using Microsoft.AspNetCore.Mvc;

namespace biostar_inventory_dashboard.Controllers
{
    public class ProductController : Controller
    {
        public IActionResult Index()
        {
            return View();
        }
    }
}