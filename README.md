# advanced-console-log

[![Star on GitHub](https://img.shields.io/github/stars/samestrin/advanced-console-log?style=social)](https://github.com/samestrin/advanced-console-log/stargazers) [![Fork on GitHub](https://img.shields.io/github/forks/samestrin/advanced-console-log?style=social)](https://github.com/samestrin/advanced-console-log/network/members) [![Watch on GitHub](https://img.shields.io/github/watchers/samestrin/advanced-console-log?style=social)](https://github.com/samestrin/advanced-console-log/watchers)

![Version 0.0.2](https://img.shields.io/badge/Version-0.0.2-blue) [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT) [![Built with Node.js](https://img.shields.io/badge/Built%20with-Node.js-green)](https://nodejs.org/)

A customizable logger module for Node.js applications, supporting console and file logging with various levels, colors, and additional features like memory usage and caller information.

![Advanced Console Log](https://samestrin.github.io/media/advanced-console-log/advanced-console-log.png)

## Features

### Core Logging Features

- **Advanced Configuration Options**: Provides extensive configuration options such as memory display modes, caller info inclusion levels, and more.
- **Multiple Log Levels**: Supports six logging levels (debug, log, info, warn, error, fatal) to categorize and prioritize log messages.
- **Console Logging**: Outputs log messages to the console with color-coded and formatted output based on log level.
- **File Logging**: Optionally logs messages to a specified file, with separate control over the log level for file output.
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

## Dependencies

This logging module utilizes the following built-in Node.js modules:

- **`fs`**: For file system operations, such as appending log messages to a specified file.
- **`util`**: Used to format and inspect complex objects for pretty printing in log outputs.
- **`process`**: Provides access to the current Node.js process, enabling memory usage tracking and process termination.
- **`v8`**: Retrieves memory heap statistics to track memory usage within the application.

There are no external dependencies.

## Installation

To install the LLM Interface npm module, you can use npm:

```bash
npm install advanced-console-log
```

## Usage

First import `advanced-console-log` into your application using require:

```js
const ACL = require("advanced-console-log");
```

Then you can get a _single_ instance of ACL (recommended), created with your custom [configuration options](docs/configuration-options.md).

```js
const logger = ACL.getInstance({
	logLevel: 1, // Set console log level
});
```

or create a new ACL instance, using your custom [configuration options](docs/configuration-options.md).

```js
const logger = new ACL({
	logLevel: 1, // Set console log level
});
```

ACL supports a number of different [configuration options](docs/configuration-options.md). Here is another example using additional configuration options:

```js
const logger = ACL.getInstance({
	logLevel: 1, // Set console log level
	outputFilename: "app.log", // Specify log file name
	outputFilenameLogLevel: 2, // Set file log level
	includeTimestamps: true, // Include timestamps in logs
	includeMemoryUsage: true, // Track and display memory usage
	generateReport: true, // Enable log method call reporting
	terminateOnFatal: true, // Terminate on fatal log messages
});
```

Once created, you can use the logger to log messages at various levels:

```js
logger.info("This is an info message");
logger.warn("This is a warning message");
logger.error("This is an error message");
```

You can also use a boolean to control log display.

```js
const showLog = true;
logger.log(showLog, "This is an log message");
```

If `generateReport` is set to `true`, you can generate a detailed report at the end of the application.

```js
const logger = ACL.getInstance({
	generateReport: true, // Enable log method call reporting
});
// Perform some operations
logger.report();
```

ACL also supports asynchronous logging e.g. non-blocking operations. You can call configure ACL to run in async mode:

```js
const logger = ACL.getInstance({
	logLevel: 1, // Set console log level
	useAsyncLogging: true, // Configure ACL to run in async mode
});
// then all subsequent calls will automatically be asynchronous
logger.info("This is an async info message");
logger.error("This is an async error message");
```

or you can directly call the async versions of log methods if you prefer:

```js
logger.infoAsync("This is an async info message");
logger.errorAsync("This is an async error message");
```

ACL lets you measure the elapsed time of code execution using timers:

```js
logger.startTimer("Initialization");
// Perform some operations
logger.stopTimer("Initialization");
```

Use the `dir` method to pretty print complex objects:

```js
const sampleObject = { name: "John", age: 30, location: "New York" };
logger.dir(sampleObject);
```

## Contribute

Contributions to this project are welcome. Please fork the repository and submit a pull request with your changes or improvements.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Share

[![Twitter](https://img.shields.io/badge/X-Tweet-blue)](https://twitter.com/intent/tweet?text=Check%20out%20this%20awesome%20project!&url=https://github.com/samestrin/advanced-console-log) [![Facebook](https://img.shields.io/badge/Facebook-Share-blue)](https://www.facebook.com/sharer/sharer.php?u=https://github.com/samestrin/advanced-console-log) [![LinkedIn](https://img.shields.io/badge/LinkedIn-Share-blue)](https://www.linkedin.com/sharing/share-offsite/?url=https://github.com/samestrin/advanced-console-log)
