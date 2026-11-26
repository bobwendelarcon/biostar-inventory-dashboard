
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Http;
using System.Net.Http.Headers;
using System.Net;
using Microsoft.AspNetCore.Authentication.Cookies;

namespace biostar_inventory_dashboard.Services
{
    public class JwtAuthHandler : DelegatingHandler
    {
        private readonly IHttpContextAccessor _httpContextAccessor;

        public JwtAuthHandler(
            IHttpContextAccessor httpContextAccessor)
        {
            _httpContextAccessor = httpContextAccessor;
        }

        protected override async Task<HttpResponseMessage> SendAsync(
            HttpRequestMessage request,
            CancellationToken cancellationToken)
        {
            var context = _httpContextAccessor.HttpContext;

            // Never attach a token to the login request.
            var isLoginRequest =
                request.RequestUri?.AbsolutePath
                    .TrimEnd('/')
                    .EndsWith(
                        "/api/User/login",
                        StringComparison.OrdinalIgnoreCase) == true;

            if (!isLoginRequest &&
                context?.User?.Identity?.IsAuthenticated == true)
            {
                var token = await context.GetTokenAsync(
                    "access_token");

                if (!string.IsNullOrWhiteSpace(token))
                {
                    request.Headers.Authorization =
                        new AuthenticationHeaderValue(
                            "Bearer",
                            token);
                }
            }

            var response = await base.SendAsync(
     request,
     cancellationToken);

            // Clear invalid authentication sessions.
            if (!isLoginRequest &&
                response.StatusCode == HttpStatusCode.Unauthorized &&
                context?.User?.Identity?.IsAuthenticated == true &&
                !context.Response.HasStarted)
            {
                await context.SignOutAsync(
                    CookieAuthenticationDefaults.AuthenticationScheme);
            }

            return response;
        }
    }
}
