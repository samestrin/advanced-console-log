# [Advanced Console Log Documentation](/docs/README.md)

## Performance Considerations

To optimize ACL’s performance in high-throughput applications, consider the following recommendations:

### 1. Use Asynchronous Logging

Set `useAsyncLogging` to `true` in your logger configuration or use async methods (e.g., `logger.infoAsync`) to prevent blocking the main event loop. This approach is ideal for high-frequency logging scenarios where performance is critical.

#### Example:

```js
const logger = ACL.getInstance({
	useAsyncLogging: true,
});
```

### 2. Reduce Console Logging

Frequent console writes can introduce overhead, especially in production environments. Consider using higher log levels (`logLevel: 3` for `warn` and above) or disable console logging entirely to reduce performance impact.

### 3. Minimize Memory Usage Tracking

If memory tracking is not required, disable it by setting `includeMemoryUsage` to `false`. This reduces the computational cost associated with memory statistics collection.

### 4. Optimize File I/O Operations

Configure file rotation and reduce log file write frequency by batching multiple log entries into a single write operation. While not currently built into ACL, this can be implemented by extending the library.

By applying these strategies, you can significantly improve the performance of ACL in demanding scenarios.
