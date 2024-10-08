/**
 * Stack Trace Example
 * Demonstrates using the trace method to log the current stack trace.
 */

const ACL = require("../index");

// Create an instance of ACL
const logger = ACL.getInstance();

function functionA() {
	functionB();
}

function functionB() {
	functionC();
}

function functionC() {
	logger.trace();
}

function main() {
	functionA();
}

main();
