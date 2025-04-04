--- 
title: To Configure Await?
--- 


.NET Core APIs do not have a `SynchronizationContext` by default so you don't need it. `ConfigureAwait(false)` is saying "I don't need this to be completed by the same context (thread)", but since that doesn't exist in .NET core, it is a noop.  

It **is** useful on tasks running in a UI - like a windows app. Because it has to continue on the UI thread.



