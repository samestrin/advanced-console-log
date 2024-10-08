/**
 * Generate Report Example
 * Demonstrates how to generate a log report.
 */

const ACL = require("../index");

// Create an instance of ACL with report generation enabled
const logger = new ACL({
	generateReport: true,
});

function main() {
	logger.debug("Debug message");
	logger.log("Log message");
	logger.info("Info message");
	logger.warn("Warning message");
	logger.error("Error message");
	logger.fatal("Fatal message");

	// Generate and display the report
	logger.report();
}

main();
