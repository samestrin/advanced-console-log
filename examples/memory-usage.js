/**
 * Memory Usage Example
 * Demonstrates tracking and displaying memory usage.
 */

const ACL = require("../index");

// Create an instance of ACL with memory usage tracking enabled
const logger = ACL.getInstance({
	includeMemoryUsage: true,
	memoryDisplayMode: 3, // Display both MB and percentage
	memoryUpdateInterval: 1000,
});

function main() {
	logger.info("Starting application.");

	// Simulate some memory usage
	const largeArray = new Array(1000000).fill("data");

	logger.info("Memory usage after creating large array.");

	// Clean up
	largeArray.length = 0;
	logger.info("Memory usage after clearing large array.");
}

main();
