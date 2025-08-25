---
title: Configure Open Telemetry
---

## Installing the NuGet Packages


- `OpenTelemetry.Exporter.OpenTelemetryProtocol`
- `OpenTelemetry.Extensions.Hosting`
- `OpenTelemetry.Instrumentation.AspNetCore`
- `OpenTelemetry.Instrumentation.Http`
- `OpenTelemetry.Instrumentation.Runtime`

## Configure Services

```csharp
builder.Logging.AddOpenTelemetry(logging =>
{
    logging.IncludeFormattedMessage = true;
    logging.IncludeScopes = true;
    logging.ParseStateValues = true;
});
builder.Services.AddMetrics()
    .AddOpenTelemetry()
    .WithMetrics(provider =>
    {
        provider
            .AddAspNetCoreInstrumentation()
            .AddHttpClientInstrumentation()
            .AddRuntimeInstrumentation();
    }).WithTracing(options =>
    {
        if (builder.Environment.IsDevelopment())
        {
            options.SetSampler<AlwaysOnSampler>();
        }

        options.AddAspNetCoreInstrumentation()
            .AddHttpClientInstrumentation();
    });
if (!string.IsNullOrWhiteSpace(builder.Configuration["OTEL_EXPORTER_OTLP_ENDPOINT"]))
{
    builder.Services.Configure<OpenTelemetryLoggerOptions>(options => options.AddOtlpExporter())
        .ConfigureOpenTelemetryMeterProvider(metrics => metrics.AddOtlpExporter())
        .ConfigureOpenTelemetryTracerProvider(tracing => tracing.AddOtlpExporter());
}
```

## Add Environment Variable

In your `appsettings.Development.json`:

```json
  "OTEL_EXPORTER_OTLP_ENDPOINT": "http://localhost:4317",
  "OTEL_SERVICE_NAME": "ScratchApi"
```

## Docker Compose for Microsoft Aspire Dashboard

```yml
services:
  aspire-dashboard:
    image: mcr.microsoft.com/dotnet/aspire-dashboard:latest
    ports:
      - 18888:18888
      - 4317:18889

```

Look at the logs for that container, and a link with the token to the dashboard will be visible.