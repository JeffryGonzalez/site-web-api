--- 
title: JWT and OIDC 
--- 


Install the `Microsoft.AspNetCore.Authentication.JwtBearer` NuGet Package.

In the `Program.cs`:

```csharp 
builder.Services.AddAuthentication().AddJwtBearer(options =>
{
    options.RequireHttpsMetadata = !builder.Environment.IsDevelopment();   
});
builder.Services.AddAuthorization();
```

Go to a terminal in your project's working directory and run:

```sh
dotnet user-jwts create
dotnet user-jwts create -n bob@aol.com
dotnet user-jwts create -n sue@aol.com --role Admin --role Boss
dotnet user-jwts create -n carl@aol.com --role Reader --valid-for 1095d 
```

(the last example makes the token valid for three years.)

This will update your `appsettings.development.json`:

```json
{
	"Authentication": {
	  "Schemes": {
	    "Bearer": {
	      "ValidAudiences": [
	        "http://localhost:35191",
	        "https://localhost:0",
	        "http://localhost:5008"
	      ],
	      "ValidIssuer": "dotnet-user-jwts"
	    }
	  }
	}
}
```


## Add To Swagger / OpenAPI

```csharp
builder.Services.AddSwaggerGen(options =>
{
    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header with bearer token",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Scheme = "Bearer"
    });
    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Id = "Bearer",
                    Type = ReferenceType.SecurityScheme
                },
                Scheme = "oauth2",
                Name = "Bearer ",
                In = ParameterLocation.Header
            },
            []
        }
    });
});
```

## In an HTTP File

```http
# For more info on HTTP files go to https://aka.ms/vs/httpfile
@host=localhost
@port=5008

# dotnet user-jwts create -n carl@aol.com --role Reader --valid-for 1095d
@carlToken=Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1bmlxdWVfbmFtZSI6ImNhcmxAYW9sLmNvbSIsInN1YiI6ImNhcmxAYW9sLmNvbSIsImp0aSI6IjhmYzQ1ZTY0Iiwicm9sZSI6IlJlYWRlciIsImF1ZCI6WyJodHRwOi8vbG9jYWxob3N0OjM1MTkxIiwiaHR0cHM6Ly9sb2NhbGhvc3Q6MCIsImh0dHA6Ly9sb2NhbGhvc3Q6NTAwOCJdLCJuYmYiOjE3MTQ1NjQwMzcsImV4cCI6MTgwOTE3MjAzNywiaWF0IjoxNzE0NTY0MDM3LCJpc3MiOiJkb3RuZXQtdXNlci1qd3RzIn0.V2TtyKtrxbyL5iRf2gax8122TPwgEspb0k7DZXEPgok

# dotnet user-jwts create -n sue@aol.com --role Admin --role Boss
@sueToken=Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1bmlxdWVfbmFtZSI6InN1ZUBhb2wuY29tIiwic3ViIjoic3VlQGFvbC5jb20iLCJqdGkiOiJkYTVhYzY3ZiIsInJvbGUiOlsiQWRtaW4iLCJCb3NzIl0sImF1ZCI6WyJodHRwOi8vbG9jYWxob3N0OjM1MTkxIiwiaHR0cHM6Ly9sb2NhbGhvc3Q6MCIsImh0dHA6Ly9sb2NhbGhvc3Q6NTAwOCJdLCJuYmYiOjE3MTQ1NjUyMDAsImV4cCI6MTcyMjUxNDAwMCwiaWF0IjoxNzE0NTY1MjAwLCJpc3MiOiJkb3RuZXQtdXNlci1qd3RzIn0.3ksg9uDVqypqSnnZcheYrE_9bKEs7tZd1166tL4ViNw
GET http://{{host}}:{{port}}/tacos
Authorization: {{sueToken}}


###

# This will get a 403 - Forbidden (we know who you are, and no.)
GET http://{{host}}:{{port}}/tacos
Authorization: {{carlToken}}

### 

# This will get a 401 - Unauthorized (We don't know who you are)
GET http://{{host}}:{{port}}/tacos
```

## Accessing Claims in Middleware (Wolverine)

```csharp
public static class UserDetectionMiddleware
{
    public static async Task<(UserData?, ProblemDetails)> Load(ClaimsPrincipal principal,IDocumentSession session)
    {
        var userIdClaim = principal.FindFirst(ClaimTypes.NameIdentifier);
        if (userIdClaim is not null)
        {
            var savedUser = await session.Query<User>().Where(u => u.Sub == userIdClaim.Value).SingleOrDefaultAsync();
            if (savedUser is null)
            {
                var id = Guid.NewGuid();
                session.Events.StartStream(id, new UserCreated(userIdClaim.Value));
                await session.SaveChangesAsync();
                return (new UserData(id, userIdClaim.Value), WolverineContinue.NoProblems);
            }
            else
            {
                return (new UserData(savedUser.Id, userIdClaim.Value), WolverineContinue.NoProblems);
            }
        }
        return (null, new ProblemDetails { Detail = "No User", Status = 400 });
    }
}
```

## Adding Authorization Policies

See [Policy-based authorization in ASP.NET Core | Microsoft Learn](https://learn.microsoft.com/en-us/aspnet/core/security/authorization/policies?view=aspnetcore-8.0)

```csharp
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("IsAdmin", policy => policy.RequireRole("Admin"));
});
```

Use with Minimal API:

```csharp
app.MapGet("/tacos", () =>
{
    return "Delicious";
}).RequireAuthorization("IsAdmin");
```

For Controller Methods, you can add the `Authorize` attribute:

```csharp
[Authorize(Roles = "Admin", Policy = "IsCool")]
```
## Stubbing with Alba

```csharp
 api.WithClaim(new Claim(ClaimTypes.NameIdentifier ,"jeff@hypertheory.com")); // adds "sub" claim
 api.WithClaim(new Claim(ClaimTypes.Role, "Admin"));
 api.WithClaim(new Claim(ClaimTypes.Role, "User"));



 use the mock OAuth2 / OIDC server from here: [navikt/mock-oauth2-server: A scriptable/customizable web server for testing HTTP clients using OAuth2/OpenID Connect or applications with a dependency to a running OAuth2 server (i.e. APIs requiring signed JWTs from a known issuer) (github.com)](https://github.com/navikt/mock-oauth2-server)

```yml
services:
  auth:
    image: ghcr.io/navikt/mock-oauth2-server:2.1.9
    ports:
      - 9090:8080
```

Add the `Microsoft.AspNetCore.Authentication.JwtBearer` NuGet.

## Configuring the Auth:

In your `appsettings.Development.json`:

```json
{
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  },
  "Authentication": {

    "Schemes": {
      "Bearer": {
        "MetadataAddress": "http://localhost:9090/default/.well-known/openid-configuration",
        "RequireHttpsMetadata": false,
        "ValidateAudience": false
      }
    }
  }
}
```

In `Program.cs`

```csharp
builder.Services.AddAuthentication().AddJwtBearer();  
builder.Services.AddAuthorization();

// after build

app.UseAuthentication();  
app.UseAuthorization();
```

Example Endpoint:

```csharp
app.MapGet("/sayhi", (ClaimsPrincipal principal) =>
    {
        var user = principal.FindFirstValue(ClaimTypes.NameIdentifier);
        return $"Hello, {user}";
    })
    .WithOpenApi().RequireAuthorization();
}
```
## Generating Tokens with a Bash Script


```bash
#!/bin/bash

echo 'Generating Boss Token'

dotnet user-jwts create -n boss@company.com --role SoftwareCenter --role Admin |  grep -oP '(?<=Token: ).*' | clip

echo 'Token for Boss is in your clipboard.'
```


