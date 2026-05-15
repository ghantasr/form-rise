FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src
COPY FormFlow.Api/FormFlow.Api.csproj FormFlow.Api/
RUN dotnet restore FormFlow.Api/FormFlow.Api.csproj
COPY . .
RUN dotnet publish FormFlow.Api/FormFlow.Api.csproj -c Release -o /app

FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS runtime
WORKDIR /app
COPY --from=build /app .
EXPOSE 8080
ENTRYPOINT ["dotnet", "FormFlow.Api.dll"]
