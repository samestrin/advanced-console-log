# [Advanced Console Log Documentation](/docs/README.md)

## Core Logging Methods

The following are the core logging methods available in the `advanced-console-log` module.

### `debug(condition = true, ...args)`

Logs a debug message with a cyan color. It’s typically used for detailed debugging information.

### `log(condition = true, ...args)`

Logs a general message with a green color. It’s a more standard log method for everyday use.

### `info(condition = true, ...args)`

Logs an informational message with a light green color. Use this method for general information and status updates.

### `warn(condition = true, ...args)`

Logs a warning message with a yellow color. It’s used for non-critical issues that may need attention.

### `error(condition = true, ...args)`

Logs an error message with a light red color. Use this method to indicate significant errors that could affect program flow.

### `fatal(condition = true, ...args)`

Logs a fatal error message with a magenta color. It’s used for severe errors that may terminate the application. If `terminateOnFatal` is set to `true`, it will terminate the process.

## Async Logging Methods

The following are the async logging methods available in the `advanced-console-log` module. These can be called directly, or you can configure the instance of ACL to run in an async mode (e.g., `mode: "async"`) and use the Core Logging Methods.

### `debugAsync(condition = true, ...args)`

The asynchronous version of `debug`. It does not block the main event loop and should be used in scenarios requiring non-blocking behavior.

### `logAsync(condition = true, ...args)`

The asynchronous version of `log`. It allows for non-blocking logging.

### `infoAsync(condition = true, ...args)`

The asynchronous version of `info`. Non-blocking logging for information messages.

### `warnAsync(condition = true, ...args)`

The asynchronous version of `warn`. Used for non-blocking warnings.

### `errorAsync(condition = true, ...args)`

The asynchronous version of `error`. Useful for non-blocking error logging.

### `fatalAsync(condition = true, ...args)`

The asynchronous version of `fatal`. Non-blocking fatal logging. If `terminateOnFatal` is set to `true`, it will terminate the process.

## Timer Methods

### `startTimer(label)`

Starts a high-resolution timer with the given `label`. Use it to measure the elapsed time for code execution.

### `stopTimer(label)`

Stops the timer with the given `label` and logs the elapsed time. If the timer does not exist, it logs an error message.

### `getTimer(label)`

Retrieves the elapsed time in milliseconds for the given `label`. If the timer does not exist, it logs an error message.

### `time(label)`

An alias for `startTimer(label)`. Starts a timer with the given `label`.

### `timeEnd(label)`

An alias for `stopTimer(label)`. Stops the timer with the given `label` and logs the elapsed time.

### `clearAllTimers()`

Clears all active timers.

**Note:** If the `enableTimers` configuration option is not set to `true`, calling these timer methods will throw an error.

## Utility Methods

### `dir(obj)`

Pretty prints complex objects using Node.js's `util.inspect` method. Useful for inspecting deeply nested objects.

### `trace()`

Logs the current stack trace of the application. It’s similar to `console.trace()` and helpful for debugging.

## Report Method

### `report()`

Generates a detailed report if `generateReport` is set to `true`. The report includes the number of calls made to each log method (`debug`, `log`, `info`, etc.) and their respective percentages.

**Note:** If the `generateReport` configuration option is not set to `true`, calling this method will throw an error.

## Close Method

### `close()`

Closes any open resources, such as file streams or worker threads. Should be called when the logger is no longer needed, especially in asynchronous modes.
