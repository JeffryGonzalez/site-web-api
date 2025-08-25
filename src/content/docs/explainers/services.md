---
title: Services and Service Registration
---

Services are objects that are responsible for a bounded set of data (state) and the behaviors associated with that data in your application.

Since we build our APIs to handle short-lived HTTP Request/Response cycles, and often involve many "players" or "collaborators" to fulfill the request, we will often have code that is arregated together in a variety of "recipes" for accomplishing tasks in our API.


## Service Lifetimes

"Lifetimes" for services indicate how long a service lives after it is created. *When* a service is created will be discussed below. 

"Lives" here means how long it will be "reachable" by our code. It does not mean how long it will remain in memory in our application, because .NET is garbage collected and thus has *non-deterministic finalization*.

### Scoped Services

"Scoped" here refers to the "lifetime" of a particular service in our application. We can think, usually, of a scope in an API as being "the length of time it takes to fulfill an HTTP Request". 

### Transient Services

Transient services are created new for each use in your application.

Transient services are similiar to just "newing up" an instance of a service yourself. We (I?) don't use these a lot in APIs, unless you have a transient service that requires the injection of other services.



### Singleton Services

One instance of a Singleton service is shared across your application. These must be thread-safe.

## Service Creation

When you register services you are adding them to the `ServicesCollection`, which is, itself, a singleton service used throughout your API to resolve dependencies.

The basic, low-level, methods for registering a service on the `ServicesCollection` are:

- `builder.Services.AddTransient`
- `builder.Services.AddScoped`
- `builder.Services.AddSingleton`

For each of these there are a variety of *overloads* (both based on generic type parameters and method parameters) that impact when the instance of the service will be created.

### Lazy Instantiation

Lazy here means that we want the API runtime to create an instance of this on "demand", as late as possible.

You call the appropriate lifetime method, and simply pass the type of the service to the type argument (or, an interface, and it's implementation).

```csharp
builder.Services.AddSingleton<HttpClient>();
builder.Services.AddScoped<MartenDataService>();
builder.Services.AddScoped<ILookupVendors, MartenDataService>();
```

In each of these cases, *none* of these services will be constructed *until* they are provided (Injected) into a controller or another service.

Another way to do *lazy* initialization is to use a "factory" function. 

```csharp
builder.Services.AddSingleton<ICountHits>(sp =>
{
    var id = Guid.Parse("b37bd889-591a-40b0-b97b-00f007866607");
    var ssf = sp.GetRequiredService<IServiceScopeFactory>();
    return new PersistentHitCounter(id, ssf);
});
```

This is useful when the service has some construction that needs to be passed in as parameters that cannot be resolved from other services.

For example, the `PersistentHitCounter` has a constructor that looks like this:

```csharp
public class PersistentHitCounter(
    Guid id,
    IServiceScopeFactory scopeFactory
    ) : ICountHits

{
    // ... implementation elided
}
```

Singleton services can be *eagerly* constructed during application startup. This is typically done if the service has some complex initialization logic that needs to be accomplished, but you don't want the request that makes the first use of this service to "pay the tax" in terms of performance.

```csharp
var priceList = await priceListFileService.GetCurrentPriceListAsync();
var service = new SomeSlowStartingService(lookedupPrices);
builder.Services.AddSingleton<SomeSlowStartingService>(service);
```

## Accessing Services with a Short Lifetime inside of a Singleton Service.

Sometimes (often?) a service registered as a Singleton will need to use other services that are Scoped (or, perhaps, Transient). These, for somewhat obvious reasons, cannot be "injected" into the constructor of these services (nor should they be! being clever with this can cause memory leaks, and worse).

You *can* inject in the `IServiceScopeFactory` service, and use that to dynamically retrieve a service at call time.

```csharp
public class PersistentHitCounter(
    Guid id,
    IServiceScopeFactory scopeFactory
    ) : ICountHits

{
    
    public async Task<int> GetHitCount(CancellationToken token)
    {
        // inside a singleton, but I need to use a "scoped" service - 
        using var scope = scopeFactory.CreateScope();
        using var session = scope.ServiceProvider.GetRequiredService<IDocumentSession>();
        var count = 0;
            
        var hitCount = await session.Query<HitCounterEntity>()
            .Where(h => h.Id == id)
            .SingleOrDefaultAsync(token);
    
        if (hitCount is null)
        {
            session.Store(new HitCounterEntity(id, 1));
            count = 1;
        }
        else
        {
            var updatedHitCount = hitCount with { Count = hitCount.Count + 1 };
            session.Store(updatedHitCount);
           count = updatedHitCount.Count;
        }
        await session.SaveChangesAsync(token);
        return count;
    }
}
```