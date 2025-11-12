FROM mcr.microsoft.com/dotnet/sdk:9.0 AS builder 
WORKDIR /Application

COPY WebApp/*.csproj ./
RUN dotnet restore

COPY WebApp/ ./
RUN dotnet publish -c Release -o output

FROM mcr.microsoft.com/dotnet/aspnet:9.0
WORKDIR /Application
COPY --from=builder /Application/output .


EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080

ENTRYPOINT ["dotnet", "WebApp.dll"]