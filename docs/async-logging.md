# [Advanced Console Log Documentation](/docs/README.md)

## How to Enable Async Logging

Asynchronous logging is a feature of ACL that allows log operations to be non-blocking, making it ideal for high-throughput scenarios where performance is a key consideration. By enabling async logging, ACL uses non-blocking methods to write logs, ensuring that the main application flow is not interrupted by logging operations.

### Enabling Async Mode

You can configure ACL to run in async mode globally by setting the `useAsyncLogging` option to `true` when creating the logger instance:

```js
const logger = ACL.getInstance({
	logLevel: 1,
	useAsyncLogging: true,
});

logger.info("This is an async info message");
logger.error("This is an async error message");
```

Alternatively, you can use the dedicated async methods for individual calls if you don't want to enable it globally:

```js
logger.infoAsync("This is an async info message");
logger.errorAsync("This is an async error message");
```

## Why Use Async Logging?

Asynchronous logging is beneficial in scenarios where logging operations are frequent, and blocking I/O can negatively impact performance. Here’s why you should consider it:

- **Improved Performance:** The async methods do not block the event loop, making them better suited for scenarios where multiple log operations are performed rapidly.
- **Non-blocking I/O:** Since the file operations are handled asynchronously, the main thread is not held up by I/O tasks, reducing latency and improving overall responsiveness.
- **Flexibility:** By enabling `useAsyncLogging`, users can switch to async logging methods seamlessly without changing their code structure.

## Use Cases for Async Logging

- **High-frequency logging scenarios:** Applications that generate a large number of log entries in a short period (e.g., high-volume APIs, data processing pipelines).
- **Applications with strict latency requirements:** Use async logging to avoid delays in time-sensitive applications.
- **Microservices and distributed systems:** Async logging minimizes delays in inter-service communication and ensures that the service remains responsive.

## How to Optimize Async Logging Performance

### Batch Writes

Consider implementing batched logging for even greater performance. While ACL currently logs each message as a separate operation, batching multiple messages into a single write operation can significantly improve performance under high-load scenarios. Currently, this can be customized by extending ACL’s core implementation.

### Error Handling in Async Mode

One consideration for async logging is error handling. Ensure that async methods are correctly handled using `.catch()` for promises, or `try...catch` blocks with `await` to prevent unhandled rejections that might affect your application flow.

## Summary of the Differences

| **Feature**               | **Regular Logging Methods**            | **Async Logging Methods**                           |
| ------------------------- | -------------------------------------- | --------------------------------------------------- |
| **Execution**             | Synchronous (blocks the event loop)    | Asynchronous (does not block the event loop)        |
| **Method of Execution**   | Direct function call                   | `setImmediate` to defer execution                   |
| **File Write Operations** | Uses `fs.appendFileSync` (synchronous) | Uses `fs.appendFile` (asynchronous)                 |
| **Use Case**              | Suitable for low-throughput scenarios  | Best for high-throughput, non-blocking requirements |
