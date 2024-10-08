/**
 * Basic Usage Example
 * Demonstrates basic logging methods provided by ACL.
 */

const ACL = require("../index"); // Adjust the path as necessary

// Create an instance of ACL with default configuration
const logger = ACL.getInstance();

function main() {
	// Log messages at various levels
	logger.debug("This is a debug message.");
	logger.log("This is a log message.");
	logger.info("This is an info message.");
	logger.warn("This is a warning message.");
	logger.error("This is an error message.");
	logger.fatal("This is a fatal message.");
}

main();
