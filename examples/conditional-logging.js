/**
 * Conditional Logging Example
 * Demonstrates logging messages conditionally based on a boolean value.
 */

const ACL = require("../index");

// Create an instance of ACL
const logger = ACL.getInstance();

function main() {
	const shouldLog = false;

	// This message will not be logged because shouldLog is false
	logger.info(shouldLog, "This message will not be logged.");

	// This message will be logged
	logger.info(!shouldLog, "This message will be logged.");
}

main();
