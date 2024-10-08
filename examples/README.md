# Advanced Console Log Examples

This directory contains various examples to demonstrate the usage, configuration, and advanced features of the `advanced-console-log` module. The examples are organized into categories for ease of reference.

## Table of Contents

### Basic Usage

- [Basic Usage](./basic-usage.js): A simple example demonstrating basic logging methods.

### Configuration Options

- [Configuration Options](./configuration-options.js): Showcases various configuration options available in ACL.

### Asynchronous Modes

- [Async Mode](./async-mode.js): Demonstrates how to use ACL in async mode.
- [Async-Queue Mode](./async-queue-mode.js): Shows how to use the async-queue mode for batching logs.
- [Worker Mode](./worker-mode.js): Explains how to use the worker mode to offload logging operations to a worker thread.

### Advanced Features

- [Generate Report](./generate-report.js): Shows how to generate a detailed report of log statistics.
- [Terminate on Fatal](./terminate-on-fatal.js): Demonstrates how to terminate the application upon a fatal log message.
- [Timers](./timers.js): Using timer methods to measure code execution time.
- [File Rotation](./file-rotation.js): Demonstrates file rotation and retention strategy.

### Utilities and Extensions

- [Custom Colors](./custom-colors.js): Explains how to set custom colors for different log levels.
- [Memory Usage](./memory-usage.js): Tracks and displays memory usage information.
- [Caller Info](./caller-info.js): Includes caller information (file, function, line) in log messages.
- [Conditional Logging](./conditional-logging.js): Logs messages conditionally based on a boolean value.
- [Pretty Printing](./pretty-printing.js): Uses the `dir` method to pretty print complex objects.
- [Stack Trace](./stack-trace.js): Logs the current stack trace of the application.
- [Extending ACL](./extending-acl.js): Demonstrates how to extend ACL to add custom functionality.
