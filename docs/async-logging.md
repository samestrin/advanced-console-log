# [Advanced Console Log Documentation](/docs/README.md)

## How to Enable Async Logging

Asynchronous logging is a feature of ACL that allows log operations to be non-blocking, making it ideal for high-throughput scenarios where performance is a key consideration. By enabling async logging, ACL uses non-blocking methods to write logs, ensuring that the main application flow is not interrupted by logging operations.

### Enabling Async Mode

You can configure ACL to run in async mode globally by setting the `mode` option to `"async"`, `"async-queue"`, or `"worker"` when creating the logger instance:

```js
const logger = ACL.getInstance({
	logLevel: 1,
	mode: "async",
});
logger.info("This is an async info message");
logger.error("This is an async error message");
```

Alternatively, you can use the dedicated async methods for individual calls if you don't want to enable it globally:

```js
logger.infoAsync("This is an async info message");
logger.errorAsync("This is an async error message");
```

### Async-Queue Mode

If you need to optimize file I/O operations further, you can use the `async-queue` mode. In this mode, log entries are queued and written to the file in batches, reducing the overhead associated with individual file writes.

Configure `queueBatchSize` and `flushInterval` options for fine-grained control:

```js
const logger = ACL.getInstance({
	mode: "async-queue",
	outputFilename: "async-queue-app.log",
	queueBatchSize: 10, // Number of log entries before triggering a flush
	flushInterval: 1000, // Interval (in milliseconds) for flushing logs
});
```

### Worker Mode

In worker mode, the logging operations are offloaded to a worker thread, making it the most efficient option in high-throughput environments.

```js
const logger = ACL.getInstance({
	mode: "worker",
	outputFilename: "worker-app.log",
	includeTimestamps: true,
});
```

### Why Use Async Logging?

Asynchronous logging is beneficial in scenarios where logging operations are frequent, and blocking I/O can negatively impact performance. Here’s why you should consider it:

- **Improved Performance:** The async methods do not block the event loop, making them better suited for scenarios where multiple log operations are performed rapidly.
- **Non-blocking I/O:** Since the file operations are handled asynchronously, the main thread is not held up by I/O tasks, reducing latency and improving overall responsiveness.
- **Flexibility:** By enabling `mode: "async"`, `mode: "async-queue"`, or `mode: "worker"`, users can switch to async logging seamlessly.

### Use Cases for Async Logging

- **High-frequency logging scenarios:** Applications that generate a large number of log entries in a short period (e.g., high-volume APIs, data processing pipelines).
- **Applications with strict latency requirements:** Use async logging to avoid delays in time-sensitive applications.
- **Microservices and distributed systems:** Async logging minimizes delays in inter-service communication and ensures that the service remains responsive.
