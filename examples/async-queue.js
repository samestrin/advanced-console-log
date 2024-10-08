const ACL = require("../index");
const logger = ACL.getInstance({
	mode: "async-queue",
	outputFilename: "async-queue-app.log",
	maxLogFileSizeMB: 5,
	maxLogFiles: 3,
	includeTimestamps: true,
	queueBatchSize: 10,
	flushInterval: 50,
});

async function subFunctionQueue() {
	await logger.log(
		true,
		"This is a regular log message, created by subFunctionQueue()."
	);
}

async function main() {
	await logger.debug("This is a queued debug message.");
	await logger.log("This is a regular queued log message.");
	await subFunctionQueue();
	await logger.info("This is an informational queued message.");
	await logger.warn("This is a queued warning message.");
	await logger.error("This is a queued error message.");
	await logger.fatal("This is a queued fatal message.");

	await logger.flushFileLogs(); // Ensure all logs are flushed before the script ends.
}

main()
	.then(async () => {
		console.log("Logging complete. Exiting script...");
		await logger.close(); // Wait for logger to finish.
		console.log("Logger closed. Exiting...");
	})
	.catch(async (err) => {
		console.error("Error during logging:", err);
		await logger.close(); // Close the logger on error.
		console.log("Logger closed after error.");
	});
