--- 
title: Test Types
--- 


For me, the battle over what to call the types of tests we write as developers is over. 

First off, they are *all* tests, but we write different *types* of tests to prove, incrementally, the fitness of our code to move into the next environment. 

:::tip[Test Your Own Code First]
Part of the definition I give for the topic of "Developer Testing" is that our goal is to prove the code we've written.
*Very* often (almost always) our code will rely on backing services that we don't own. It will use libraries or frameworks
that we don't own. **In case of an emergency, secure your own oxygen before helping others.**
:::

## Unit Tests

- **Purpose**: To prove and verify the *technical* implementation of part of our application at a fine-grained level.

Unit tests prove a particular algorithm is implemented properly. The more *generally* some code is going to be used in your app, the more unit tests you need.

Unit tests are often abstracted away from any *real* business case, because adequately testing that code with a Systems Test (see below) wouldn't provide ample coverage.

:::tip 
Unit Tests are not usually "Business Aligned"
As application developers, we sometimes write Unit Tests as a way to fulfill a certain business requirement, but the point is
to generalize that problem with some code.
:::

I know it's a bit "mathy" and "nerdy" to say Unit Tests are for *algorithms*, but I think it is appropriate.

:::tip[Algorithm]
A good definition for an algorithm is something like "a finite sequence of instructions used to solve a class of problems".
The phrase "class of problems" means that you have identified an *abstraction* of some things that are happening across your
application and want to create a general-purpose solution to those problems, and, hopefully, in the future.
:::

Unit Tests can be written (perhaps using the form of "Test Driven Development") to *design* a solution to a problem.

::: tip Unit Tests Also Are To Verify Things That are Too Fine-Grained for Other Tests
An example would be ensuring the library you are using to validate incoming HTTP request messages (e.g. FluentValidation) 
is configured properly for each incoming message. Creating *business cases* in our System Tests for each possible permutation
would be cumbersome and costly. 
:::

### Rules for Unit Tests

I don't like saying "rules", but because Unit Tests are about proving *general* solutions, they don't ever do *specific* things like:

- No Using Databases
- No Touching the Network
- No Using the File System

A general solution shouldn't break every time a specific use of that solution is applied. Databases, networks, and File Systems, for example, are *always* specific uses.

## System Tests

These are usually our starting point. They demonstrate our understanding of particular "business cases". 

We use tests to *drive* our app from the point of view of the consumer or user of our application, and our tests replicate the expected ways in which our app can be used. As a matter of fact, the collection of *passing* System Tests are a verifiable specification of the capabilities of our system.

### What "Drives" our App?

Pretty much all code responds to some kind of "event". Even an app that just runs in the background, on a loop, is probably driven by a clock, or watching for file changes.

If our app processes messages from a message broker, then we develop it and test it by sending it messages from a broker to process.

If our app is a user interface (UI), we write tests that *emulate* the expected use cases we afford the user.

If our app has a programmer interface (an API), we write tests that *emulate* the expected use cases we afford the consumer of our app.

So "drivers" are things like clocks ticking, files changing, networks failing or becoming available, users clicking buttons and filling out forms, our code being delivered a message from a broker, or our code receiving a request to fulfill an HTTP request of some time.

### What does our App "Drive"?

Once our app receives some sort of stimulus (see What "Drives" our App?, above), our code does stuff. 

Simply, we get some input from somewhere, we *process it* and we usually provide some output. The output could be a specific response to the HTTP request, or something like that. 

So, our tests try to map inputs to outputs. If you had some code that added two integers, you could have a set of tests that demonstrated some examples of how that function could be used, and those examples (in the form of tests) should *always* pass.

For example:

```csharp
[Theory]
[InlineData(2,2,4)]
[InlineData(10,12,22)]
[InlineData(2147483627, 22, -2147483647)]
public void Test1(int a, int b, int expected)
{
    Assert.Equal(expected, MathThing.Add(a,b));
}
```

This doesn't prove our `MathThing.Add` method will work with *any* integers we might feed it, but because .NET has an *Integer* type,
and the compiler can check to make sure we aren't doing something like:

:::caution 
That last Example Is Weird
The last example in the above test is showing that if you overflow the integer type in C#, it rolls over.
And that is *true*, in .NET. If the sum of any two integers exceeds `Int.MaxValue` (2147483647), that is the answer you'll get.

If you try to *declare* an integer variable that exceeds the space of an integer, the compiler will tell you with a build error. But it isn't smart enough to know that we are adding two things together that *could* be bigger than the max value. Probably not something you'd want to hide behind an API.
:::

But back on point, the `Add` method here is a `map`. 

| Input | Map | Output |
| --------------- | --------------- | --------------- |
| 2,2| Add| 4 |
| 10,12| Add | 22|
| 2147483627,22 | Add | -2147493647 |

If you give the Add method 2 and 2, you will *always* get 4, etc. 

This is a "pure" function, because it is a map. It's a map because it is a pure function.

**Most of the code you write isn't a map, and it sure ain't pure!** :smiley: 

Let's have another (dumb) example. Let's say you are writing a function that returns a boolean. 
It returns `true` if the business is currently open, and false if it is closed. Let's say the business rules are pretty simple for this:
We are open Monday-Friday, 9:00 AM Eastern Time, until 5:00 PM Eastern Time.

You write the code, and then this test, on Friday at 4:58 PM and you push it to the repo. (of *course* you ran it before you pushed it, and the test passed. You aren't a *barbarian!*)

```csharp 
Assert.True(business.IsOpen());
```

At a little after five, you get a notification that the pipeline rejected your push. 

And you didn't even have a test that says it should return false when you are closed! Not a barbarian, but a *slacker!*.

| Input | Map | Output |
| -- | -- | -- |
| :question:   | IsOpen() | true |
| :question:   | IsOpen() | false |

This function is **not** a map. It is not a pure function.

:::tip
Why Am I Going On About This?
We can only test maps. We can only test pure functions.
:::

The thing is, that `IsOpen()` method (if it were real) *would* have an additional input. The clock.

| Input | Hidden Input | Map | Output |
| ----- | ------------ | --- | -------|
|       | Friday, June 15, 2024 at 4:58 PM EST | IsOpen() | True |
|       | Friday, June 15, 2024, at 5:01 PM EST | IsOpen() | False |

The response you get is based on something none of us can control. The clock. 

The clock is about the "changiest" thing there is in programming. That thing *never* returns the same value twice! (so far!). 
If our code relies on it to produce an output, we'll never be able to pin it down and prove it works.

We use lots of other shifty, changey things in our code. Like: *Databases*, *Networks*, *File Systems*. 

So, if we have a test where we want to say something like:


| Input | Hidden Input | Map | Output |
| ----- | ------------ | --- | -------|
| GET /products/beer | | `app.MapGet('/products/{sku}, ...)` | 200 Ok `{price: 12.99 }` |

And we know that in order to do the `...` part we have to:

- Make sure that we have beer. If not it should return a 404.
  - We look this up in a database. The database has the *cost* of the item, but...
  - We have to make an RPC call to another service that gives us the current markup for items, and we add it to the price for the result

That's even *worse* than the clock example above. 

#### The Reason we Use Backing Services 
The purpose of things like databases, other services, etc. is because they don't just give us "data", they give us "state". 
This is a little nit picky, but *technically* the word "data" means "facts". 

A piece of data, that is a fact, is "`Jeff's Weight: 150 lbs`".
Just like a reasonable approximation of Pi is 3.1415927.

The difference between those two examples, that while both are true "facts", the one about PI is *always* true,
while the one about my weight hasn't been true for about 20 years.

So, in the product lookup example, *if* the price of beer is and always will be 12.99, you don't need a database,
and you don't need a service to tell you what the markup is if it is always the same.

If this API was for Costco, and the request was:

`GET /products/hotdog` It would be a map to `{ price: 1.50}` (at least since the 80s.)
:::

#### System Tests are **Isolated** from Backing Services

"Isolated" means that, for our tests to be "pure maps", our tests cannot rely on *anything* our team does not control, directly.

This means that for example, if:
- We have a feature that relies on the time, we *have* to have a way to control the clock.
- We have a test that relies on a database we *own*, then we can use "fake" version of that database (or several) that 
can be reset to a known state for each test.
- :nose: We have a test that relies on a database we **don't own**, then our tests should stub or mock that database interaction.
- We have a test that relies on identity, we fake that in our tests by stubbing out the identity.
- We have a test that relies on an API backing service, we use mocks ("responders") so that we can design various scenarios based on the contract of that backing service.

System Testing is our super-power when it comes to gaining the confidence in our code to be truly independently deployable. In order to have that confidence, we *must* be able to do two things:

1. Code to Contracts, not Implementations
    - The whole point of backing services is, again, that the data returned from them or the way they process our requests changes over time. If our test will only pass because a backing service *always* returns a particular value for an operation, we aren't really testing anything *real*. 
2. Simulate scenarios our app *might* experience in the real world.
    - We have to have tests for scenarios that involve *chaos*. For example, how does our code react when a backing service returns invalid data? Or when there is a network error? What if the identity token of the caller is revoked in the middle of a long-running saga?


### Not All Parts of the "Map" are Verifiable Through the Output

If *only* development was as "easy" as writing an `add` function. A good API hides complexity from the consumer of that API. So, you are much more likely to write a feature to "Add A Vehicle To This Insurance Policy", or "Change this Employees Pay" than something simple. 

We *try* to verify our feature *works* through simulating the scenarios that the user will perform. 

For example, if I'm creating an API that implements some sort of "Shopping Cart", I'd test it like a human. In other words, if I add something to my cart, and I check the contents of my cart, that thing should be there. And if I add something to my cart and I get an error, then that thing *shouldn't* be in my cart. 

So my test scenarios would mimic that. Have a scenario where you add something to the cart, and verify it worked by retrieving the cart and verifying it is actually *in* the cart.

Resist the temptation to write tests in addition to this that verify a certain database command was run, or something like that.

But, what if, you might ask, we also have to write to the database some "meta" information that we won't reveal through our API, like tracking data (the user added this item from this web page, from this IP address, at this particular time) etc.? 

The first thing I'd ask is if you are *are* doing that, what is that data for? Often it is in support for another only slightly related feature, like "the analytics team retrieves this data to do business-y stuff with every once in a while". 

Well, test that through *that* feature. Make a scenario for that. I think it is a :rose: good practice to not add stuff you don't need. If I was creating the functionality for the shopping cart, I wouldn't add that meta stuff until I got to the feature for the analytics stuff. It has nothing to do with the shopping cart functionality, it has to do with the analytics functionality.

You *can* do things like query a database in your System Tests, but it is a :nose: smell. My goal is to deoderize that stuff as I go. 

There are other things that aren't observable from the response from the map. Some types of business or technical requirements might mean you have a requirement that says, for example, when a certain set of customers add something to their cart, and the price of that thing is above a certain threshold, then (and only then) should a notification be sent to their sales rep.

Again, try to make it observable and verifiable from some actual use case. Perhaps the notification is implemented by producing a message on a Kafka topic. Part of your test for that scenario should be to verify that a certain message was (or wasn't) produced on the topic. That can get cumbersome, and when it does, attend to it.

#### Attending to It
Those kind of things (including the requirement for certain types of things to be logged, etc.) are the "behind the scenes" things of business processing. We call these things, sometimes, "side effects". Going back to my silly `add` function, if we have a requirement that comes along that anytime someone adds a certain combination of integers, it is logged somewhere. We write some code that redirects the console's output to a string reader, and verify the correct string was written to the log (or not, depending on the scenario). But if you do that a bunch of times, it gets annoying and brittle. 

Fall back to Unit Tests. Generalize the problem. Create a service class that handles that stuff, write all those tests *once*, and then the rest of your tests can just verify whether that service was used properly or not.

::: tip Insert TikTok Video Here 
I'm thinking of that series of videos where a parent is preparing their child for "real life", by asking questions like "What if a stranger tells you they have a puppy in their van, and asks if you'd like to pet it?". The humor of the videos is that the kid answers absolutely incorrectly. But in a weird way, your team's app is your "child". We are trying to do our best to prepare it for the "real world". I'm not a fan of that style of parenting that says something like "the best way to teach your child to swim is by pushing them into the deep end of the pool". You start in the shallow end, and maybe even practice some strokes on dry land first. Gradually you work them up to the point where they are confident (and so are you) that they can swim. It's like that with testing.
:::

## System Integration Tests

Your code has made it this far, and you have graduated to the deep end of the pool. Our ultimate goal is that our code will gracefully and joyfully swim in the open seas (production), but we want to make sure we are prepared. 

This is where we test in an environment that is designed to replicate the ocean (er, production) as much as possible. All the players will be there (identity servers, backing services, databases, etc.). 

This kind of testing is *role playing*. Every "player" has a script, and we are making sure we all know our lines. 

These will always be a *subset* of the tests we do in our System Tests because it is *really* hard (read: expensive), if not *impossible* to replicate the chaos of the open sea (production). Basically, we start with, and assume, the "happy path". These kinds of tests are mostly to verify the production worthiness of our code. 

They are proving something like:

- *If* the configuration of my application is correct (I'm pointing at the right backing services, etc.), and,
- *If* all the backing services (everything but my app) is configured properly and according to the contracts I wrote my code against

*Then* we are ready to rock.

::: warning Of *course* there are other types of testing.
There are often things like performance testing, compliance testing, etc. Those all require sophisticated environments to be created, maintained, etc. and require specific skill sets and knowledge. This is both beyond the scope of this course and beyond the skill set of your instructor. That's what professional "software testers" are for. We actually need *more of this stuff*, and by "shifting left" and having developers do more of the kind of testing we are talking about here, we can free up our software testers to provide real value instead of just finding our typos and dumb coding mistakes.
:::

