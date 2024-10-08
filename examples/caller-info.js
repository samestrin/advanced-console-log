/**
 * Caller Information Example
 * Demonstrates including caller information in log messages.
 */

const ACL = require("../index");

// Create an instance of ACL with caller information enabled
const logger = ACL.getInstance({
	includeCallerInfo: true,
	callerInfoLevel: 1, // Include caller info for all log levels
	includeInlineCallerInfo: true,
	inlineCallerInfoLevel: 3,
});

function helperFunction() {
	logger.info("This is a log from helperFunction.");
}

function main() {
	logger.debug("Debug message with caller info.");
	helperFunction();
	logger.error("Error message with caller info.");
}

main();
