# Architecture & Scaling

## Current
- **Monolith**: Express + SQLite + Groq LLM
- **Frontend**: Static React CDN
- **Data**: SQLite (entries table w/ analysis)

## Scale to 100k users
- **DB**: PostgreSQL (sharding by userId hash, read replicas)
- **Backend**: PM2 cluster / Docker swarm / K8s → multiple Express instances load-balanced
- **Queue**: BullMQ/Redis for LLM calls (async analysis)
- **Cache**: Redis for insights/entries (invalidate on write)

## Reduce LLM cost
- **Batch**: Queue multiple analyses, batch API calls
- **Cache**: Redis TTL 24h on text→analysis hash
- **Models**: Smaller/local (Ollama Llama3 8B self-hosted)
- **Sampling**: Only analyze if text >50 words or keywords trigger
- **Fallback**: Heuristic emotion (NLP lite w/ compromise.js)

## Cache repeated analysis
- **Redis**: `analysis:${hash(text)}` → JSON result, TTL=1d
- **Invalidate**: On entry update/delete (pub/sub)
- **Fallback**: Real-time compute if miss

## Protect sensitive data
- **Encryption**: Journal text encrypted at rest (SQLite SEE or PG pgcrypto)
- **Auth**: JWT (userId auth, rate limit)
- **Access**: Row-level security (userId filter), HTTPS only
- **GDPR**: Delete API, anonymize insights, EU hosting
- **Audit**: Log access, PII scan
