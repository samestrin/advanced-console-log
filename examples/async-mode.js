/**
 * Async Mode Example
 * Demonstrates logging in async mode.
 */

const ACL = require("../index");

// Create an instance of ACL in async mode
const logger = ACL.getInstance({
	mode: "async",
	outputFilename: "async-app.log",
	includeTimestamps: true,
});

async function main() {
	await logger.debug("This is an async debug message.");
	await logger.log("This is an async log message.");
	await logger.info("This is an async info message.");
	await logger.warn("This is an async warning message.");
	await logger.error("This is an async error message.");
	await logger.fatal("This is an async fatal message.");
}

main()
	.then(() => logger.close())
	.catch((err) => {
		console.error("Error in main function:", err);
		logger.close();
	});
