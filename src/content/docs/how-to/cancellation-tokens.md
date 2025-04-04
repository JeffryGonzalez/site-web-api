--- 
title: Providing Cancellation Tokens 
--- 

HTTP has a facility through which HTTP requests can be cancelled by the client "in flight". 

Cancellation usually occurs because the ephemeral TCP connection from the client is dropped. This can occur for many reasons, but a common scenario is a client making multiple "polling" requests to the same resource. Think of a user refreshing the web browser over and over.



Passing Cancellation Tokens to async tasks:

```csharp mark="cancellationToken"
public class SlowRequestController : Controller
{
    private readonly ILogger _logger;

    public SlowRequestController(ILogger<SlowRequestController> logger)
    {
        _logger = logger;
    }

    [HttpGet("/slowtest")]
    public async Task<string> Get(CancellationToken cancellationToken)
    {
        _logger.LogInformation("Starting to do slow work");

        // slow async action, e.g. call external api
        await Task.Delay(10_000, cancellationToken);

        var message = "Finished slow delay of 10 seconds.";

        _logger.LogInformation(message);

        return message;
    }
}
```
