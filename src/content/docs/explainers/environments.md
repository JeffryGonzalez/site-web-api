--- 
title: Environments 
--- 

# Environments

From the holy text of the [Twelve Factor App - Config](https://12factor.net/config):

> An app's config is everything that is likely to vary between deploys (staging, production, developer environments, etc).

Reading that, you can deduce that an *environment* is a place where the config changes.


## Development Environments

### Local Development Environment

We are always working on code on our own developer workstation or laptop. We will call this environment **Local Development**.
The more we can run on our local machines, the better our "developer experience", because the feedback loops are shorter. 
The introduction of technologies like containers, nix, etc. means that we can very closely replicate on our own machines the same
ambient environment our code will run when deployed to other environments.

:::note[Shop, er, Code Local]
One of the biggest frustrations we have in deploying software is the "I don't know what's wrong, it works on my machine!"
scenarios. Once again, the Twelve Factor App Guidance says this in [X. Dev/prod parity](https://12factor.net/dev-prod-parity)
:::

Our `config` for our local development environment will be mostly things like links to backing services, where the link will point to 
something on `localhost`. 


After the local development, it is *all downhill from there* as far as development environments go.

## Shared Environments

There is only one "environment" that really matters, and that is *production*. Any other environments your code runs in 
is a best-guess approximation of production. It takes a *ton* of work to try to keep the various environments in "sync" with 
one another. And it often fails. Treat all environments with some suspicion.

### Shared Development Environment

It used to be common practice for a team of developers to do their work using some shared development environment where an 
approximation of the "real" production environment exists. These are often things like databases, identity servers, and, if our 
services rely on services owned by and provided by other teams, **version** of those services are running there, too.

There are *some* situations where this is understandable. Perhaps there are *some* things we just can't run on our local machines,
for historical purposes (large shared databases with complex stored procedures, etc. come to mind).

:::caution
This is why the slogan "Microservices Don't Share Databases" exists.
It isn't a *rule* because there is nobody enforcing this. If we take the term "microservice" to mean "independently deployable",
you can't do that if you share a database with others.
:::


Teams building services that have a heavy reliance on remote procedure calls (RPCs) tend to *need* shared development environments,
because the demand to run *each* of those locally, and have them configured properly is too much *accidental complexity*.

:::caution 
This is why Microservices prefer on Asynchronous Messaging over RPCs
:::

Don't feel bad if you have to do this, but know that these are smells :nose:, and your team should prioritize making local 
development *and testing* the norm.

### Shared Test or Staging Environments

These are much more understandable, but still imperfect. The purpose is that if you have a bunch of independently deployable 
services, you need an environment where you can ensure a couple of things:

1. The configuration of the services.
    - Can they all find each other? Are they configured properly?
      - This can be problematic because even *this* configuration will change in the production environment, but can 
      catch issues early.
2. Did your new deployment break any *contracts* required by other services? 
    - For example, if your service exports an HTTP interface (RPC, see above!), will the consumers of your service still work?
    - Another example: If your service publishes messages to a broker for other services to process, are they still compatible?

Of course, the converse is true on the second point as well: Did any of the upstream or downstream services your code depends on 
reneg on a contract your service was relying upon?




