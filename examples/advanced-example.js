const ACL = require("../index");

// Create a logger instance with custom color configuration
const logger = new ACL({
	includeTimestamps: true, // Include timestamps in all log messages.
	includeMemoryUsage: true, // Track and display memory usage information in the logs.
	memoryDisplayMode: 2, // Memory display mode: (1 = MB, 2 = %, 3 = both MB and %).
	generateReport: true, // Generate a report at the end of the logging session showing log method usage statistics.

	// Caller Information Settings
	includeCallerInfo: 1, // Enable the inclusion of caller information (file, line, and column) in log messages.
	callerInfoLevel: 3, // Minimum log level to include caller information (0 = debug, 1 = log, 2 = info, 3 = warn, etc.).
	callerInfoDisplayMode: 2, // Format for caller information display:
	// 1 = Multi-line format (shows file, function, line, and column separately).
	// 2 = Inline format (compact single line: file:line:column).

	// Inline Caller Information Settings
	includeInlineCallerInfo: 1, // Display inline caller information within the log message (quick debugging reference).
	inlineCallerInfoLevel: 3, // Minimum log level to include inline caller information (similar to `callerInfoLevel`).

	terminateOnFatal: true, // Terminate the application on a `fatal` log message.
});

// Logging with different levels to demonstrate color differences
logger.debug("This is a debug message.");
logger.log("This is a regular log message.");
logger.info("This is an informational message.");
logger.warn("This is a warning message, it will include caller information.");
logger.error("This is an error message, it will include caller information.");
logger.fatal("This is a fatal message, terminating the process.");
