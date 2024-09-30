const ACL = require("../index");

// Create an ACL instance with file logging and suppressed console logs
const logger = new ACL({
	logLevel: 0, // Suppress console logs
	outputFilename: "app.log", // Specify the file to save logs
	outputFilenameLogLevel: 1, // Log all levels to file
	includeTimestamps: true, // Include timestamps in the logs
	includeCallerInfo: false, // Optional: disable caller info if not needed
	includeMemoryUsage: false, // Optional: disable memory usage if not needed
});

// Use the logger as usual
logger.debug("This is a debug message");
logger.log("This is a regular message");
logger.info("This is an info message");
logger.warn("This is a warning message");
logger.error("This is an error message");
logger.fatal("This is a fatal message");

// The above messages will be saved in `app.log` but will not be displayed in the console.
