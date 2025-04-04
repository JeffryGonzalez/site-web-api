--- 
title: Common Docker Compose Files 
--- 

These are here for reference, as we use several of these in class.

## Postgres with Adminer

Create a directory called `db` in the same directory as this file with any database initialization scripts you want run when the container first is initialized.

```yaml
services:

  db:
    image: postgres:16.2-bullseye
    restart: always
    environment:
      POSTGRES_PASSWORD: password
      POSTGRES_USER: user
      POSTGRES_DB: db
    volumes:
      - db_data:/var/lib/postgresql/data
      - ./db/:/docker-entrypoint-initdb.d/
    ports:
      - 5432:5432

  adminer:
    image: adminer
    restart: always
    ports:
      - 8080:8080
    environment:
      ADMINER_DESIGN: dracula
volumes:
  db_data:
```

## Kafka with KRaft

```yaml
services:
  kafka:
    image: "bitnami/kafka:latest"
    volumes:
      - kafka_data:/bitnami/kafka
    ports:
      - "9092:9092"
    environment:
      - KAFKA_ENABLE_KRAFT=yes
      - KAFKA_CFG_PROCESS_ROLES=broker,controller
      - KAFKA_CFG_CONTROLLER_LISTENER_NAMES=CONTROLLER
      - KAFKA_CFG_LISTENERS=PLAINTEXT://:9092,CONTROLLER://:9093
      - KAFKA_CFG_LISTENER_SECURITY_PROTOCOL_MAP=CONTROLLER:PLAINTEXT,PLAINTEXT:PLAINTEXT
      - KAFKA_CFG_ADVERTISED_LISTENERS=PLAINTEXT://127.0.0.1:9092
      - KAFKA_BROKER_ID=1
      - KAFKA_CFG_CONTROLLER_QUORUM_VOTERS=1@127.0.0.1:9093
      - ALLOW_PLAINTEXT_LISTENER=yes
      - KAKFA_CFG_AUTO_CREATE_TOPICS_ENABLE=true
      - KAFKA_CFG_NODE_ID=1
volumes:
  kafka_data:
```

## WireMock

```yaml
version: "3"
services:
  wiremock:
    image: "wiremock/wiremock:latest"
    container_name: my_wiremock
    ports:
      # - 8443:8443
      - 8080:8080
    volumes:
      - ./__files:/home/wiremock/__files
      - ./mappings:/home/wiremock/mappings
    entrypoint: ["/docker-entrypoint.sh",  "--disable-gzip", "--record-mappings", "--enable-stub-cors", "--verbose"]
```
