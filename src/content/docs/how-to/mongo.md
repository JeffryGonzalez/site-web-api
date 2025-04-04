--- 
title: MongoDb With .Net 
--- 


The Nuget package is `MongoDb.Driver`.

App Settings:

```json
{
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  },
  "MongoDbConnection": {
    "ConnectionString": "mongodb://admin:TokyoJoe138!@localhost:27017/",
    "Database": "employees_db",
    "Collection": "employees",
    "LogCommands":  true
  }
}
```

MongoConnectionOptions.cs

```csharp
namespace EmployeesApi;

public class MongoConnectionOptions
{
    public static string SectionName = "MongoDbConnection";

    public string ConnectionString
    {
        get; set;
    } = "";

    public string Database
    {
        get; set;
    } = "";

    public string Collection
    {
        get; set;
    } = "";
    public bool LogCommands
    {
        get; set;
    }
}
```

In Program.cs

```csharp
builder.Services.Configure<MongoConnectionOptions>(builder.Configuration.GetSection(MongoConnectionOptions.SectionName));
``

```


## The Route Constraint
```csharp
using MongoDB.Bson;

namespace EmployeesApi;

// "bsonid"
public class BsonIdConstaint : IRouteConstraint
{
    public bool Match(HttpContext? httpContext, IRouter? route, string routeKey, RouteValueDictionary values, RouteDirection routeDirection)
    {
       if(values.TryGetValue(routeKey, out var routeValue))
        {
            var parameterValue = Convert.ToString(routeValue);
            if(ObjectId.TryParse(parameterValue, out var _))
            {
                return true;
            } else
            {
                return false;
            }
        } else
        {
            return false;
        }
    }
}
```

Add it in `Program.cs`:

```csharp
builder.Services.AddRouting(options =>

{

options.ConstraintMap.Add("bsonid", typeof(BsonIdConstaint));

});
```


## Domain Entity
Here is an example Domain entity:

```csharp
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace EmployeesApi.Domain;

public class Employee
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public ObjectId Id
    {
        get; set;
    }

    [BsonElement("department")]
    public string Department
    {
        get; set;
    } = "";

    [BsonElement("name")]
    public NameInformation Name
    {
        get; set;
    } = new();

    [BsonElement("salary")]
    public decimal? Salary
    {
        get; set;
    }

    [BsonElement("removed")]
    public bool? Removed
    {
        get; set;
    } = false;

}


public class NameInformation
{
    [BsonElement("firstName")]
    public string FirstName
    {
        get; set;
    } = "";

    [BsonElement("lastName")]
    public string LastName
    {
        get; set;
    } = "";
}
```

## Adapter

```csharp
using EmployeesApi.Domain;
using Microsoft.Extensions.Options;
using MongoDB.Bson;
using MongoDB.Driver;
using MongoDB.Driver.Core.Events;

namespace EmployeesApi.Adapters;

public class EmployeesMongoDbAdapter
{
    private readonly IMongoCollection<Employee> _employeeCollection;
    private readonly ILogger<EmployeesMongoDbAdapter> _logger;

    public EmployeesMongoDbAdapter(ILogger<EmployeesMongoDbAdapter> logger, IOptions<MongoConnectionOptions> options)
    {
               
        _logger = logger;

        var clientSettings = MongoClientSettings.FromConnectionString(options.Value.ConnectionString);
        //clientSettings.LinqProvider = MongoDB.Driver.Linq.LinqProvider.V3;
        if(options.Value.LogCommands)
        {
            clientSettings.ClusterConfigurator = db =>
            {
                db.Subscribe<CommandStartedEvent>(e =>
                {
                    _logger.LogInformation($"Running {e.CommandName} - the command looks like this {e.Command.ToJson()}");
                });
            };
        }

        var conn = new MongoClient(clientSettings);

        var db = conn.GetDatabase(options.Value.Database);

        _employeeCollection = db.GetCollection<Employee>(options.Value.Collection);
    }


    public IMongoCollection<Employee> GetEmployeeCollection() => _employeeCollection;


}
```

### The Domain Service

>[!NOTE] I've found that using the Projection and Filter stuff is *way* better than the LINQ stuff. The LINQ (v2 at least) provider isn't very intelligent.


```csharp
using MongoDB.Bson;
using MongoDB.Driver;
using MongoDB.Driver.Linq;

namespace EmployeesApi.Domain;

public class EmployeeLookup : ILookupEmployees, IManageEmployees
{
    private readonly EmployeesMongoDbAdapter _adapter;

    public EmployeeLookup(EmployeesMongoDbAdapter adapter)
    {
        _adapter = adapter;
    }

    public async Task<EmployeeDocumentResponse> CreateEmployeeAsync(EmployeeCreateRequest request)
    {
        var employeeToAdd = new Employee
        {
            Department = request.Department,
            Name = new NameInformation { FirstName = request.FirstName, LastName = request.LastName },
            Salary = request.StartingSalary
        };

        // This is a "side effect producing call"
        await _adapter.GetEmployeeCollection().InsertOneAsync(employeeToAdd);

        var response = new EmployeeDocumentResponse
        {
            Id = employeeToAdd.Id.ToString(),
            Department = employeeToAdd.Department,
            Name = new EmployeeNameInformation
            {
                FirstName = employeeToAdd.Name.FirstName,
                LastName = employeeToAdd.Name.LastName
            }
        };
        return response;
        
    }

    public async Task FireAsync(string id)
    {
        var bId = ObjectId.Parse(id);
        var filter = Builders<Employee>.Filter.Where(e => e.Id == bId);
        var update = Builders<Employee>.Update.Set(e => e.Removed, true);

        await _adapter.GetEmployeeCollection().UpdateOneAsync(filter, update);
       
    }

    public async Task<List<EmployeeSummaryResponse>> GetAllEmployeeSummariesAsync()
    {
        var query =  _adapter.GetEmployeeCollection().AsQueryable()
            .Where(e => !e.Removed.HasValue || e.Removed.Value == false)
            .OrderBy(e => e.Name.LastName)
             .Select(e => new EmployeeSummaryResponse
             {
                 Id = e.Id.ToString(),
                 Name = new EmployeeNameInformation { FirstName = e.Name.FirstName, LastName = e.Name.LastName }
             });


        // a thing we add here later.
        var response = await query.ToListAsync();
        return response;
    }

    public async Task<EmployeeDocumentResponse> GetEmployeeByIdAsync(string id)
    {

        // if we get here, that sucker is an ObjectID
        var bId = ObjectId.Parse(id);

        var projection = Builders<Employee>.Projection.Expression(emp => new EmployeeDocumentResponse
        {
            Id = emp.Id.ToString(),
            Department = emp.Department,
            Name = new EmployeeNameInformation
            {
                FirstName = emp.Name.FirstName,
                LastName = emp.Name.LastName
            }
        });

        var response = await _adapter.GetEmployeeCollection()
            .Find(e => e.Id == bId && !e.Removed.HasValue || e.Removed!.Value == false)
            .Project(projection).SingleOrDefaultAsync();

        return response;
    }

    public async Task<bool> UpdateDepartmentAsync(string id, string department)
    {
        var bId = ObjectId.Parse(id);
        var filter = Builders<Employee>.Filter.Where(e => e.Id == bId); // TODO: Only update employees that haven't been removed.
        var update = Builders<Employee>.Update.Set(e => e.Department, department);

        var changes = await _adapter.GetEmployeeCollection().UpdateOneAsync(filter, update);

        //return changes.ModifiedCount == 1;
        return changes.MatchedCount == 1;
    }

    public async Task<bool> UpdateNameAsync(string id, EmployeeNameInformation name)
    {
        var updatedName = new NameInformation { FirstName = name.FirstName, LastName = name.LastName };

        var bId = ObjectId.Parse(id);
        var filter = Builders<Employee>.Filter.Where(e => e.Id == bId); // TODO: Only update employees that haven't been removed.
        var update = Builders<Employee>.Update.Set(e => e.Name, updatedName);

        var changed = await _adapter.GetEmployeeCollection().UpdateOneAsync(filter, update);

        return changed.MatchedCount == 1;

    }
}
```


