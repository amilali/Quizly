import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { Provider } from 'react-redux'
import { store } from './store'
import { initializeFaro, getWebInstrumentations } from '@grafana/faro-web-sdk'
import { TracingInstrumentation } from '@grafana/faro-web-tracing'
import { OtlpHttpTransport } from '@grafana/faro-transport-otlp-http'

// Initialize Grafana Faro for RUM and Web Tracing
initializeFaro({
  app: {
    name: 'quizly-frontend',
    version: '1.0.0',
    environment: 'development'
  },
  transports: [
    new OtlpHttpTransport({
      tracesURL: 'http://localhost:4318/v1/traces',
      logsURL: 'http://localhost:4318/v1/logs',
    }),
  ],
  instrumentations: [
    ...getWebInstrumentations(),
    new TracingInstrumentation(),
  ],
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </StrictMode>,
)
