# Backend Setup & Commands

Here are the commands to build and run the Spring Boot backend using Maven. Make sure you are in the `backend` directory when running these.

## 1. Make Maven Wrapper Executable
If you haven't already, you need to ensure the Maven wrapper script has execution permissions:
```bash
chmod +x mvnw
```

## 2. Clean and Build the Project
To compile the code, run tests, and build the application package:
```bash
./mvnw clean package
```
*(Skip tests during build by adding `-DskipTests`: `./mvnw clean package -DskipTests`)*

## 3. Run the Application (Development)
To start the Spring Boot application locally:
```bash
./mvnw spring-boot:run
```

## 4. Run the Application (Production/JAR)
Once you've built the package (step 2), you can run the compiled `.jar` file directly:
```bash
java -jar target/backend-0.0.1-SNAPSHOT.jar
```

## 5. PostgreSQL & Nginx Services (macOS)

### Start Services
```bash
# Start PostgreSQL
brew services start postgresql

# Start Nginx
brew services start nginx
```

### Restart Services
```bash
# Restart PostgreSQL
brew services restart postgresql

# Restart Nginx
brew services restart nginx
```

### Stop Services
```bash
# Stop PostgreSQL
brew services stop postgresql

# Stop Nginx
brew services stop nginx
```

### Initialize Database & User (If "role postgres does not exist" error occurs)
If you get a `FATAL: role "postgres" does not exist` error on macOS, run these commands to initialize the user and database:
```bash
# Create the postgres superuser role
psql -d postgres -c "CREATE ROLE postgres WITH SUPERUSER LOGIN PASSWORD 'password';"

# Create the quizly database
psql -d postgres -c "CREATE DATABASE quizly;"
```

## Dependencies
- **Java**: Java 17 or 21 is required (Java 8 is NOT supported for Spring Boot 3+).
- **Database**: Ensure PostgreSQL is running on `localhost:5432` with a database named `quizly`, user `postgres`, and password `password`.


## 6. Accessing & Querying the Database (psql)

To inspect database tables and data directly:
```bash
psql -U postgres -d quizly
```

Once inside the interactive `psql` console, run:
1. **List all tables**:
   ```sql
   \dt
   ```
   *(You should see the tables created automatically by the Spring Boot application)*

2. **Inspect a table schema** (e.g., `users`):
   ```sql
   \d users
   ```

3. **Query table data**:
   ```sql
   SELECT * FROM users;
   ```

## 7. Troubleshooting

### Port Conflicts
If you receive port-in-use errors when trying to run the services:

- **Kill Spring Boot Backend (Port 8081)**:
  ```bash
  lsof -ti:8081 | xargs kill -9
  ```
- **Kill Nginx (Port 8080)**:
  ```bash
  lsof -ti:8080 | xargs kill -9
  ```

### Nginx Troubleshooting
- **Check Configuration Syntax**:
  ```bash
  nginx -t
  ```
- **Reload Nginx Configuration**:
  ```bash
  nginx -s reload
  ```
- **View Nginx Logs**:
  ```bash
  # View error log (useful for 502/504 gateway errors)
  tail -n 50 -f /opt/homebrew/var/log/nginx/error.log

  # View access log
  tail -n 50 -f /opt/homebrew/var/log/nginx/access.log
  ```
  *(Note: If Nginx was installed on an Intel-based Mac, paths will be `/usr/local/var/log/nginx/` instead of `/opt/homebrew/`)*

## 8. Connecting Deployed Frontend to Local Backend (ngrok)

If you are accessing the frontend via the deployed URL (`https://qwizly.javascript-dev.com/`), API requests are configured in Vercel to route through a public ngrok tunnel (`https://fiber-subwoofer-dwarf.ngrok-free.dev`).

### One-liner to Start Backend & Tunnel
Run this command from the `backend` directory to run Spring Boot in the background and start the ngrok tunnel on port `8081` in one go:
```bash
./mvnw spring-boot:run & ngrok http --domain=fiber-subwoofer-dwarf.ngrok-free.dev 8081
```

### How to Stop Them
1. **Stop the ngrok tunnel**: Press `Ctrl + C` in the active terminal window.
2. **Stop the background Spring Boot backend**: Since it runs in the background, stop it by running:
   ```bash
   lsof -ti:8081 | xargs kill -9
   ```

### How the Request Flow Works
1. **Browser** sends a request to the deployed site (`https://qwizly.javascript-dev.com/api/auth/register`).
2. **Vercel** catches the `/api/*` prefix (based on `vercel.json` rules) and rewrites it to `https://fiber-subwoofer-dwarf.ngrok-free.dev/api/*`.
3. **ngrok Server** forwards the request through the open tunnel to your local machine.
4. **Local Ngrok Agent** routes the incoming request to your Spring Boot app running locally on `localhost:8081`.