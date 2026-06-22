# Hackathon AI Gateway Team Integration Guide

# Java/Spring AI Hackathon 2026 May 2026

## Gateway Details

**Gateway URL**:

<https://hack-apim-cin.azure-api.net/openai>

**API Version**:

2024-12-01-preview

**Auth header**:

api-key:

**Your team key**:

Provided separately by admin via Teams DM

## Available Models (3 operations)

| Operation

Deployment Name

| Use case

Chat (primary)

gpt-4.1-mini

Fast, efficient chat

Chat (advanced) |

gpt-40

High-quality reasoning

| Embeddings

| text-embedding-ada-002 |

RAG, vector search

## Spring AI Configuration (application.yml)

yaml

spring:

ai:

azure:

openai:

endpoint: <https://hack-apim-cin.azure-api.net/openai>

api-key:

<fill team api key here>

chat:

options:

deployment-name: gpt-4.1-mini

max-tokens: 800

embedding:

options:

deployment-name: text-embedding-ada-002

I

## Java OpenAI SDK Configuration

java

OpenAIClient client = new OpenAIClientBuilder()

.endpoint("<https://hack-apim-cin.azure-api.net/openai>")

.credential(new AzureKeyCredential(System.getenv("TEAM_API_KEY")))

.buildClient();

// Use deploymentOrModelName = "gpt-4.1-mini" or "gpt-40" in requests

// Use deploymentOrModelName = "text-embedding-ada-002" for embeddings

## Rate Limits and Quotas (per team key) **Daily token cap**: 50,000 tokens /day

**Rate limit**:

30 API calls/minute

**Max body size**: 32 KB per request

**HTTP 429 response**: Quota or rate limit exceeded implement exponential backoff

## Handling HTTP 429 (Backoff Example - Java)

java

int attempt = 0, maxRetries = 4;

while (attempt < maxRetries) {

try {

return client.getChatCompletions (deployment, options);

} catch (HttpResponseException e) {

if (e.getResponse().getStatusCode() == 429) {

long wait (long) Math.pow(2, attempt) * 1000; // 1s, 25, 4s, 8s

Thread.sleep(wait);

attempt++;

} else throw e;

}## Acceptable-Use Rules (MANDATORY Accenture Policy)

**DO NOT** include client names, project names, or client data in any prompt

**DO NOT** include Accenture confidential or restricted information in prompts

**DO NOT** include personal data (email, phone, PAN, Aadhaar, credit card) in prompts

**DO** use realistic but fictional data in your demos and tests

**DO** implement error handling for 429, 401, and 500 responses

Gateway-level PII scrubber is active but is a compensating control, not a substitute for your own data hygiene

## Troubleshooting

| Error

| Likely cause |

Fix |

401 | Missing or wrong api-key header | Check header name is exactly 'api-key' (lowercase) |

| 404 413 Request body over 32 KB | Truncate prompt or split into chunks |

| Wrong deployment name or route | Use only the three deployment names listed above |

429 Rate or quota limit hit | Implement exponential backoff (see above) |

502 Backend transient error | Retry with backoff; report to admin if persistent |

Spring startup 404 | text-embedding-ada-002 not in embedding config | Confirm deployment-name in application.yml |

| Spring startup 401 | api-key header name mismatch | Confirm subscription key header = 'api-key' in APIM |

## Support

Post issues to hackathon mentor or in channel in Teams

Include: team name, request URL, HTTP status code received (no prompts or keys in public chat)

Monitoring dashboard is active; admin can see your team's usage in real time

En 53, Col 51 3,729 characters

Markdown syntax

Breaking news

Keir Starmer quit...

Q Search

Unix (LF)
