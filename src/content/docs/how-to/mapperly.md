--- 
title: Mapperly 
--- 

# Using Mapperly For Generating Mappings


Some sample Mapperly code:

```csharp
using Riok.Mapperly.Abstractions;
using Shouldly;

namespace IssueTrackerApi.ContractTests;

public class MappingTests
{
    [Fact]
    public void DoIt()
    {
        var source = new RequestModel("Jeff", "jeff@hypertheory.com");

        var mapped = source.MapFromRequestModel();

        mapped.Name.ShouldBe("Jeff");
        mapped.SubscriberEmail.ShouldBe("jeff@hypertheory.com");
        Assert.Equal("jeff@hypertheory.com", mapped.SubscriberEmail);
        mapped.CreatedAt.ShouldBe(DateTimeOffset.Now, TimeSpan.FromMilliseconds(100));
        mapped.Id.ShouldNotBe(Guid.Empty);
    }
    
}

public record RequestModel(string Name, string Email);

public record NewsletterSubscription
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string SubscriberEmail { get; set; } = string.Empty;
    public DateTimeOffset CreatedAt { get; set; }
}

[Mapper]
public static partial class NewsletterSubscriptionMapper
{
    [MapProperty(nameof(RequestModel.Email), nameof(NewsletterSubscription.SubscriberEmail))]
    private static partial NewsletterSubscription MapFromModel(RequestModel model);
    public static NewsletterSubscription MapFromRequestModel(this RequestModel model)
    {
        var m = MapFromModel(model);
        m.CreatedAt = DateTimeOffset.Now;
        m.Id = Guid.NewGuid();
        return m;
    }
}
```
