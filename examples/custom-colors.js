/**
 * Custom Colors Example
 * Demonstrates setting custom colors for log levels.
 */

const ACL = require("../index");

// Create an instance of ACL with custom colors
const logger = new ACL({
	color: {
		debug: "\x1b[35m", // Magenta
		log: "\x1b[36m", // Cyan
		info: "\x1b[32m", // Green
		warn: "\x1b[33m", // Yellow
		error: "\x1b[31m", // Red
		fatal: "\x1b[41m", // Red background
	},
});

function main() {
	logger.debug("This is a debug message with custom color.");
	logger.log("This is a log message with custom color.");
	logger.info("This is an info message with custom color.");
	logger.warn("This is a warning message with custom color.");
	logger.error("This is an error message with custom color.");
	logger.fatal("This is a fatal message with custom color.");
}

main();
