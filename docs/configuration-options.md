# [Advanced Console Log Documentation](/docs/README.md)

## Configuration Options

The `advanced-console-log` module offers a wide range of configuration options to customize its behavior. Below is a detailed breakdown of each configuration option:

### Core Configuration Options

| **Option**             | **Type**  | **Default** | **Description**                                                                                                                  |
| ---------------------- | --------- | ----------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `logLevel`             | `number`  | `1`         | Sets the console [log level](log-levels.md). Accepts values from `0` (debug) to `5` (fatal).                                     |
| `terminateOnFatal`     | `boolean` | `false`     | If `true`, terminates the current process upon a `fatal` message.                                                                |
| `includeTimestamps`    | `boolean` | `true`      | Determines whether to include timestamps in log messages.                                                                        |
| `includeMemoryUsage`   | `boolean` | `false`     | If `true`, includes memory usage information in log messages.                                                                    |
| `generateReport`       | `boolean` | `false`     | If `true`, generates a summary report showing the number of times each log method was called.                                    |
| `memoryCheckFrequency` | `number`  | `10`        | Defines the frequency of memory checks.                                                                                          |
| `memoryDisplayMode`    | `number`  | `1`         | Defines the format for memory usage display. (1 is `MB`, 2 is `%`, and 3 is both).                                               |
| `extraSpace`           | `boolean` | `false`     | If `true`, adds an extra space after each logging message.                                                                       |
| `color`                | `object`  | `{}`        | Allows custom color configuration for log levels. See **[Example: Custom Colors](/examples/custom-colors.js)** for more details. |

### Timestamp and Caller Information Configuration

| **Option**          | **Type**  | **Default**    | **Description**                                                                                               |
| ------------------- | --------- | -------------- | ------------------------------------------------------------------------------------------------------------- |
| `timestampFormat`   | `string`  | `HH:mm:ss.SSS` | Defines the timestamp format using date/time formatting tokens (`YYYY`, `MM`, `DD`, `HH`, `mm`, `ss`, `SSS`). |
| `includeCallerInfo` | `boolean` | `false`        | If `true`, includes caller information (file, function, line, and column) in log messages.                    |
| `callerInfoLevel`   | `number`  | `2`            | Sets the log level for caller information. Only logs of this level or higher include caller info.             |
| `inlineCallerInfo`  | `boolean` | `false`        | If `true`, displays caller information inline within log messages for easier debugging.                       |
| `includeStackTrace` | `boolean` | `false`        | If `true`, includes a stack trace in error and fatal messages.                                                |

### File Logging Configuration

| **Option**                  | **Type**  | **Default** | **Description**                                                                                                            |
| --------------------------- | --------- | ----------- | -------------------------------------------------------------------------------------------------------------------------- |
| `outputFilename`            | `string`  | `null`      | Specifies the filename for file-based logging. If empty, file logging is disabled.                                         |
| `outputFileLogLevel`        | `number`  | `1`         | Sets the [log level](log-levels.md) for file logging. Accepts values from `0` (debug) to `5` (fatal).                      |
| `outputFileBatchOutput`     | `boolean` | `false`     | If `true`, enables batching of log entries for file output to improve performance.                                         |
| `outputFileBatchOutputSize` | `number`  | `25`        | The number of log entries to batch before writing to the file. Applies only when `outputFileBatchOutput` is set to `true`. |
| `maxLogFileSizeMB`          | `number`  | `10`        | Defines the maximum log file size in MB. When the file size is reached, a new log file is created.                         |
| `maxLogFiles`               | `number`  | `5`         | Limits the number of log files retained. Older files are deleted when the limit is exceeded.                               |

### Performance and Async Configuration

| **Option**        | **Type**  | **Default** | **Description**                                                                                                                                                                                                                                              |
| ----------------- | --------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `useAsyncLogging` | `boolean` | `false`     | If `true`, all standard log methods (`debug`, `info`, `warn`, etc.) are automatically converted to their asynchronous equivalents (`debugAsync`, `infoAsync`, etc.), enabling non-blocking logging for improved performance in high-throughput environments. |
