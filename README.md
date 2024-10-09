# Advanced Console Log (ACL)

[![Star on GitHub](https://img.shields.io/github/stars/samestrin/advanced-console-log?style=social)](https://github.com/samestrin/advanced-console-log/stargazers) [![Fork on GitHub](https://img.shields.io/github/forks/samestrin/advanced-console-log?style=social)](https://github.com/samestrin/advanced-console-log/network/members) [![Watch on GitHub](https://img.shields.io/github/watchers/samestrin/advanced-console-log?style=social)](https:
![Version 0.0.5](https://img.shields.io/badge/Version-0.0.5-blue) [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT) [![Built with Node.js](https://img.shields.io/badge/Built%20with-Node.js-green)](https:

**Advanced Console Log (ACL)**, available as the `advanced-console-log` NPM package, is a lightweight logging module for Node.js applications. It supports console and file logging with various levels, colors, and additional features such as memory usage tracking and caller information.

![Advanced Console Log](https://samestrin.github.io/media/advanced-console-log/advanced-console-log.png)

## Features

### Core Logging Features

- **Advanced Configuration Options**: Provides extensive [configuration options](docs/configuration-options.md) such as memory display modes, caller info inclusion levels, and more.
- **Multiple Log Levels**: Supports six logging levels (debug, log, info, warn, error, fatal) to categorize and prioritize log messages.
- **Console Logging**: Outputs log messages to the console with color-coded and formatted output based on log level.
- **File Logging**: Optionally logs messages to a specified file, with separate control over the log level for file output.
- **Asynchronous Logging Modes**: Supports multiple asynchronous logging modes ("async", "async-queue", "worker") for non-blocking operations in high-throughput environments.
- **Timestamps**: Includes configurable timestamps for all log messages.
- **Custom Color Configuration**: Allows custom color settings for each log level to override default colors.

### Logging Behavior and Execution Control

- **Asynchronous Logging**: Supports async versions of all log methods for non-blocking operations.
- **Conditional Logging**: Allows log messages to be conditionally logged based on boolean values.
- **Fatal Logging and Process Termination**: Optionally terminates the application upon a fatal log message.

### Advanced Information Tracking

- **Caller Information**: Includes caller information (file, function, line, and column) in log messages based on log level and configuration.
- **Inline Caller Information**: Displays inline caller information within log messages for quick debugging reference.
- **Memory Usage Tracking**: Tracks and displays memory usage, either in MB or percentage format, based on configuration.

### Performance Measurement

- **Timers and Performance Measurement**: Provides methods to start, stop, and measure elapsed time using high-resolution timers (`time`, `timeEnd`, `startTimer`, `stopTimer`).

### Utility and Debugging Tools

- **Stack Tracing**: Supports stack tracing with the `trace` method, similar to `console.trace`.
- **Pretty Printing of Objects**: Includes a `dir` method for pretty printing complex objects similar to `console.dir`.

### Reporting and Statistics

- **Log Reports**: Generates a report detailing the number of times each log method was called, with percentages.

### File Management

- **File Rotation and Retention**: Supports automatic log file rotation and retention strategies to manage log file sizes and disk space.

## Dependencies

This logging module utilizes the following built-in Node.js modules:

- **`fs`**: For file system operations, such as appending log messages to a specified file.
- **`path`**: Provides utilities for handling and manipulating file paths, ensuring cross-platform compatibility when working with file system operations.
- **`util`**: Used to format and inspect complex objects for pretty printing in log outputs.
- **`process`**: Provides access to the current Node.js process, enabling memory usage tracking and process termination.
- **`v8`**: Retrieves memory heap statistics to track memory usage within the application. _Lazy loaded for performance reasons._
- **`worker_threads`**: Used for worker thread operations in worker mode. _Lazy loaded for performance reasons._

_There are no external dependencies._

## Installation

To install the advanced-console-log npm module, you can use npm:

```bash
npm install advanced-console-log
```

## Usage

After installation, import `advanced-console-log` into your application using require:

```js
const ACL = require("advanced-console-log");
```

Then you can get a _single_ instance of ACL (recommended), created with your custom [configuration options](docs/configuration-options.md).

```js
const logger = ACL.getInstance({
	logLevel: 1,
});
```

or create a new ACL instance, using your custom [configuration options](docs/configuration-options.md).

```js
const logger = new ACL({
	logLevel: 1,
});
```

ACL supports a number of different [configuration options](docs/configuration-options.md). Here is another example using additional configuration options:

```js
const logger = ACL.getInstance({
	logLevel: 1,
	outputFilename: "app.log",
	outputFileLogLevel: 2,
	includeTimestamps: true,
	includeMemoryUsage: true,
	generateReport: true,
	terminateOnFatal: true,
	mode: "async",
});
```

### Asynchronous Logging Modes

ACL supports different modes of asynchronous logging to improve performance in high-throughput scenarios.

- **Regular Mode**: Default mode; logging methods are synchronous.
- **Async Mode**: All logging methods are converted to their asynchronous equivalents.
- **Async-Queue Mode**: Logs are queued and flushed in batches to improve performance.
- **Worker Mode**: Logging operations are offloaded to a worker thread to prevent blocking the main event loop.

To enable an asynchronous logging mode, set the `mode` configuration option:

```js
const logger = ACL.getInstance({
	mode: "async",
});
```

### Using Logging Methods

Once created, you can use the logger to log messages at various levels:

```js
logger.info("This is an info message");
logger.warn("This is a warning message");
logger.error("This is an error message");
```

You can also use a boolean to control log display.

```
const showLog = true;
logger.log(showLog, "This is a log message");
```

If `generateReport` is set to `true`, you can generate a detailed report at the end of the application.

```js
const logger = ACL.getInstance({
	generateReport: true,
});

logger.report();
```

### Async Logging Examples

ACL also supports asynchronous logging e.g., non-blocking operations. You can configure ACL to run in async mode:

```js
const logger = ACL.getInstance({
	mode: "async",
});

logger.info("This is an async info message");
logger.error("This is an async error message");
```

or you can directly call the async versions of log methods if you prefer:

```js
logger.infoAsync("This is an async info message");
logger.errorAsync("This is an async error message");
```

### Using Timers

ACL lets you measure the elapsed time of code execution using timers:

```js
logger.startTimer("Initialization");
// code to measure
logger.stopTimer("Initialization");
```

### Pretty Printing Objects

Use the `dir` method to pretty print complex objects:

```js
const sampleObject = { name: "John", age: 30, location: "New York" };
logger.dir(sampleObject);
```

## Documentation

- [Asynchronous Logging](/docs/async-logging.md)
- [Configuration Options](/docs/configuration-options.md)
- [File Rotation and Retention Strategy](/docs/file-rotation.md)
- [How to Extend or Customize ACL](/docs/extending-acl.md)
- [Log Levels](/docs/log-levels.md)
- [Methods](/docs/methods.md)
- [Performance Considerations](/docs/performance-considerations.md)

## Examples

- [Basic Usage](/examples/basic-usage.js): A simple example demonstrating basic logging methods.
- [Configuration Options](/examples/configuration-options.js): Showcases various configuration options available in ACL.
- [Async Mode](/examples/async-mode.js): Demonstrates how to use ACL in async mode.
- [Async-Queue Mode](/examples/async-queue-mode.js): Shows how to use the async-queue mode for batching logs.
- [Worker Mode](/examples/worker-mode.js): Explains how to use the worker mode to offload logging operations.
- [Custom Colors](/examples/custom-colors.js): Explains how to set custom colors for different log levels.
- [Generate Report](/examples/generate-report.js): Shows how to generate a detailed report of log statistics.
- [Terminate on Fatal](/examples/terminate-on-fatal.js): Demonstrates how to terminate the application upon a fatal log message.
- [Timers](/examples/timers.js): Using timer methods to measure code execution time.
- [File Rotation](/examples/file-rotation.js): Demonstrates file rotation and retention strategy.
- [Memory Usage](/examples/memory-usage.js): Tracks and displays memory usage information.
- [Caller Info](/examples/caller-info.js): Includes caller information (file, function, line) in log messages.
- [Conditional Logging](/examples/conditional-logging.js): Logs messages conditionally based on a boolean value.
- [Pretty Printing](/examples/pretty-printing.js): Uses the `dir` method to pretty print complex objects.
- [Stack Trace](/examples/stack-trace.js): Logs the current stack trace of the application.
- [Extending ACL](/examples/extending-acl.js): Demonstrates how to extend ACL to add custom functionality.

## Contribute

Contributions to this project are welcome. Please fork the repository and submit a pull request with your changes or improvements.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Share

[![Twitter](https://img.shields.io/badge/X-Tweet-blue)](https://twitter.com/intent/tweet?text=Check%20out%20this%20awesome%20project!&url=https://github.com/samestrin/advanced-console-log) [![Facebook](https://img.shields.io/badge/Facebook-Share-blue)](https://www.facebook.com/sharer/sharer.php?u=https://github.com/samestrin/advanced-console-log) [![LinkedIn](https://img.shields.io/badge/LinkedIn-Share-blue)](https://www.linkedin.com/sharing/share-offsite/?url=https://github.com/samestrin/advanced-console-log)
