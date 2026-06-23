# Running Quizly on Mac

This guide explains the easiest way to run the full Quizly stack (Frontend, Backend, Database, and Observability tools) on a Mac (Intel or Apple Silicon/M-series).

## Prerequisites
1. **Docker Desktop**: Must be installed and running.
2. **Node.js**: Installed (v18+ recommended) to run the frontend.
3. **.env File**: Ensure you have created `.env` inside the `backend` folder with your Azure OpenAI keys:
   ```properties
   AZURE_OPENAI_API_KEY=your_key_here
   AZURE_OPENAI_ENDPOINT=https://hack-apim-cin.azure-api.net/openai
   AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4.1-mini
   AZURE_OPENAI_EMBEDDING_DEPLOYMENT_NAME=text-embedding-ada-002
   ```

## 1. Start the Backend & Infrastructure (Docker)
We use Docker to run the PostgreSQL database (with `pgvector`), the Java Spring Boot Backend, and the entire monitoring stack (Prometheus, Grafana, Tempo, OpenTelemetry).

1. Open your terminal in the **root** `Quizly` directory.
2. Run the following command:
   ```bash
   docker-compose up -d --build
   ```
3. Docker will pull the necessary images (including an M-series compatible Java image) and start the containers in the background.

You can verify everything is running by typing `docker ps`. You should see containers for `quizly-backend`, `quizly-db`, `grafana`, `tempo`, `prometheus`, and `otel-collector`.

## 2. Start the Frontend (Local Node)
The React frontend is run locally and proxies requests to the Dockerized backend.

1. Open a **new** terminal window.
2. Navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```
3. Install dependencies (if you haven't already):
   ```bash
   npm install
   ```
4. Start the Vite server:
   ```bash
   npm run dev
   ```

## 3. Accessing the Application
- **Main Web App**: [http://localhost:5173](http://localhost:5173)
- **Grafana Dashboards (Monitoring & Traces)**: [http://localhost:3000](http://localhost:3000) (No login required)
- **Spring Boot Backend API**: [http://localhost:8081](http://localhost:8081)

## Troubleshooting on Mac
- **Port 5432 or 8081 already in use**: If you get a "port is already allocated" error, you might have a local Postgres or Java process running. You can find and kill it using:
  ```bash
  lsof -t -i:8081 | xargs kill -9
  ```
- **Bad Gateway (502)**: If Vite shows a 502 Bad Gateway when calling the API, it means the `quizly-backend` Docker container hasn't fully started yet, or it crashed. Check its logs with:
  ```bash
  docker logs quizly-backend
  ```
