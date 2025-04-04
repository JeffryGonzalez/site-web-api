--- 
title: XUnit Fixtures
--- 


In an XUnit test class, a new instance of the test class is created for *each* `[Fact]`, and for each input to a `[Theory]`.

For the purposes of this document, I will just call these things (`[Fact]`'s and `[Theory]`'s **tests**).

:::tip 
For Unit Tests, no shared state is a good thing. 
This means that no state is shared between your tests which is at the level of Unit Testing, the *best* approach.
This is true even if you use the classes constructor. The constructor will be called each time a test is executed.
:::

I think this default is really good for Unit Tests. You can still move common test setup tasks to a constructor,
and Unit Tests definitely have a "smell" if you feel like you need any kind of test cleanup or a "destructor", because Unit Tests
should not work like that. Like, really, if you have a requirement to move something that is asynchronous to a constructor in a unit test, you probably are doing something wrong. Rethink your code.

## System Tests

In our System Tests, however, that is a different story. 

We often *do* want to share state between tests. We can accomplish this at several levels:

### Within a Test Class

While within a test class itself, no state can be shared between tests, you *can* do common setup through the constructor, and if there is common cleanup that can happen by implementing `IDisposable`. XUnit also supports the `IAsyncLifetime` interface. If your test class implements that interface, the `InitializeAsync` method will be called before each test, and the `DisposeAsync` will be called after each test. This is helpful because within System Tests we often have asynchronous work to do during setting up (and tearing down), like seeding data in a database, or cleaning it up afterwards.

### Creating a Class Fixture

In XUnit, a class fixture is a class that provides shared state for each of the tests (`Facts`, and each `Theory`) in a particular test class. These fixtures can also implement `IAsyncLifetime` (as well as having a constructor, and using `IDisposable`). 

Each test class that wants to use this fixture (think "context"), can implement a marker interface (`IClassFixture<T>`) where `T` is the type of the fixture class. (You can also have this fixture in this case injected into your test class's constructor, if needed). 

XUnit will create *one* instance of this fixture that will be shared across all the tests in the class.

If multiple test classes use this fixture, multiple instances will be created for each test class.

Here is an example of a fixture that implements `IAsyncLifetime`
```csharp
public class Fixture : IAsyncLifetime
{
    public Fixture()
    {
    }

    public string SharedState {get; set;} 

    public Task InitializeAsync()
    {
        SharedState = Guid.NewGuid();
        return Task.CompletedTask;
    }

    public Task DisposeAsync()
    {
        return Task.CompletedTask;
    }
}
```

To use this fixture, your test class might look like this:

```csharp
public class SomeTest : IClassFixture<Fixture>
{

  private readonly string _sharedState;
  private readonly Fixture _fixture;
  public SomeTest(Fixture fixture) 
  {
    _fixture = fixture;
    _sharedState = _fixture.SharedState;
  }

  [Fact]
  public void SomeFact() 
  {
    Assert.Equal(_sharedState, _fixture.SharedState) 
  }

  [Theory]
  [InlineData("dog")]
  [InlineData("cat")]
  [InlineData("mouse")]
  public void SomeTheory(string animal)
  {

    Assert.Equal(_sharedState, _fixture.SharedState) 
  }

}
```

If you create another test class, using this example, in that test class the shared state would be different (a new guid)
because it would be a different instance of the fixture.

```csharp
public class SomeOtherTest(Fixture fixture): IClassFixture<Fixture> 
{
// ...
}
```

### Shared Collections

:::caution[Sharing state across tests is challenging]
This takes some thought. For me, it's always a refactoring. After I've duplicated a lot of work, I'll consider it. 
It gets increasingly more dangerous the "wider" you share that context.
Sharing state is a performance refactoring. It isn't strictly necessary.
:::

XUnit offers a way to share the same instance of a fixture across one or more test classes. These are called Collections.

You start with a Fixture, and then create another *thing* called a "CollectionDefinition".

They look like this:

```csharp
[CollectionDefinition("SharedGroup1")]
public class SharedCollection : ICollectionFixture<Fixture> {}
```

A fixture can be part of more than one Collection, so you could create others like this:

```csharp
[CollectionDefinition("SharedGroup2")]
public class SharedCollection : ICollectionFixture<Fixture> {}
```

Your test classes, then, can use these fixtures like this:

```csharp
[Collection("SharedGroup1")]
public class TestClassOne(Fixture fixture): {}


[Collection("SharedGroup1")]
public class TestClassTwo(Fixture fixture): {}

[Collection("SharedGroup2")]
public class TestClassThree(Fixture fixture): {}


[Collection("SharedGroup2")]
public class TestClassFour(Fixture fixture): {}


[Collection("SharedGroup2")]
public class TestClassFive(Fixture fixture): {}
```

In this example, only one instance of `SharedGroup1` and `SharedGroup2` would be created, but `X` instances of each of the
test classes would be created (equal to the number of tests they each had).


