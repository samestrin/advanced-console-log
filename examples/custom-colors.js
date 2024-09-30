const ACL = require("../index");

// Create a logger instance with custom color configuration
const logger = new ACL({
	logLevel: 1, // Show all log levels
	terminateOnFatal: true, // Terminate on fatal error message
	color: {
		debug: "\x1b[36m", // Cyan
		log: "\x1b[32m", // Green
		info: "\x1b[34m", // Blue
		warn: "\x1b[33m", // Yellow
		error: "\x1b[31m", // Red
		fatal: "\x1b[35m", // Magenta
		caller: "\x1b[90m", // Gray for caller info
		inlineCaller: "\x1b[95m", // Bright Magenta for inline caller info
	},
});

// Logging with different levels to demonstrate color differences
logger.debug("This is a debug message.");
logger.log("This is a regular log message.");
logger.info("This is an informational message.");
logger.warn("This is a warning message.");
logger.error("This is an error message.");
logger.fatal("This is a fatal message, terminating the process.");
logger.error(
	"This is an error message that isn't displayed because the process ended."
);
