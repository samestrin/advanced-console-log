const ACL = require("../index");

// Create a logger instance with custom color configuration
const logger = new ACL({
	generateReport: true, // Generate a report at the end of the logging session showing log method usage statistics.
});

// Logging with different levels to demonstrate color differences
logger.debug("This is a debug message.");
logger.log("This is a regular log message.");
logger.info("This is an informational message.");
logger.warn("This is a warning message, it will include caller information.");
logger.error("This is an error message, it will include caller information.");
logger.fatal("This is a fatal message, terminating the process.");

logger.report();
