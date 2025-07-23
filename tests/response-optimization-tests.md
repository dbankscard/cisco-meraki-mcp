# Response Optimization Test Suite

This directory contains comprehensive test scripts to validate that the response optimization enhancements prevent token overflow and conversation length limit errors.

## Test Scripts

### 1. test-response-limits.js
**Purpose**: Core unit tests for response optimization functions

Tests:
- `optimizeResponse()` function with various data sizes
- `createSummaryResponse()` for data summarization
- `formatToolResponse()` for tool-specific optimizations
- Response size measurements and reduction calculations
- Edge cases (empty arrays, null values, deeply nested structures)
- Performance testing with different data sizes

**Key validations**:
- Optimization kicks in at configured thresholds (default: 100 items for arrays, 30KB for responses)
- Meta information is correctly added for truncated responses
- String truncation works at specified lengths
- Tool-specific summaries include relevant fields

### 2. test-mcp-response-integration.js
**Purpose**: Integration tests simulating actual MCP tool execution

Tests:
- Mock API responses with varying sizes
- Tool execution with response optimization
- Different settings configurations
- Token estimation and reduction metrics

**Key scenarios**:
- High-volume network clients list (1000+ items)
- Organization devices with statuses (800+ devices)
- Network events with nested data (300+ events)
- Small responses that shouldn't be optimized

### 3. test-conversation-limits.js
**Purpose**: Validates prevention of conversation length limit errors

Tests:
- Multi-tool conversation simulation
- Extreme scenarios (10,000+ items)
- Cumulative token growth tracking
- Comparison with/without optimization

**Key validations**:
- Conversations stay within Claude's context limit (~200K tokens)
- Large responses are automatically summarized
- Multiple tool calls don't cause overflow
- Token reduction is significant (typically 90%+ for large datasets)

## Running the Tests

### Prerequisites
1. Build the project first:
```bash
npm run build
```

2. Ensure you have Node.js 18+ installed

### Run Individual Tests

```bash
# Run response optimization unit tests
node test-response-limits.js

# Run MCP integration tests
node test-mcp-response-integration.js

# Run conversation limit tests
node test-conversation-limits.js
```

### Run All Tests
```bash
# Run all response optimization tests
npm run test:response-limits
```

## Expected Results

### Successful Test Output
- All optimization thresholds are respected
- Meta information is added for truncated responses
- Summary responses include relevant fields
- Token usage stays well below Claude's limits
- Performance is acceptable (< 100ms for most operations)

### Key Metrics to Monitor
1. **Array Truncation**: Arrays > 100 items should be truncated
2. **Response Summarization**: Responses > 30KB should be summarized
3. **Token Reduction**: Large responses should see 80-95% reduction
4. **Context Safety**: All responses should keep conversations under 200K tokens

## Configuration

Response limits can be configured in `meraki-mcp-settings.json`:

```json
{
  "responseLimits": {
    "maxArrayLength": 50,
    "maxResponseSize": 30000,
    "summarizeArrays": true,
    "truncateLongStrings": true,
    "maxStringLength": 1000
  }
}
```

## Troubleshooting

### Tests Fail with Module Errors
- Ensure project is built: `npm run build`
- Check Node.js version: `node --version` (should be 18+)

### Optimization Not Applied
- Check settings file exists and is valid JSON
- Verify response size exceeds thresholds
- Ensure tool name matches optimization patterns

### Performance Issues
- Large datasets (5000+ items) may take longer to process
- Consider adjusting `maxArrayLength` for better performance
- Use pagination parameters when available

## Adding New Tests

To test a new tool or scenario:

1. Add test case to appropriate script
2. Include realistic data generator
3. Verify optimization behavior
4. Check token usage remains safe

Example:
```javascript
{
  name: 'New Tool Test',
  data: generateNewToolData(1000),
  toolName: 'new_tool_name',
  expectOptimization: true,
  expectSummary: true
}
```