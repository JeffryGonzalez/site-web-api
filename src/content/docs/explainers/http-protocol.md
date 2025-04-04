---
title: HTTP as a Protocol
---



Deploying services that expose an HTTP Interface (See RFC 2616[^8]) benefit from the advantages (and disadvantages) of the protocol that is behind the WorldWide Web.

Advantages:

- "Reach"
    - HTTP is *ubiquitous*. Just about any programming language and environment is easily able to create HTTP Requests and process HTTP Responses.
    - HTTP is usually the way applications and services *outside* our domain access functionality within our domain. For example, Apps (Angular, iOS, Android, etc.), and partner APIs.
- "Known" (to API Developers)
    - HTTP is *prescriptive*. A good HTTP-based API follows *resource oriented architecture* and the *consistent interface constraint*. 
    - This means that as API designers, we take time to convert our business functionality into a set of resources, based on the common HTTP methods (GET,POST,PUT,DELETE), to allow clients to access our data, and cause state changes within our domain. 
    - HTTP implicitly provides strong *domain separation*. The implementation of HTTP APIs is *malleable* over time.
    - HTTP is *extensible*. New resources can be added as the API grows/evolves. New Media Types can be declared.
    - Bottom Line: HTTP already takes care of a large part of the design of your API. You learn HTTP's "way" of doing things, and adapt your domain to accommodate that. 
- "Known" (to Clients)
    - When a developer wants to access your functionality and it is exposed through a well-reasoned HTTP interface, they *already know* much of what they need to know to use your API. They know they use a `GET` request to retrieve information, etc. They need to learn your metaphors (resources), and look at the representations (the data) that the API returns or requires for operations, but the basic approach is the same for all HTTP based APIs.
- Relatively Easy to Secure
    - Transport Layer Security (TLS) is easily added to HTTP-based APIs as a cross-cutting concern.
    - Authentication and Authorization is fairly standardized with things like OAUTH2, OpenID Connect (OIDC), JSON Web Tokens (JWT), etc.
    - Because of its prolific nature, organization like OWASP provide guidance on threats and mitigation techniques.
- Supports Standards-Based Caching
    - HTTP Responses *should* contain a `Cache-Control` header that the client and/or intermediaries can use to decide to retain and reuse responses.

Disadvantages:

- "Speed"
    - HTTP is an *application layer* protocol that sits on top of TCP. It is basically text messages sent back and forth between the two parties (the Origin server, and the User-Agent client).
    - TCP requires a lot of overhead to establish a connection, and in HTTP, connections are short-lived.
        - HTTP 1.1 added the concept of "Keep-Alives" for multiple requests to the same origin server.
        - HTTP/2 (and 3) extend this so multiple requests can be sent to the same origin in parallel, and the responses can be received in parallel. This makes the "chatty API" anti-pattern almost entirely obsolete.
- "Request/Response"
    - This is the biggest limitation in HTTP. Calls to an HTTP API are processed *synchronously*. That means that a request is made, the server processes the request, and the response is sent to the client. 
    - Many operations in Microservices take longer than reasonable to make a client "block" for a response.
        - My rule of thumb is anything over 100ms in my dev environment is too long.
    - Various techniques have to be employed to facilitate long-running processes, including:
        - Client Polling
        - Switching over from an HTTP connection to a TCP connection (using technologies like Websockets).
- "Client/Server"
    - This means that the client (User-Agent in HTTP parlance) must always initiate communication with the server. Servers cannot send response messages to the client without the client first making a request.
    - The makes modern interactions like notifications difficult.
    - Notifications are also useful when client applications are using *mutable shared data*. 
        - Mutable Shared Data is when representations are sent to multiple clients and each client has the authority to change that data.
- "Lack of Strong Contracts"
    - While HTTP provides the *consistent interface* constraint, the actual resources (identified by URIs) are malleable (can change over time), and the data sent to the server as part of a request (Headers, route parameters, query string parameters, and representations sent on a `POST` or `PUT` request) as well as the data returned as part of the response is largely ad-hoc.
    - The HTTP Specification deals with this (especially for the representations) by requiring the `Content-Type` header on requests or responses to refer to a named format for how the data should be interpreted and validated. [^9]
    - Modern tooling allows the generation of an OpenAPI Specification in many Web API development tools.
        - This is a blessing because it saves developers time.
        - It is dangerous because the contract can change as a result of your code changes without notification, indicating that you may "break" clients, defeating the *independently deployable* guard-rail.
- "No Standard Versioning Scheme"
    - HTTP was designed, along with the REST architectural style, to negate the need for versioning. In the problem domain where it exists, namely the World Wide Web, it has succeeded. 
    - The commonly applied approach to versioning in HTTP is to create new resources, or create new authorities (servers).
    - HTTP, without REST, is often very brittle.
    - HTTP, with REST, is technically challenging to implement on both the client and the server.
