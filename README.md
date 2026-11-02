# Dockerized E-Commerce Web Application (React + Spring Boot + MySQL)

A complete, production-grade e-commerce application built with **React** for the frontend, **Java Spring Boot 3** for the REST API, and **MySQL 8.4** for persistent database storage, fully orchestrated via **Docker Compose** with network segmentation.

---

## Architecture Overview

```
                      +---------------------------------------+
                      |               Host System             |
                      +---------------------------------------+
                                          |
                                   Port 80 (HTTP)
                                          |
+-----------------------------------------v-----------------------------------------+
| [proxy-net] (Bridge Network)                                                      |
|                                                                                   |
|  +-----------------------------+          +------------------------------------+  |
|  |     ecommerce-frontend      |  /api/*  |         ecommerce-backend          |  |
|  |   (Nginx + React Build)     +--------->+       (Spring Boot REST API)       |  |
|  |     Listens on Port 80      |          |         Listens on Port 8080       |  |
|  +-----------------------------+          +-----------------+------------------+  |
|                                                             |                     |
+-------------------------------------------------------------|---------------------+
                                                              |
+-------------------------------------------------------------|---------------------+
| [db-net] (Isolated Bridge Network)                          |                     |
|                                                             |                     |
|                                           +-----------------v------------------+  |
|                                           |            ecommerce-db            |  |
|                                           |            (MySQL 8.4)             |  |
|                                           |        Listens on Port 3306        |  |
|                                           +-----------------+------------------+  |
|                                                             |                     |
|                                                [mysql_data Named Volume]          |
+-----------------------------------------------------------------------------------+
```

---

## Network Security & Port Isolation

| Container Service | Internal Container Port | Published Host Port | Network Membership | Security Purpose |
| :--- | :--- | :--- | :--- | :--- |
| **`frontend`** (Nginx / React) | `80` | **`80:80`** | `proxy-net` | **Only public ingress point**. Serves production React bundle and reverse-proxies `/api/` traffic to the backend. |
| **`backend`** (Spring Boot API) | `8080` | **None** *(Private)* | `proxy-net`, `db-net` | Accessible **only** within Docker networks. No direct access from external host. |
| **`db`** (MySQL 8.4 Database) | `3306` | **None** *(Private)* | `db-net` | Accessible **only** by the Spring Boot backend inside `db-net`. Completely isolated from frontend and host. |

> **Security Guarantee**:
> - Neither port `8080` nor port `3306` are published on the host.
> - The database cannot be reached directly by the frontend or external attackers.
> - All API communication happens through relative URLs (e.g. `/api/products`) forwarded securely by Nginx.

---

## Project Structure

```
ecommerce/
├── compose.yaml              # Docker Compose configuration with multi-stage builds & health checks
├── .env.example              # Template for database credentials
├── .env                      # Local environment configuration (git ignored)
├── .gitignore                # Git ignore rules for secrets, builds, and dependencies
├── README.md                 # Complete documentation and operational guide
├── db/
│   └── init.sql              # MySQL schema initialization script
├── backend/
│   ├── Dockerfile            # Multi-stage Docker build (Maven Builder -> JRE Runtime)
│   ├── pom.xml               # Spring Boot 3 Maven dependencies
│   └── src/
│       └── main/
│           ├── java/com/ecommerce/
│           │   ├── EcommerceApplication.java
│           │   ├── config/   # CORS, GlobalExceptionHandler, DataInitializer
│           │   ├── controller/ # ProductController, CartController, OrderController, HealthController
│           │   ├── dto/      # Request and response DTOs
│           │   ├── model/    # Product, CartItem, Order, OrderItem JPA entities
│           │   ├── repository/# ProductRepository, CartItemRepository, OrderRepository
│           │   └── service/   # ProductService, CartService, OrderService
│           └── resources/
│               └── application.properties # Spring Boot datasource & JPA settings
└── frontend/
    ├── Dockerfile            # Multi-stage Docker build (Node.js Builder -> Nginx Alpine)
    ├── nginx.conf            # Nginx reverse proxy routing /api/ to backend & serving SPA
    ├── package.json          # React dependencies and scripts
    ├── public/
    │   └── index.html        # HTML shell
    └── src/
        ├── api.js            # Relative URL API client with session management
        ├── App.js            # Main responsive e-commerce application
        ├── App.css           # Styling, animations, responsive design
        ├── index.js          # React DOM entry point
        └── index.css         # Global typography & design variables
```

---

## Operational Commands

### 1. Start the Application
To build container images and start all services in detached mode:
```bash
docker compose up --build -d
```

### 2. Verify Published Ports
Ensure **ONLY** port 80 is published on the host:
```bash
docker compose ps
```
*Expected Output:*
```
NAME                 IMAGE                     COMMAND                  SERVICE    CREATED          STATUS                    PORTS
ecommerce-db         mysql:8.4                 "docker-entrypoint.s…"   db         10 seconds ago   Up 10 seconds (healthy)   3306/tcp
ecommerce-backend    ecommerce-backend:latest  "java -Djava.securit…"   backend    5 seconds ago    Up 5 seconds              8080/tcp
ecommerce-frontend   ecommerce-frontend:latest "/docker-entrypoint.…"   frontend   2 seconds ago    Up 2 seconds              0.0.0.0:80->80/tcp, :::80->80/tcp
```
Notice that:
- `ecommerce-frontend` publishes `0.0.0.0:80->80/tcp`
- `ecommerce-backend` exposes `8080/tcp` internally only (no host mapping `->`)
- `ecommerce-db` exposes `3306/tcp` internally only (no host mapping `->`)

### 3. Check Real-Time Logs
To monitor logs across all containers:
```bash
docker compose logs -f
```

To view logs for an individual service:
```bash
# Backend Spring Boot logs
docker compose logs -f backend

# MySQL database logs
docker compose logs -f db

# Frontend Nginx logs
docker compose logs -f frontend
```

### 4. Rebuild an Individual Service
If you make code changes to either the frontend or backend:
```bash
# Rebuild frontend only
docker compose up --build -d --no-deps frontend

# Rebuild backend only
docker compose up --build -d --no-deps backend
```

### 5. Stop the Application
Stop containers without deleting persisted database data:
```bash
docker compose down
```

Stop containers and remove the MySQL volume (fresh database on next startup):
```bash
docker compose down -v
```

---

## Troubleshooting Guide

| Issue | Cause | Solution |
| :--- | :--- | :--- |
| **Port 80 is already in use** | IIS, Apache, or another service occupies port 80 on host | Stop conflicting service (`net stop w3svc` on Windows, or `sudo systemctl stop apache2/nginx` on Linux). |
| **Backend waits for DB** | MySQL 8.4 is initializing data directory | The compose file specifies `condition: service_healthy`. The backend waits automatically until `mysqladmin ping` succeeds. |
| **Database data wiped after restart** | Container was removed without named volume | Volume `mysql_data` is configured as a persistent Docker named volume. Do not pass `-v` when executing `docker compose down`. |
| **API request 502 Bad Gateway** | Spring Boot backend still starting JVM | Wait 10-15 seconds for JVM boot. Check backend status with `docker compose logs backend`. |

---

## REST API Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/products` | Retrieve all products (supports `?category=Audio`, `?search=Sony`, `?featured=true`) |
| `GET` | `/api/products/{id}` | Retrieve product details by ID |
| `GET` | `/api/products/categories` | Retrieve list of all unique product categories |
| `GET` | `/api/cart` | Get current session shopping cart summary and items |
| `POST` | `/api/cart/items` | Add product to cart (`{"productId": 1, "quantity": 1}`) |
| `PUT` | `/api/cart/items/{id}` | Update quantity of cart item (`{"quantity": 3}`) |
| `DELETE`| `/api/cart/items/{id}` | Remove item from cart |
| `DELETE`| `/api/cart` | Clear entire cart for session |
| `POST` | `/api/orders` | Checkout cart and create new order |
| `GET` | `/api/orders/{id}` | Retrieve order details by order ID |
| `GET` | `/api/orders/number/{number}` | Retrieve order details by order number (e.g. `ORD-8291A7B2`) |
| `GET` | `/api/health` | Service health status and MySQL database connectivity check |
#   e c o m m e r c e _ a v a i l a b l e  
 #   e c o m m e r c e _ a v a i l a b l e  
 #   e c o m m e r c e _ a v a i l a b l e  
 