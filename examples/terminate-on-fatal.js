const ACL = require("../index");

// Create a logger instance with custom color configuration
const logger = new ACL({
	terminateOnFatal: true, // Terminate on fatal error message
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
