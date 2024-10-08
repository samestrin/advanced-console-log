const { parentPort, workerData } = require("worker_threads");
const FileLogger = require("../core/FileLogger");
const fileLogger = new FileLogger(workerData);
let pendingMessages = 0;
let closeSignalReceived = false;
let shutdownInProgress = false;

/**
 * Handles incoming messages from the parent thread.
 * @param {string} message - The message received from the main thread.
 */
parentPort.on("message", async (message) => {
	if (message === "close") {
		closeSignalReceived = true;
		await flushPendingMessagesAndExit();
		sendClosedSignal();
	} else {
		pendingMessages++;
		await fileLogger.writeToFileAsync(message);
		pendingMessages--;
		parentPort.postMessage("processed");
		sendClosedSignalIfNeeded();
	}
});

/**
 * Checks if the worker can send a "closed" signal to the parent.
 * Sends the "closed" signal if all messages have been processed and a close request was received.
 */
function sendClosedSignalIfNeeded() {
	if (closeSignalReceived && pendingMessages === 0) {
		sendClosedSignal();
	}
}

/**
 * Sends the "closed" signal to the main thread to indicate that the worker has finished processing all messages.
 */
function sendClosedSignal() {
	parentPort.postMessage("closed");
}

/**
 * Waits for all pending messages to be processed before exiting.
 * Uses an asynchronous loop to periodically check the pending message count.
 * @returns {Promise<void>} A promise that resolves when all pending messages are processed.
 */
async function flushPendingMessagesAndExit() {
	while (pendingMessages > 0) {
		await new Promise((resolve) => setImmediate(resolve)); // Non-blocking check
	}
}

/**
 * Handles the shutdown process for the worker, ensuring all pending messages are processed.
 * @param {string} reason - The reason for triggering the shutdown (e.g., uncaughtException or unhandledRejection).
 */
function handleShutdown(reason) {
	if (shutdownInProgress) return;
	shutdownInProgress = true;
	flushPendingMessagesAndExit().then(sendClosedSignal);
}

// Global error handlers to manage unexpected errors and promise rejections
process.on("uncaughtException", (err) =>
	handleShutdown(`Uncaught Exception: ${err.message}`)
);
process.on("unhandledRejection", (reason) =>
	handleShutdown(`Unhandled Rejection: ${reason}`)
);
