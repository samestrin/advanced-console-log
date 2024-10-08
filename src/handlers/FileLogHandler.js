const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

class FileLogHandler {
	constructor(
		fileLogger,
		mode,
		queueBatchSize = 50,
		flushInterval = 1000,
		errorHandler = console.error
	) {
		this.fileLogger = fileLogger;
		this.mode = mode;
		this.queueBatchSize = queueBatchSize;
		this.flushInterval = flushInterval;
		this.logQueue = [];
		this.isFlushing = false;
		this.isShuttingDown = false;
		this.isClosed = false;
		this.flushPromise = null;

		this.errorHandler = errorHandler;

		if (mode === "async-queue") {
			this.flushPromise = this.setupAsyncQueueMode();
		}
	}

	async setupAsyncQueueMode() {
		while (!this.isShuttingDown) {
			if (this.logQueue.length > 0) {
				await this.flushQueue();
			}
			await delay(this.flushInterval);
		}
	}

	enqueueLog(message) {
		if (this.isShuttingDown || this.isClosed) return;

		this.logQueue.push(message);

		if (this.logQueue.length >= this.queueBatchSize) {
			this.flushQueue();
		}
	}

	async flushQueue() {
		if (this.isFlushing || this.isClosed || this.logQueue.length === 0) return;
		this.isFlushing = true;

		try {
			const logData = `${this.logQueue.join("")}\n`;

			this.logQueue = [];

			if (this.mode === "async" || this.mode === "async-queue") {
				await this.writeToFileAsync(logData); // Ensure async writing completes
			} else {
				this.fileLogger.writeToFile(logData);
			}
		} catch (err) {
			this.errorHandler(
				`FileLogHandler: Failed to flush log queue: ${err.message}`
			);
		} finally {
			this.isFlushing = false;
		}
	}

	async writeToFileAsync(logData) {
		try {
			await new Promise((resolve, reject) => {
				this.fileLogger.logStream.write(logData, "utf8", (err) => {
					if (err) {
						this.errorHandler(
							`writeToFileAsync: Error writing to file - ${err.message}`
						);
						reject(err);
					} else {
						resolve();
					}
				});
			});
		} catch (err) {
			this.errorHandler("writeToFileAsync: Failed to write to file", err);
		}
	}

	async close() {
		if (this.isShuttingDown || this.isClosed) return;

		this.isShuttingDown = true;

		if (this.flushPromise) await this.flushPromise;

		await this.flushQueue();

		this.isClosed = true;
	}

	log(message) {
		if (this.isClosed) {
			return;
		}
		if (this.mode === "async") {
			this.fileLogger.writeToFileAsync(message);
		} else if (this.mode === "async-queue") {
			this.enqueueLog(message);
		} else {
			this.fileLogger.writeToFile(message);
		}
	}
}

module.exports = FileLogHandler;
