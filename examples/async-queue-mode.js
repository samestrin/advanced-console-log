/**
 * Async-Queue Mode Example
 * Demonstrates logging in async-queue mode.
 */

const ACL = require("../index");

// Create an instance of ACL in async-queue mode
const logger = ACL.getInstance({
	mode: "async-queue",
	outputFilename: "async-queue-app.log",
	includeTimestamps: true,
	queueBatchSize: 10, // Number of logs to batch
	flushInterval: 1000, // Flush interval in milliseconds
});

async function main() {
	// Log multiple messages
	for (let i = 0; i < 50; i++) {
		await logger.info(`Async-Queue log message ${i + 1}`);
	}

	// Flush any remaining logs and close the logger
	await logger.flushFileLogs();
	await logger.close();
}

main()
	.then(() => console.log("Async-Queue logging complete."))
	.catch((err) => {
		console.error("Error during async-queue logging:", err);
		logger.close();
	});
