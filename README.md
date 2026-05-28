# Quizly

Quizly is a modern, full-stack application built with React (Vite) on the frontend and Spring Boot (Java) on the backend.

## Prerequisites

Before you begin, ensure you have the following installed on your machine:
- **Node.js** (v18 or higher recommended)
- **Java Development Kit (JDK)** (v17 or higher)
- **PostgreSQL** database running locally on port `5432`

---

## 1. Database Setup

The backend expects a PostgreSQL database named `quizly` to exist. 

1. Open your PostgreSQL console (psql) or your preferred database GUI (like pgAdmin or DBeaver).
2. Create the database:
   ```sql
   CREATE DATABASE quizly;
   ```

> **Note:** By default, the backend connects using the username `postgres` and password `password`. If your local Postgres credentials are different, update them in `backend/src/main/resources/application.properties`.

---

## 2. Backend Setup (Spring Boot)

The Java backend runs on port **8081** and handles the API and database connections.

1. Open a terminal and navigate to the backend directory:
   ```bash
   cd backend
   ```
2. *(Mac/Linux only)* Make sure the Maven wrapper is executable:
   ```bash
   chmod +x mvnw
   ```
3. Run the Spring Boot application:
   ```bash
   ./mvnw spring-boot:run
   ```
   *(On Windows, use `mvnw.cmd spring-boot:run`)*

> **Database Note:** When the backend starts up, Hibernate will automatically create all the necessary database tables for you. A `DataSeeder` will also automatically inject default test users (like `sme_user` and `admin_user`) if the tables are empty.

---

## 3. Frontend Setup (React/Vite)

The React frontend runs on port **5173** and uses a proxy to securely route API requests to the Java backend.

1. Open a **new** terminal window and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install the required Node dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```

---

## 4. Usage

Once both the backend and frontend servers are running:
1. Open your web browser and navigate to [http://localhost:5173](http://localhost:5173).
2. You can log in using the seeded test accounts to explore the application!
