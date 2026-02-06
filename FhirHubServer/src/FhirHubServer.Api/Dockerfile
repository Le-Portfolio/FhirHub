FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 8080

RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*

LABEL org.opencontainers.image.source="https://github.com/your-org/FhirHub"
LABEL org.opencontainers.image.description="FhirHub API Server"
LABEL org.opencontainers.image.licenses="MIT"

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
ARG BUILD_CONFIGURATION=Release
WORKDIR /src
COPY ["src/FhirHubServer.Core/FhirHubServer.Core.csproj", "src/FhirHubServer.Core/"]
COPY ["src/FhirHubServer.Api/FhirHubServer.Api.csproj", "src/FhirHubServer.Api/"]
RUN dotnet restore "src/FhirHubServer.Api/FhirHubServer.Api.csproj"
COPY . .
WORKDIR "/src/src/FhirHubServer.Api"
RUN dotnet build "FhirHubServer.Api.csproj" -c $BUILD_CONFIGURATION -o /app/build --no-restore

FROM build AS publish
ARG BUILD_CONFIGURATION=Release
RUN dotnet publish "FhirHubServer.Api.csproj" -c $BUILD_CONFIGURATION -o /app/publish /p:UseAppHost=false --no-restore

FROM base AS final
WORKDIR /app

ENV DOTNET_EnableDiagnostics=0

RUN mkdir -p /app/logs && chown 1654:1654 /app/logs
USER app
COPY --from=publish /app/publish .

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD curl -sf http://127.0.0.1:8080/swagger/v1/swagger.json > /dev/null || exit 1

ENTRYPOINT ["dotnet", "FhirHubServer.Api.dll"]
