# Windows Backend Setup Guide

This guide explains how to set up, build, and run the Quizly Spring Boot backend on Windows.

---

## Prerequisites

Before running the backend, make sure you have the following installed and configured on your Windows machine:

### 1. Java Development Kit (JDK 21)
The backend requires **JDK 21** (or at least JDK 17).
1. Download **Eclipse Temurin JDK 21** (or Microsoft Build of OpenJDK 21) Windows installer (`.msi` or `.exe`) from [Adoptium](https://adoptium.net/).
2. Run the installer and ensure you check the options to:
   - **Set JAVA_HOME variable**
   - **Associate .jar files**
   - **Add to PATH**
3. Open a **new** Command Prompt or PowerShell window and verify the installation:
   ```cmd
   java -version
   ```
   You should see output indicating Java version `21.x.x`.

### 2. PostgreSQL Database
The backend connects to a PostgreSQL database on port `5432`.
1. Download the PostgreSQL Windows Installer from [EnterpriseDB](https://www.enterprisedb.com/downloads/postgres-postgresql-downloads) (Version 15 or 16 recommended).
2. During the installation wizard:
   - Choose a password for the default `postgres` superuser. Set it to **`password`** (to match the project's default configuration in `application.properties`).
   - Leave the port as **`5432`**.
   - The installer will automatically register PostgreSQL as a Windows Service that starts automatically.

### 3. IDE Setup (VS Code Workspace)
If you use **Visual Studio Code (VS Code)** for development:
1. Open VS Code.
2. Select **File** -> **Open Workspace from File...**
3. Select the `Quizly.code-workspace` file located in the root of the project directory.
This will open the project folders and apply pre-configured Java compiler settings automatically (like enabling automatic build configuration updates and disabling strict null analysis warnings).

---

## Database Setup

The backend expects a database named `quizly` to exist. You can create it in one of two ways:

### Option A: Using pgAdmin 4 (GUI)
1. Search for and open **pgAdmin 4** from your Windows Start Menu.
2. In the left sidebar, double-click **Servers** and enter your `postgres` password (`password`) to connect.
3. Right-click **Databases** -> **Create** -> **Database...**
4. Set the Database name to **`quizly`**.
5. Click **Save**.

### Option B: Using psql (Command Line)
1. Search for **SQL Shell (psql)** in your Start Menu and open it, or open a standard Command Prompt (`cmd.exe`).
2. Run the following command (adjust path to your postgres installation if necessary):
   ```cmd
   psql -U postgres
   ```
3. Enter your password (`password`) when prompted.
4. Run the SQL query to create the database:
   ```sql
   CREATE DATABASE quizly;
   ```
5. Exit the shell by typing `\q` and pressing Enter.

---

## Environment Setup (OpenAI API Key)

The application uses Spring AI and expects an `OPENAI_API_KEY` variable. You can configure this as follows:

### Option A: Set as a Windows System/User Environment Variable (Permanent)
1. Press the **Windows Key** and search for **"Edit the system environment variables"**.
2. Click the **Environment Variables...** button.
3. Under **User variables for [YourUsername]**, click **New...**.
4. Set **Variable name** to `OPENAI_API_KEY`.
5. Set **Variable value** to your OpenAI API key (e.g., `sk-...`).
6. Click **OK** on all windows to save.
7. *Note: You must restart any open terminal windows for the new variable to take effect.*

### Option B: Set in your active terminal session (Temporary)
- **Command Prompt (CMD)**:
  ```cmd
  set OPENAI_API_KEY=your-api-key-here
  ```
- **PowerShell**:
  ```powershell
  $env:OPENAI_API_KEY="your-api-key-here"
  ```
- **Git Bash**:
  ```bash
  export OPENAI_API_KEY="your-api-key-here"
  ```

---

## Running the Application

Open your terminal of choice (Command Prompt, PowerShell, or Git Bash), and navigate to the `backend` folder:
```cmd
cd backend
```

Depending on the terminal you are using, run the following commands:

### Using Command Prompt (CMD)
* **Build/Package (Skipping Tests):**
  ```cmd
  mvnw.cmd clean package -DskipTests
  ```
* **Run in Development Mode:**
  ```cmd
  mvnw.cmd spring-boot:run
  ```

### Using PowerShell
* **Build/Package (Skipping Tests):**
  ```powershell
  .\mvnw.cmd clean package -DskipTests
  ```
* **Run in Development Mode:**
  ```powershell
  .\mvnw.cmd spring-boot:run
  ```

### Using Git Bash
* **Build/Package (Skipping Tests):**
  ```bash
  ./mvnw clean package -DskipTests
  ```
* **Run in Development Mode:**
  ```bash
  ./mvnw spring-boot:run
  ```

### Running the JAR File (Production Mode)
Once built, you can run the compiled executable JAR directly:
```cmd
java -jar target\backend-0.0.1-SNAPSHOT.jar
```

---

## Running the Application with Docker (Alternative)

If you have **Docker Desktop** installed on Windows, you can start both PostgreSQL and the Spring Boot backend using a single command from the project root directory.

This method does **not** require you to install Java or PostgreSQL locally, as they run inside isolated containers.

### Steps to Run with Docker:

1. **Start Docker Desktop** on Windows.
2. Open a terminal (CMD, PowerShell, or Git Bash) in the **project root directory** (where `docker-compose.yml` is located).
3. Set your `OPENAI_API_KEY` (if using it) in the terminal session (refer to the Environment Setup section above).
4. Run Docker Compose:
   ```cmd
   docker compose up --build
   ```
5. The container setup will:
   - Start the PostgreSQL database container (`quizly-db`).
   - Run health checks to make sure the database is ready.
   - Build the backend image, launch the backend container (`quizly-backend`), and connect it automatically to the database container.
6. To stop the containers, press `Ctrl + C` or run:
   ```cmd
   docker compose down
   ```

---

## Troubleshooting Common Windows Issues

### 1. `'mvnw.cmd'` is not recognized as an internal or external command
* Make sure you are in the `/backend` subdirectory of the project, not the root workspace directory. Check your directory by running `dir`.

### 2. `UnsupportedClassVersionError` (Java Version Error)
* The project requires Java 21/17. If you get a class version mismatch, verify your active Java version by running `java -version`.
* Ensure your `JAVA_HOME` environment variable points to your JDK 21 installation directory, and `%JAVA_HOME%\bin` is listed first in your `Path` variable.

### 3. Database connection fails (`Connection refused` or `Authentication failed`)
* Verify that the PostgreSQL service is running:
  1. Press `Win + R`, type `services.msc`, and press Enter.
  2. Scroll down to find the **postgresql-x64-xx** service.
  3. Ensure its status is **Running**. If not, right-click it and click **Start**.
* Verify that your username is `postgres` and password is `password`. If you chose a different password during Postgres installation, you must update the `spring.datasource.password` field in `src/main/resources/application.properties`.

### 4. Port `8081` is already in use
If another application (or a previously hung Java process) is using port `8081`, you can kill it:
* **In Command Prompt (run as Administrator):**
  ```cmd
  netstat -ano | findstr :8081
  ```
  Look at the number at the end of the output line (the Process ID or PID), then run:
  ```cmd
  taskkill /PID <PID> /F
  ```
* **In PowerShell:**
  ```powershell
  Stop-Process -Id (Get-NetTCPConnection -LocalPort 8081).OwningProcess -Force
  ```
