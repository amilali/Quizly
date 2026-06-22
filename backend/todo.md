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


psql -U postgres -d quizly


1. See a list of all your tables: Type this and hit enter:

postgresql
\dt
(You should see the users table that our Java app automatically created!)

2. See the exact schema (columns) of the users table: Type this and hit enter:

postgresql
\d users
(This will show you the columns like id, user_id, password, and role)

3. See the actual data (the users we seeded): Type this standard SQL command (don't forget the semicolon at the end!):

postgresql
SELECT * FROM users;



lsof -ti:8081 | xargs kill -9