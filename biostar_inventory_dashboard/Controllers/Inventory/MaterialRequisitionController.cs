using biostar_inventory_dashboard.Services;
using Microsoft.AspNetCore.Mvc;
using System.Text.Json;

namespace biostar_inventory_dashboard.Controllers.Inventory
{
    [Route("inventory/material-requisitions")]
    public class MaterialRequisitionController : Controller
    {
        private readonly ApiService _apiService;

        public MaterialRequisitionController(
            ApiService apiService)
        {
            _apiService = apiService;
        }

        // =====================================================
        // PAGE
        // =====================================================
        [HttpGet("")]
        public IActionResult Index()
        {
            return View();
        }

        [HttpGet("create")]
        public IActionResult CreatePage()
        {
            var userId =
                User.Claims
                    .FirstOrDefault(c => c.Type == "user_id")
                    ?.Value
                ??
                User.Claims
                    .FirstOrDefault(c => c.Type == "UserId")
                    ?.Value
                ??
                User.Identity?.Name
                ??
                "";

            var fullName =
                User.Claims
                    .FirstOrDefault(c => c.Type == "full_name")
                    ?.Value
                ??
                User.Claims
                    .FirstOrDefault(c => c.Type == "FullName")
                    ?.Value
                ??
                User.Identity?.Name
                ??
                userId;

            ViewBag.CurrentUserId = userId;
            ViewBag.CurrentUserName = fullName;

            return View("Create");
        }

        [HttpGet("{id:int}")]
        public IActionResult DetailsPage(int id)
        {
            ViewBag.RequisitionId = id;

            return View("Details");
        }





        // =====================================================
        // LIST
        // =====================================================
        [HttpGet("data")]
        public async Task<IActionResult> GetList()
        {
            try
            {
                var result =
                    await _apiService
                        .GetMaterialRequisitionsAsync();

                return Content(
                    result,
                    "application/json");
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = ex.Message
                });
            }
        }

        // =====================================================
        // DETAILS
        // =====================================================
        [HttpGet("{id:int}/details")]
        public async Task<IActionResult> GetDetails(
            int id)
        {
            try
            {
                var result =
                    await _apiService
                        .GetMaterialRequisitionAsync(id);

                return Content(
                    result,
                    "application/json");
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = ex.Message
                });
            }
        }

        // =====================================================
        // CREATE DRAFT
        // =====================================================
        [HttpPost("create")]
        public async Task<IActionResult> Create(
            [FromBody] JsonElement request)
        {
            try
            {
                var userId =
                    User.Claims
                        .FirstOrDefault(
                            c => c.Type == "user_id")
                        ?.Value
                    ??
                    User.Claims
                        .FirstOrDefault(
                            c => c.Type == "UserId")
                        ?.Value
                    ??
                    User.Identity?.Name
                    ??
                    "";

                var data =
                    JsonSerializer.Deserialize<
                        Dictionary<string, object?>>(
                            request.GetRawText())
                    ??
                    new Dictionary<string, object?>();

                data["createdBy"] = userId;
                data["requestedBy"] = userId;

                var json =
                    JsonSerializer.Serialize(data);

                var result =
                    await _apiService
                        .CreateMaterialRequisitionAsync(
                            json);

                return Content(
                    result,
                    "application/json");
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = ex.Message
                });
            }
        }

        // =====================================================
        // UPDATE DRAFT
        // =====================================================
        [HttpPut("{id:int}")]
        public async Task<IActionResult> Update(
            int id,
            [FromBody] JsonElement request)
        {
            try
            {
                var json =
                    request.GetRawText();

                var result =
                    await _apiService
                        .UpdateMaterialRequisitionAsync(
                            id,
                            json);

                return Content(
                    result,
                    "application/json");
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = ex.Message
                });
            }
        }

        // =====================================================
        // AVAILABLE LOTS
        // =====================================================
        [HttpGet("available-lots")]
        public async Task<IActionResult> GetAvailableLots(
     int materialId,
     string branchId)
        {
            try
            {
                var result =
                    await _apiService
                        .GetAvailableRawMaterialLotsAsync(
                            materialId,
                            branchId);

                return Content(
                    result,
                    "application/json");
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = ex.Message,
                    innerMessage = ex.InnerException?.Message,
                    exceptionType = ex.GetType().FullName,
                    detail = ex.ToString()
                });
            }
        }
        // =====================================================
        // SUBMIT FOR APPROVAL
        // =====================================================
        [HttpPost("{id:int}/submit")]
        public async Task<IActionResult> SubmitForApproval(
            int id)
        {
            try
            {
                var userId =
                    User.Claims
                        .FirstOrDefault(c => c.Type == "user_id")
                        ?.Value
                    ??
                    User.Claims
                        .FirstOrDefault(c => c.Type == "UserId")
                        ?.Value
                    ??
                    User.Identity?.Name
                    ??
                    "";

                var payload = new
                {
                    submittedBy = userId
                };

                var json =
                    JsonSerializer.Serialize(payload);

                var result =
                    await _apiService
                        .SubmitMaterialRequisitionAsync(
                            id,
                            json);

                return Content(
                    result,
                    "application/json");
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = ex.Message
                });
            }
        }


        // =====================================================
        // APPROVE
        // =====================================================
        [HttpPost("{id:int}/approve")]
        public async Task<IActionResult> Approve(
            int id,
            [FromBody] JsonElement request)
        {
            try
            {
                var userId =
                    User.Claims
                        .FirstOrDefault(c => c.Type == "user_id")
                        ?.Value
                    ??
                    User.Claims
                        .FirstOrDefault(c => c.Type == "UserId")
                        ?.Value
                    ??
                    User.Identity?.Name
                    ??
                    "";

                var data =
                    JsonSerializer.Deserialize<
                        Dictionary<string, object?>>(
                            request.GetRawText())
                    ??
                    new Dictionary<string, object?>();

                data["approvedBy"] =
                    userId;

                var json =
                    JsonSerializer.Serialize(data);

                var result =
                    await _apiService
                        .ApproveMaterialRequisitionAsync(
                            id,
                            json);

                return Content(
                    result,
                    "application/json");
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = ex.Message
                });
            }
        }


        // =====================================================
        // REJECT
        // =====================================================
        [HttpPost("{id:int}/reject")]
        public async Task<IActionResult> Reject(
            int id,
            [FromBody] JsonElement request)
        {
            try
            {
                var userId =
                    User.Claims
                        .FirstOrDefault(c => c.Type == "user_id")
                        ?.Value
                    ??
                    User.Claims
                        .FirstOrDefault(c => c.Type == "UserId")
                        ?.Value
                    ??
                    User.Identity?.Name
                    ??
                    "";

                var data =
                    JsonSerializer.Deserialize<
                        Dictionary<string, object?>>(
                            request.GetRawText())
                    ??
                    new Dictionary<string, object?>();

                data["rejectedBy"] =
                    userId;

                var json =
                    JsonSerializer.Serialize(data);

                var result =
                    await _apiService
                        .RejectMaterialRequisitionAsync(
                            id,
                            json);

                return Content(
                    result,
                    "application/json");
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = ex.Message
                });
            }
        }


        // =====================================================
        // RELEASE / STOCK OUT
        // =====================================================
        [HttpPost("{id:int}/release")]
        public async Task<IActionResult> Release(
            int id,
            [FromBody] JsonElement request)
        {
            try
            {
                var userId =
                    User.Claims
                        .FirstOrDefault(c => c.Type == "user_id")
                        ?.Value
                    ??
                    User.Claims
                        .FirstOrDefault(c => c.Type == "UserId")
                        ?.Value
                    ??
                    User.Identity?.Name
                    ??
                    "";

                var data =
                    JsonSerializer.Deserialize<
                        Dictionary<string, object?>>(
                            request.GetRawText())
                    ??
                    new Dictionary<string, object?>();

                data["postedBy"] =
                    userId;

                var json =
                    JsonSerializer.Serialize(data);

                var result =
                    await _apiService
                        .ReleaseMaterialRequisitionAsync(
                            id,
                            json);

                return Content(
                    result,
                    "application/json");
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = ex.Message
                });
            }
        }


        // =====================================================
        // PRINT PAGE
        // =====================================================
        [HttpGet("{id:int}/print")]
        public IActionResult Print(
            int id)
        {
            ViewBag.RequisitionId = id;

            return View();
        }
    }
}