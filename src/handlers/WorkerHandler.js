const path = require("path");
const { EventEmitter } = require("events");

/**
 * Class responsible for managing worker thread communication and handling log messages.
 */
class WorkerHandler extends EventEmitter {
	/**
	 * Initializes a new instance of WorkerHandler.
	 * @param {Object} config - Configuration options for the worker handler.
	 * @param {string} [config.workerScriptPath] - Optional path to the worker script.
	 * @param {string} config.outputFilename - Log file name for output.
	 * @param {number} [config.maxLogFileSizeMB=10] - Maximum size of the log file in MB.
	 * @param {number} [config.maxLogFiles=5] - Maximum number of rotated log files to keep.
	 * @param {boolean} [config.includeTimestamps=true] - Whether to include timestamps in log messages.
	 */
	constructor(config) {
		super();
		this.config = { ...config };
		this.workerScriptPath =
			this.config.workerScriptPath ||
			path.join(__dirname, "../workers/logWorker.js");
		this.worker = null;
		this.pendingMessages = 0;
		this.isClosed = false; // Properly set to true only after shutdown is complete
		this.closeSignalSent = false; // Track if a close signal was already sent
		this.debug = false;
	}

	/**
	 * Initializes the worker thread and sets up event listeners for the worker.
	 */
	_initializeWorker() {
		const { Worker, isMainThread } = require("worker_threads");
		if (isMainThread) {
			this.worker = new Worker(this.workerScriptPath, {
				workerData: this.config,
			});

			this.worker.on("message", (msg) => this.handleWorkerMessage(msg));

			if (this.debug) {
				this.worker.on("error", (err) =>
					console.error(`Worker Error: ${err.message}`)
				);
				this.worker.on("exit", (code) =>
					console.log(`Worker exited with code ${code}`)
				);
			}
		}
	}

	/**
	 * Handles incoming messages from the worker thread.
	 * @param {string} msg - The message received from the worker.
	 */
	handleWorkerMessage(msg) {
		if (msg === "processed") {
			this.pendingMessages--;

			if (this.pendingMessages === 0 && this.closeSignalSent) {
				this.emit("drain");
			}
		} else if (msg === "closed") {
			this.isClosed = true; // Update the flag when shutdown is acknowledged
			this.emit("closed");
		}
	}

	/**
	 * Sends a log message to the worker thread.
	 * @param {string} message - The log message to be sent to the worker.
	 */
	logToWorker(message) {
		if (this.worker) {
			this.pendingMessages++;
			this.worker.postMessage(message);
		}
	}

	/**
	 * Initiates the close process for the worker, ensuring all messages are processed and the worker is terminated.
	 * @returns {Promise<void>} - Resolves when the worker has been successfully closed.
	 */
	async closeWorker() {
		this.closeSignalSent = true; // Indicate that the close signal is being handled

		// Wait for pending messages to be processed
		await this.waitForPendingMessages();

		if (this.worker) {
			this.isClosed = false; // Reset isClosed until worker responds
			this.worker.postMessage("close");

			// Wait for the worker to acknowledge closure
			await this.waitForWorkerClosure();

			await this.worker.terminate();

			this.worker = null;
		}
	}

	/**
	 * Waits for all pending messages to be processed before continuing.
	 * @returns {Promise<void>} - Resolves when there are no more pending messages.
	 */
	waitForPendingMessages() {
		if (this.pendingMessages === 0) return Promise.resolve();
		return new Promise((resolve) => this.once("drain", resolve));
	}

	/**
	 * Waits for the worker to acknowledge its shutdown before proceeding.
	 * @returns {Promise<void>} - Resolves when the worker has acknowledged the "closed" signal.
	 */
	waitForWorkerClosure() {
		if (this.isClosed) return Promise.resolve();
		return new Promise((resolve) => this.once("closed", resolve));
	}
}

module.exports = WorkerHandler;
