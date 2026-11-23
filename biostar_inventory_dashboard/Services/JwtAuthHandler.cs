
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Http;
using System.Net.Http.Headers;

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

            return await base.SendAsync(
                request,
                cancellationToken);
        }
    }
}
