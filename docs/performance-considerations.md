# [Advanced Console Log Documentation](/docs/README.md)

## Performance Considerations

To optimize ACL’s performance in high-throughput applications, consider the following recommendations:

### 1. Use Asynchronous Logging

Set the `mode` configuration option to `"async"`, `"async-queue"`, or `"worker"` to enable asynchronous logging. This prevents blocking the main event loop and is ideal for high-frequency logging scenarios where performance is critical. The selected mode determines how logs are managed:

- **Async Mode**: Log methods (`info`, `warn`, etc.) are converted to their asynchronous equivalents (`infoAsync`, `warnAsync`, etc.) to avoid blocking the main thread during I/O operations.
- **Async-Queue Mode**: Log entries are batched and written in groups based on the `queueBatchSize` and `flushInterval` configurations, reducing the frequency of file writes and improving performance.
- **Worker Mode**: Logging operations are offloaded to a separate worker thread, further isolating logging I/O from the main application flow.

#### Example:

```js
const logger = ACL.getInstance({
	mode: "async-queue", // Use "async" or "worker" depending on needs
	queueBatchSize: 50,
	flushInterval: 1000,
});
```

### 2. Optimize File I/O Operations

ACL supports batched logging through the `"async-queue"` mode, which reduces file I/O by grouping log entries together before writing to the file. Use the following configurations to fine-tune file I/O:

- **`queueBatchSize`**: Defines the number of log entries to batch before writing to the file.
- **`flushInterval`**: Sets the interval (in milliseconds) at which the log queue is flushed when in `async-queue` mode.

This ensures that log entries are written to the file in larger batches, minimizing the number of disk operations and improving performance.

#### Example:

```js
const logger = ACL.getInstance({
	mode: "async-queue",
	queueBatchSize: 100,
	flushInterval: 2000,
});
```

### 3. Configure File Rotation and Retention

Proper file rotation and retention settings prevent uncontrolled log file growth, which could degrade performance over time. Use the following options to manage log file size and disk space:

- **`maxLogFileSizeMB`**: Sets the maximum size (in MB) of each log file before it is rotated.
- **`maxLogFiles`**: Limits the number of rotated log files to retain. Older files are deleted when this limit is exceeded.

These settings help maintain optimal performance by keeping file sizes manageable and avoiding excessive disk usage.

#### Example:

```js
const logger = ACL.getInstance({
	outputFilename: "app.log",
	maxLogFileSizeMB: 10, // Rotate files at 10MB size
	maxLogFiles: 5, // Retain up to 5 log files
});
```

### 4. Reduce Console Logging Overhead

Frequent console logging can introduce significant overhead, especially in production environments where logs may be generated at a high frequency. Consider the following strategies to reduce this overhead:

- **Raise the Console Log Level**: Increase the `logLevel` configuration to avoid lower-level logs such as `debug` and `info`.
- **Disable Console Logging**: Set `logLevel` to `4` (`error`) or higher to limit console output to errors and critical messages.
- **Use Conditional Logging**: Control logging dynamically by using conditional logging methods (e.g., `logger.info(showLogs, "Message")`).

#### Example:

```js
const logger = ACL.getInstance({
	logLevel: 3, // Only log warnings and higher to console
});
```

### 5. Minimize Memory Usage Tracking

Memory usage tracking is an optional feature that can be enabled using the `includeMemoryUsage` configuration. If this information is not needed, disable memory tracking to reduce the computational cost associated with collecting and formatting memory statistics.

- **`includeMemoryUsage`**: Set to `false` to disable memory usage tracking.
- **`memoryCheckFrequency`**: If memory tracking is required, adjust the frequency of checks to reduce performance impact.

#### Example:

```js
const logger = ACL.getInstance({
	includeMemoryUsage: false, // Disable memory usage tracking for better performance
});
```

### 6. Utilize Worker Threads for Logging

For high-throughput applications that need to completely offload logging operations, use the `"worker"` mode. In this mode, all logging operations are handled in a separate worker thread, freeing up the main thread to focus on application logic.

This mode is ideal for applications with strict performance requirements, as it prevents any logging-related I/O from blocking the main application.

#### Example:

```js
const logger = ACL.getInstance({
	mode: "worker",
	outputFilename: "worker-app.log",
	maxLogFileSizeMB: 5,
	maxLogFiles: 3,
});
```

### Summary of Performance Tips

| **Strategy**                 | **Recommendation**                                                             |
| ---------------------------- | ------------------------------------------------------------------------------ |
| **Use Async Logging**        | Set `mode` to `"async"`, `"async-queue"`, or `"worker"` for non-blocking logs. |
| **Batch Log Entries**        | Use `queueBatchSize` and `flushInterval` for efficient file I/O operations.    |
| **Optimize File Rotation**   | Set `maxLogFileSizeMB` and `maxLogFiles` to manage disk usage.                 |
| **Reduce Console Logging**   | Increase `logLevel` or disable console logging for better performance.         |
| **Minimize Memory Tracking** | Set `includeMemoryUsage` to `false` unless required.                           |
| **Utilize Worker Threads**   | Use `"worker"` mode to offload logging to a separate thread.                   |
