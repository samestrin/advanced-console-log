# [Advanced Console Log Documentation](/docs/README.md)

## File Rotation and Retention Strategy

The ACL module supports log file rotation and retention to help manage the growth of log files over time. This feature is crucial for long-running applications where logs can accumulate quickly and potentially consume disk space.

### Configuring Log File Rotation

You can set the maximum log file size and the number of retained log files using these configuration options:

- `maxLogFileSizeMB`: Specifies the maximum size (in MB) before a log file is rotated.
- `maxLogFiles`: Defines the number of log files to retain. When the limit is reached, the oldest log files are deleted.

#### Example Configuration:

```js
const logger = ACL.getInstance({
	outputFilename: "app.log",
	maxLogFileSizeMB: 5, // Rotate logs after 5 MB
	maxLogFiles: 3, // Keep only 3 log files
});
```

### Log Rotation Behavior

When the log file exceeds the specified size (`maxLogFileSizeMB`), ACL renames the current log file by appending a timestamp to its name. It then starts a new log file with the original filename. If the number of retained log files (`maxLogFiles`) is exceeded, the oldest log files are deleted.

This configuration ensures that log files are managed efficiently, preventing uncontrolled growth in disk usage.
