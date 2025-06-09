# Beyond Foundry API Reference

## Status: In Progress

This document provides an overview of the Beyond Foundry API, endpoints, and usage patterns.

### Main Endpoints
- `/import/character` - Import a character by DDB ID
- `/import/spell` - Import a spell by DDB ID
- `/import/item` - Import an item by DDB ID
- `/import/monster` - Import a monster by DDB ID
- `/import/bulk` - Bulk import endpoint

### Usage Examples
- See [FOUNDRY_TESTING.md](FOUNDRY_TESTING.md) for integration tests
- Use diagnostic scripts in `scripts/` for endpoint validation

### TODO
- Add full endpoint parameter and response documentation
- Document error codes and troubleshooting
- Add authentication/authorization details

---

## Example: Character Import Endpoint

**POST** `/import/character`

**Request Body:**
```json
{
  "ddbId": "123456",
  "options": { "importSpells": true }
}
```

**Response:**
```json
{
  "success": true,
  "actorId": "abc123",
  "warnings": []
}
```

---

## Error Codes
- `401 Unauthorized`: Invalid or missing authentication
- `404 Not Found`: DDB ID not found or not owned
- `422 Unprocessable Entity`: Invalid data or schema mismatch
- `500 Internal Server Error`: Unexpected error, see logs

---
