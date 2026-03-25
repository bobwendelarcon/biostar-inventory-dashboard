FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

COPY ["biostar_inventory_dashboard.csproj", "./"]
RUN dotnet restore "biostar_inventory_dashboard.csproj"

COPY . .
RUN dotnet publish "biostar_inventory_dashboard.csproj" -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
COPY --from=build /app/publish .

ENV ASPNETCORE_URLS=http://0.0.0.0:10000
EXPOSE 10000

ENTRYPOINT ["dotnet", "biostar_inventory_dashboard.dll"]