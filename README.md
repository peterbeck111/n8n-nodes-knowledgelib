# n8n-nodes-knowledgelib

n8n community node for [knowledgelib.io](https://knowledgelib.io) — query pre-verified, cited knowledge units for AI agents.

## What is knowledgelib.io?

An AI Knowledge Library with structured, cited knowledge units optimized for AI agent consumption. Each unit answers one canonical question with full source provenance, confidence scoring, and freshness tracking. Pre-verified answers that save tokens, reduce hallucinations, and cite every source.

## Installation

### Community Nodes (recommended)

1. Go to **Settings > Community Nodes** in your n8n instance
2. Select **Install a community node**
3. Enter `n8n-nodes-knowledgelib`
4. Agree to the risks and click **Install**

### Manual Installation

```bash
npm install n8n-nodes-knowledgelib
```

## Operations

| Operation | Description |
|-----------|-------------|
| **Query Knowledge** | Semantic search across all knowledge units. Returns results ranked by relevance with confidence scores, source counts, and freshness metadata. |
| **Get Unit** | Retrieve a specific knowledge unit by ID in markdown or JSON format. |
| **List Domains** | List all available knowledge domains with unit counts. |

## Credentials

**Optional.** The knowledgelib.io API is completely free and requires no API key. Credentials are only needed if you want to:

- Override the API URL (for self-hosted instances)
- Provide an API key (for future authenticated access)

## Example Workflow

1. **Trigger** (e.g., webhook, schedule, chat message)
2. **Knowledgelib** node with "Query Knowledge" operation
3. **Process results** (filter by confidence, route by domain, etc.)
4. **Output** (respond to chat, update database, send notification)

## Query Example

- **Operation**: Query Knowledge
- **Query**: `best wireless earbuds under 150`
- **Limit**: 3
- **Domain**: `consumer_electronics`

Returns:
```json
{
  "query": "best wireless earbuds under 150",
  "results": [
    {
      "id": "consumer-electronics/audio/wireless-earbuds-under-150/2026",
      "canonical_question": "What are the best wireless earbuds under $150 in 2026?",
      "confidence": 0.88,
      "last_verified": "2026-02-07",
      "source_count": 8,
      "freshness": "high",
      "url": "https://knowledgelib.io/consumer-electronics/audio/wireless-earbuds-under-150/2026"
    }
  ],
  "total_results": 1
}
```

## Links

- [knowledgelib.io](https://knowledgelib.io)
- [API Documentation](https://knowledgelib.io/api)
- [OpenAPI Spec](https://knowledgelib.io/api/v1/openapi.json)
- [License: MIT](./LICENSE)

## License

MIT
