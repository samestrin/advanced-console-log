/**
 * Worker Mode Example
 * Demonstrates logging in worker mode.
 */

const ACL = require("../index");

// Create an instance of ACL in worker mode
const logger = ACL.getInstance({
	mode: "worker",
	outputFilename: "worker-app.log",
	includeTimestamps: true,
});

function main() {
	logger.debug("This is a worker mode debug message.");
	logger.log("This is a worker mode log message.");
	logger.info("This is a worker mode info message.");
	logger.warn("This is a worker mode warning message.");
	logger.error("This is a worker mode error message.");
	logger.fatal("This is a worker mode fatal message.");

	// Close the logger
	logger.close().then(() => {
		console.log("Worker mode logging complete.");
	});
}

main();
