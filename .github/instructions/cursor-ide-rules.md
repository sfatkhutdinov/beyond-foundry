# Beyond Foundry - Cursor IDE Agent Rules

## 🎯 AGENT DIRECTIVES

### 1. File Operations
- ACTION: DO NOT create new files without explicit user permission
- VALIDATION: Check codebase for existing functionality before suggesting new files
- ERROR: If file creation is needed, request explicit user permission

### 2. Data Handling
- ACTION: NEVER use or create mock data
- VALIDATION: All data must come from D&D Beyond or FoundryVTT
- ERROR: If mock data is needed, request explicit user permission

### 3. Code Index Usage
- ACTION: ALWAYS use code-index-mcp with every command
- VALIDATION: Verify code-index-mcp is active before proceeding
- ERROR: If code-index-mcp is not available, request user to enable it

### 4. D&D Beyond Compliance
- ACTION: RESPECT D&D Beyond's Terms of Service
- VALIDATION: Only import content the user legally owns
- ERROR: If unsure about content ownership, request user confirmation

### 5. Rate Limiting
- ACTION: IMPLEMENT rate limiting for all API calls
- VALIDATION: Check for existing rate limiting before adding new calls
- ERROR: If rate limiting is missing, implement it before proceeding

## 🏗️ IMPLEMENTATION RULES

### 1. API Structure
```typescript
// REQUIRED: Follow this exact structure for BeyondFoundryAPI
export class BeyondFoundryAPI {
  // REQUIRED: Authentication
  async authenticate(cobaltToken?: string): Promise<AuthResponse>
  
  // REQUIRED: Content Import
  async importCharacter(characterId: string, options?: Partial<ImportOptions>): Promise<ImportResult>
  async importClass(classId: string, options?: Partial<ImportOptions>): Promise<Record<string, unknown> | null>
  
  // REQUIRED: Bulk Operations
  async bulkImportSpellsToCompendium(cobaltToken: string, compendiumName?: string): Promise<number>
  async bulkImportItemsToCompendium(cobaltToken: string, compendiumName?: string): Promise<number>
  
  // REQUIRED: Diagnostics
  async testProxyConnection(): Promise<boolean>
  async runDiagnostic(): Promise<void>
}
```

### 2. Parser Implementation
```typescript
// REQUIRED: Follow this exact structure for parsers
interface ContentParser<TInput, TOutput> {
  parse(data: TInput, options?: ParseOptions): Promise<TOutput>
  validate(data: TInput): ValidationResult
  transform(parsed: any): TOutput
}

// REQUIRED: ClassParser must follow this structure
class ClassParser {
  static parseClass(ddbClass: DDBClass, proxyData?: { data?: ProxyClassData }): Record<string, unknown>
  static parseClassArray(classes: DDBClass[], proxyDataArr?: Array<{ data?: ProxyClassData }>): unknown[]
}
```

## 🔄 IMPLEMENTATION STEPS

### 1. Foundation (REQUIRED)
- [x] Authentication with Cobalt token
- [x] API client with proxy integration
- [x] Basic data validation
- [x] Proxy directory structure fix

### 2. Core Features (REQUIRED)
- [x] Character import with full stats
- [x] Class import with HTML parsing
- [x] Spell import with compendium support
- [x] Item import with basic support

### 3. Content Library (OPTIONAL)
- [ ] Monster import (stub only)
- [ ] Adventure import (not started)
- [ ] Rule import (not started)
- [ ] Enhanced class features (in progress)

### 4. Advanced Features (OPTIONAL)
- [ ] Content synchronization
- [ ] Selective import
- [ ] Custom mapping
- [ ] Asset management

## 🐳 DOCKER WORKFLOW

### 1. Container Management
```bash
# REQUIRED: Use these exact commands
docker-compose up -d
docker-compose logs -f
docker-compose build beyond-foundry-proxy
docker-compose restart beyond-foundry-proxy
```

### 2. Directory Structure
- REQUIRED: beyond-foundry-proxy is a regular directory, not a submodule
- REQUIRED: class.ts is in beyond-foundry-proxy/src/
- VALIDATION: Check directory structure before making changes
- ERROR: If structure is incorrect, request user to fix it

## 📋 VALIDATION CHECKLIST

### 1. Before Code Changes
- [ ] Verify code-index-mcp is active
- [ ] Check for existing functionality
- [ ] Validate D&D Beyond compliance
- [ ] Check rate limiting implementation

### 2. After Code Changes
- [ ] Run type checking
- [ ] Run linting
- [ ] Test proxy connection
- [ ] Verify HTML parsing
- [ ] Check for raw HTML in output

## 🚨 ERROR HANDLING

### 1. Required Error Checks
- [ ] Network failures
- [ ] Authentication failures
- [ ] Data validation failures
- [ ] HTML parsing failures
- [ ] Rate limiting violations

### 2. Error Response Format
```typescript
// REQUIRED: Use this exact error format
interface ErrorResponse {
  success: false;
  errors: string[];
  endpoint: string;
}
```

## 📚 RESOURCE PATHS

### 1. Required Files
- src/module/api/BeyondFoundryAPI.ts
- src/parsers/ClassParser.ts
- beyond-foundry-proxy/src/class.ts
- docker-compose.yml

### 2. Documentation
- docs/parsers.md
- docs/architecture.md
- docs/api.md

## 🔍 SEARCH PATTERNS

### 1. Code Search
- Use codebase_search for semantic understanding
- Use grep_search for exact matches
- Use file_search for file location

### 2. Validation Search
- Search for existing implementations
- Search for error handling patterns
- Search for type definitions

## 🎯 SUCCESS CRITERIA

### 1. Required Criteria
- [ ] Matches core ddb-importer capabilities
- [ ] Preserves D&D Beyond data accurately
- [ ] Provides clear error messages
- [ ] Handles imports efficiently
- [ ] Works with FoundryVTT D&D 5e
- [ ] Uses modular parser architecture
- [ ] No raw HTML in output
- [ ] Well-organized TypeScript codebase

### 2. Optional Criteria
- [ ] Advanced feature support
- [ ] Custom mapping capabilities
- [ ] Asset management
- [ ] Content synchronization 