--- 
title: Test Container PostGres
--- 

The steps for creating a "seeded" test container for PostGres

This is based on: https://nickjanetakis.com/blog/docker-tip-79-saving-a-postgres-database-in-a-docker-image

For testing purposes, you may want one or more "staged" containers with your data in various configurations.
For example, you might want an empty container with just your database and schema created, and another with some sample data.

Your tests can start with a clean-slate version of these things and dispose of them when you are done.

## Step 1 - Create a "base" Dockerfile

```dockerfile
FROM postgres:16.2-bullseye

COPY data.sql /docker-entrypoint-initdb.d/data.sql

ENV POSTGRES_PASSWORD=password
ENV POSTGRES_USER=user
ENV PGDATA=/data
```

In the `data.sql` file put any SQL scripts you want Postgres to run on first run. 
## Step 2 - Build the Image

```sh
docker build -t app-data:raw .
```

## Step 3 - Start and Run the Container

```sh
docker run -d -p 5432:5432 app-data:raw
```

## Step 4 - Attach a shell and delete the init data.
In the container:

```sh
rm /docker-entrypoint-initdb.d/data.sql
```

## Step 5 - Commit The Image

Exit the shell in the container, find the name given to your running instance, and do the following:

```sh
docker commit amazing_jones app-data:schema
```

## Step 6 - Remove your container and start the new one

## Step 7 - Repeat as necessary

## Step 8 - Profit


