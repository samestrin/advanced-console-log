/**
 * File Rotation Example
 * Demonstrates file rotation and retention strategy.
 */

const ACL = require("../index");

// Create an instance of ACL with file rotation settings
const logger = ACL.getInstance({
	outputFilename: "rotated-app.log",
	maxLogFileSizeMB: 1, // Rotate log file after it reaches 1 MB
	maxLogFiles: 3, // Retain up to 3 log files
});

function main() {
	// Generate a large number of log messages to exceed file size limit
	for (let i = 0; i < 10000; i++) {
		logger.info(`Log message ${i + 1}`);
	}
}

main();
