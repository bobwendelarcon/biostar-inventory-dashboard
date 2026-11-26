using biostar_inventory_dashboard.Services;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.DataProtection;

var builder = WebApplication.CreateBuilder(args);
// ==========================================
// PERSISTENT DATA PROTECTION KEYS
// ==========================================

var keysPath = builder.Environment.IsDevelopment()
    ? Path.Combine(
        Environment.GetFolderPath(
            Environment.SpecialFolder.LocalApplicationData),
        "BiostarDashboard",
        "DataProtectionKeys")
    : "/var/lib/biostar-dashboard/keys";

Directory.CreateDirectory(keysPath);

builder.Services.AddDataProtection()
    .PersistKeysToFileSystem(
        new DirectoryInfo(keysPath))
    .SetApplicationName("BiostarInventoryDashboard");

builder.Services.AddControllersWithViews(options =>
{
    options.Filters.Add(new Microsoft.AspNetCore.Mvc.Authorization.AuthorizeFilter());
});

builder.Services.AddAuthentication(
    CookieAuthenticationDefaults.AuthenticationScheme)
    .AddCookie(options =>
    {
        options.LoginPath = "/Login/Index";
        options.AccessDeniedPath = "/Login/AccessDenied";

        options.Cookie.Name = "BiostarAuth";

        // Cookie security
        options.Cookie.HttpOnly = true;
        options.Cookie.SecurePolicy = CookieSecurePolicy.Always;
        options.Cookie.SameSite = SameSiteMode.Lax;
        options.Cookie.IsEssential = true;

        // Match the configured API token lifetime
        options.ExpireTimeSpan = TimeSpan.FromDays(365);
        options.SlidingExpiration = false;
    });


builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("DashboardAccess", policy =>
    {
        policy.RequireClaim(
            "access_point",
            "DASHBOARD_VIEW");
    });

    options.AddPolicy("QaQcReceivingAccess", policy =>
    {
        policy.RequireClaim(
            "access_point",
            "QC_RECEIVING_INSPECTION");
    });

    options.AddPolicy("QaQcInspectionAccess", policy =>
    {
        policy.RequireClaim(
            "access_point",
            "QC_INSPECTIONS");
    });

    options.AddPolicy("LAB_INVENTORY_LIST", policy =>
    {
        policy.RequireAuthenticatedUser();
        policy.RequireAssertion(context =>
            context.User.IsInRole("ADMIN") ||
            context.User.HasClaim(
                "access_point",
                "LAB_INVENTORY_LIST"));
    });

    options.AddPolicy("LAB_INVENTORY_TRANSACTIONS", policy =>
    {
        policy.RequireAuthenticatedUser();
        policy.RequireAssertion(context =>
            context.User.IsInRole("ADMIN") ||
            context.User.HasClaim(
                "access_point",
                "LAB_INVENTORY_TRANSACTIONS"));
    });

    options.AddPolicy("LAB_INVENTORY_ANY", policy =>
    {
        policy.RequireAuthenticatedUser();
        policy.RequireAssertion(context =>
            context.User.IsInRole("ADMIN") ||
            context.User.HasClaim("access_point", "LAB_INVENTORY_LIST") ||
            context.User.HasClaim("access_point", "LAB_INVENTORY_TRANSACTIONS"));
    });
});


builder.Services.AddHttpContextAccessor();

builder.Services.AddTransient<JwtAuthHandler>();

builder.Services.AddHttpClient<ApiService>(client =>
{
    var baseUrl = builder.Configuration["ApiSettings:BaseUrl"];
    client.BaseAddress = new Uri(baseUrl!);
})
.AddHttpMessageHandler<JwtAuthHandler>();



builder.Services.AddHttpClient("ApiClient", client =>
{
    var baseUrl = builder.Configuration["ApiSettings:BaseUrl"];
    client.BaseAddress = new Uri(baseUrl!);
});



builder.Services.AddDistributedMemoryCache();

builder.Services.AddSession(options =>
{
    options.IdleTimeout = TimeSpan.FromHours(8);
    options.Cookie.HttpOnly = true;
    options.Cookie.IsEssential = true;
});


var app = builder.Build();

if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Home/Error");
    app.UseHsts();
}

app.UseHttpsRedirection();
app.UseStaticFiles();
app.UseRouting();
app.UseSession();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Login}/{action=Index}/{id?}");

app.Run();