/**
 * Configuration Options Example
 * Demonstrates how to use different configuration options in ACL.
 */

const ACL = require("../index");
// Create an instance of ACL with custom configuration
const logger = ACL.getInstance({
	logLevel: 1, // Set console log level
	outputFilename: "app.log", // Enable file logging
	outputFileLogLevel: 2, // Set file log level
	includeTimestamps: true, // Include timestamps in log messages
	includeMemoryUsage: true, // Include memory usage information
	memoryDisplayMode: 1, // Display memory usage in MB
	includeCallerInfo: true, // Include caller information
	callerInfoLevel: 2, // Include caller info for log level 2 and above
	includeInlineCallerInfo: true, // Include inline caller information
	inlineCallerInfoLevel: 1, // Include inline caller info for log level 1 and above
	includeStackTrace: true, // Include stack trace in error and fatal messages
	generateReport: true, // Enable report generation
	terminateOnFatal: true, // Terminate on fatal log
	enableTimers: true, // Enable timer methods
});

function main() {
	logger.debug("This is a debug message.");
	logger.log("This is a log message.");
	logger.info("This is an info message.");
	logger.warn("This is a warning message.");
	logger.error("This is an error message.");
	logger.fatal("This is a fatal message.");

	// Generate report
	logger.report();
}

main();
