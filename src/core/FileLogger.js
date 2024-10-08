const fs = require("fs");
const path = require("path");
const { getCurrentTimestamp } = require("../lib/timestampUtils");

/**
 * FileLogger class for managing logging to files with features such as file rotation.
 */
class FileLogger {
	/**
	 * Creates an instance of FileLogger.
	 *
	 * @param {Object} config - Configuration options for the logger.
	 * @param {string} config.outputFilename - Path to the output log file.
	 * @param {number} [config.maxLogFileSizeMB=10] - Maximum size of a log file in MB before rotation.
	 * @param {number} [config.maxLogFiles=5] - Maximum number of log files to retain.
	 * @param {boolean} [config.writeHeader=true] - Flag to determine if a header should be written at the beginning of a new log session.
	 * @param {Function} [errorHandler=console.error] - Function to handle errors.
	 * @constructor
	 */
	constructor(
		{
			outputFilename,
			maxLogFileSizeMB = 10,
			maxLogFiles = 5,
			writeHeader = true,
		} = {},
		errorHandler = console.error
	) {
		this.outputFilename = outputFilename;
		this.maxLogFileSizeMB = maxLogFileSizeMB;
		this.maxLogFiles = maxLogFiles;
		this.errorHandler = errorHandler;
		this.currentFileSize = 0; // Cached file size in bytes
		this.rotatedFiles = []; // Cache of rotated log files
		this.directoryExists = false; // Cache directory existence
		this.logStream = null; // Log stream for buffered writes
		this.isRotating = false; // Flag to track if a rotation is in progress

		// Initialize log file and stream
		this._initializeLogFileAndStream();

		if (writeHeader !== false) {
			this.writeHeader();
		}

		// Update current file size and populate rotatedFiles cache initially
		this._initializeCurrentFileSize();
		this._initializeRotatedFilesCache();
	}

	/**
	 * Initializes the log file and writable stream, ensuring the file and directory exist.
	 * Uses a cached value to avoid redundant directory existence checks.
	 *
	 * @private
	 */
	_initializeLogFileAndStream() {
		try {
			const logDir = path.dirname(this.outputFilename);

			// Ensure directory exists
			if (!this.directoryExists) {
				if (!fs.existsSync(logDir)) {
					fs.mkdirSync(logDir, { recursive: true });
				}
				this.directoryExists = true;
			}

			// Create or open the log file and initialize the stream
			if (!fs.existsSync(this.outputFilename)) {
				fs.writeFileSync(this.outputFilename, "", "utf8");
				this.currentFileSize = 0; // Reset size for a new file
			}

			this.logStream = fs.createWriteStream(this.outputFilename, {
				flags: "a",
			});
			this.logStream.on("error", (err) =>
				this.errorHandler(`Log stream error: ${err.message}`)
			);
		} catch (err) {
			this.errorHandler(
				`Failed to initialize log file or stream: ${err.message}`
			);
		}
	}

	/**
	 * Initializes the current file size cache by checking the existing file size.
	 * This is called once at the beginning to sync the cache with the actual file size.
	 *
	 * @private
	 */
	_initializeCurrentFileSize() {
		try {
			const { size } = fs.statSync(this.outputFilename);
			this.currentFileSize = size;
		} catch (err) {
			if (err.code !== "ENOENT") {
				this.errorHandler(`Error initializing log file size: ${err.message}`);
			} else {
				this.currentFileSize = 0; // File doesn't exist, set size to 0
			}
		}
	}

	/**
	 * Initializes the rotated files cache by reading the directory once.
	 * Populates `this.rotatedFiles` with existing rotated files.
	 *
	 * @private
	 */
	_initializeRotatedFilesCache() {
		try {
			const logDir = path.dirname(this.outputFilename);
			const baseFilename = path.basename(
				this.outputFilename,
				path.extname(this.outputFilename)
			);
			const logFiles = fs
				.readdirSync(logDir)
				.filter(
					(file) => file.startsWith(baseFilename) && file.endsWith(".log")
				);
			this.rotatedFiles = logFiles;
		} catch (err) {
			this.errorHandler(
				`Error initializing rotated files cache: ${err.message}`
			);
		}
	}

	/**
	 * Writes a header to the log file indicating a new logging session.
	 *
	 * @throws {Error} Throws an error if unable to write to the log file.
	 */
	writeHeader() {
		const scriptName = require.main ? require.main.filename : process.argv[1];
		const header = `\n${getCurrentTimestamp(
			"MM-DD-YYYY HH:mm:ss.SSS"
		)} ${scriptName}
---------------------------------------------------------------------------------------------------------------\n\n`;
		try {
			this.logStream.write(header, "utf8");
			this._incrementFileSize(Buffer.byteLength(header, "utf8"));
		} catch (err) {
			this.errorHandler(
				`writeHeader failed: Unable to write header to log file - ${err.message}`
			);
		}
	}

	/**
	 * Increments the current file size, safely handling any ongoing rotations.
	 *
	 * @private
	 * @param {number} size - The size to increment in bytes.
	 */
	_incrementFileSize(size) {
		if (!this.isRotating) {
			this.currentFileSize += size;
		}
	}

	/**
	 * Synchronously writes a log message to the file.
	 *
	 * @param {string} message - Log message to write.
	 */
	writeToFile(message) {
		try {
			this.rotateLogFilesIfNeeded();
			this.logStream.write(message, "utf8");
			this._incrementFileSize(Buffer.byteLength(message, "utf8"));
		} catch (err) {
			this.errorHandler(`Failed to write to file (sync): ${err.message}`);
		}
	}

	/**
	 * Asynchronously writes a log message to the file.
	 *
	 * @param {string} message - Log message to write.
	 * @returns {Promise<void>} Returns a promise that resolves when the log is written.
	 */
	async writeToFileAsync(message) {
		try {
			await this.rotateLogFilesIfNeededAsync();

			await new Promise((resolve, reject) => {
				const canWrite = this.logStream.write(message, "utf8", (err) => {
					if (err) {
						this.errorHandler(
							`writeToFileAsync: Error writing to file - ${err.message}`
						);
						return reject(err);
					}
					this._incrementFileSize(Buffer.byteLength(message, "utf8"));
					resolve();
				});

				if (!canWrite) {
					this.logStream.once("drain", () => resolve());
				}
			});
		} catch (err) {
			this.errorHandler(`Failed to write to file (async): ${err.message}`);
		}
	}

	/**
	 * Rotates log files if the current log file size exceeds the maxLogFileSizeMB limit.
	 */
	rotateLogFilesIfNeeded() {
		const fileSizeInMB = this.currentFileSize / (1024 * 1024);
		if (fileSizeInMB >= this.maxLogFileSizeMB) {
			this._rotateFiles();
		}
	}

	/**
	 * Asynchronous version of rotateLogFilesIfNeeded.
	 *
	 * @returns {Promise<void>} Returns a promise that resolves when the rotation is complete.
	 */
	async rotateLogFilesIfNeededAsync() {
		const fileSizeInMB = this.currentFileSize / (1024 * 1024);
		if (fileSizeInMB >= this.maxLogFileSizeMB) {
			await this._rotateFilesAsync();
		}
	}

	/**
	 * Rotates log files by renaming the current file and maintaining retention policy.
	 *
	 * @private
	 */
	_rotateFiles() {
		const logDir = path.dirname(this.outputFilename);
		const baseFilename = path.basename(
			this.outputFilename,
			path.extname(this.outputFilename)
		);
		const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
		const rotatedFilename = `${baseFilename}-${timestamp}.log`;

		if (!this.directoryExists) {
			this._createLogFileIfNotExists();
		}

		fs.renameSync(this.outputFilename, path.join(logDir, rotatedFilename));
		this.currentFileSize = 0;

		this.rotatedFiles.push(rotatedFilename);
		this._enforceRetention();
	}

	/**
	 * Asynchronous version of _rotateFiles.
	 * Rotates log files by renaming the current file and maintaining retention policy.
	 *
	 * @private
	 */
	async _rotateFilesAsync() {
		const logDir = path.dirname(this.outputFilename);
		const baseFilename = path.basename(
			this.outputFilename,
			path.extname(this.outputFilename)
		);
		const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
		const rotatedFilename = `${baseFilename}-${timestamp}.log`;

		try {
			if (!this.directoryExists) {
				// Ensure the log directory exists before rotating files
				await fs.promises.mkdir(logDir, { recursive: true });
				this.directoryExists = true;
			}

			// Rename the current log file to the rotated filename
			await fs.promises.rename(
				this.outputFilename,
				path.join(logDir, rotatedFilename)
			);

			// Reset the current file size after rotation
			this.currentFileSize = 0;

			// Add the new rotated file to the cache
			this.rotatedFiles.push(rotatedFilename);

			// Enforce file retention policy asynchronously
			await this._enforceRetentionAsync();
		} catch (err) {
			this.errorHandler(
				`Failed to rotate log files asynchronously: ${err.message}`
			);
		}
	}

	/**
	 * Enforces log file retention by deleting older files beyond maxLogFiles limit.
	 * Uses the internal `rotatedFiles` cache instead of reading the directory.
	 *
	 * @private
	 */
	_enforceRetention() {
		while (this.rotatedFiles.length > this.maxLogFiles) {
			const oldestFile = this.rotatedFiles.shift(); // Remove the oldest file from the cache
			try {
				fs.unlinkSync(path.join(path.dirname(this.outputFilename), oldestFile));
			} catch (err) {
				this.errorHandler(`Failed to delete old log file: ${err.message}`);
			}
		}
	}

	/**
	 * Asynchronous version of _enforceRetention.
	 *
	 * @private
	 * @returns {Promise<void>} Returns a promise that resolves when retention is enforced.
	 */
	async _enforceRetentionAsync() {
		while (this.rotatedFiles.length > this.maxLogFiles) {
			const oldestFile = this.rotatedFiles.shift(); // Remove the oldest file from the cache
			try {
				await fs.promises.unlink(
					path.join(path.dirname(this.outputFilename), oldestFile)
				);
			} catch (err) {
				this.errorHandler(
					`Failed to delete old log file (async): ${err.message}`
				);
			}
		}
	}

	/**
	 * Flushes batched logs to the file using the log stream.
	 */
	flush() {
		if (this.outputFileBatchOutput && this.batchedLogs.length > 0) {
			const logData = `${this.batchedLogs.join("\n")}\n`;
			try {
				this._writeToStreamSync(logData); // Use a sync version of the write method
				this.batchedLogs.length = 0; // Clear batched logs after successful write
			} catch (err) {
				this.errorHandler(`Failed to flush logs: ${err.message}`);
			}
		}
	}

	/**
	 * Synchronously writes data to the log stream.
	 *
	 * @private
	 * @param {string} data - The log data to write.
	 */
	_writeToStreamSync(data) {
		this.logStream.write(data, "utf8");
	}

	/**
	 * Asynchronously flushes batched logs to the file using the log stream.
	 *
	 * @returns {Promise<void>} Returns a promise that resolves when all batched logs are written.
	 */
	async flushAsync() {
		if (this.outputFileBatchOutput && this.batchedLogs.length > 0) {
			const logData = `${this.batchedLogs.join("\n")}\n`;

			try {
				await this._writeToStream(logData);
				this.batchedLogs.length = 0; // Clear batched logs after successful write
			} catch (err) {
				this.errorHandler(`Failed to flush logs: ${err.message}`);
			}
		}
	}

	/**
	 * Writes data to the log stream as a promise.
	 *
	 * @private
	 * @param {string} data - The log data to write.
	 * @returns {Promise<void>} Resolves when the data is written successfully.
	 */
	_writeToStream(data) {
		return new Promise((resolve, reject) => {
			this.logStream.write(data, "utf8", (err) => {
				if (err) {
					reject(err);
				} else {
					resolve();
				}
			});
		});
	}

	/**
	 * Closes the file logger and the writable stream.
	 * Ensures all pending writes are completed before closing the stream.
	 */
	close() {
		this.flush();

		if (this.flushTimer) {
			clearInterval(this.flushTimer);
			this.flushTimer = null;
		}

		if (this.logStream) {
			this.logStream.end();
			this._waitForStreamFinish(this.logStream)
				.then(() => {
					this.logStream = null;
				})
				.catch((err) => {
					this.errorHandler(`Failed to close log stream: ${err.message}`);
				});
		}
	}

	/**
	 * Asynchronously closes the file logger and the writable stream.
	 * Ensures all pending writes are completed before closing the stream.
	 *
	 * @returns {Promise<void>} Returns a promise that resolves when the logger is closed.
	 */
	async closeAsync() {
		await this.flushAsync();

		if (this.flushTimer) {
			clearInterval(this.flushTimer);
			this.flushTimer = null;
		}

		if (this.logStream) {
			this.logStream.end();
			try {
				await this._waitForStreamFinish(this.logStream);
				this.logStream = null;
			} catch (err) {
				this.errorHandler(`Failed to close log stream: ${err.message}`);
			}
		}
	}

	/**
	 * Helper method to convert a stream's finish event to a promise.
	 * Ensures that we properly wait for the stream to finish before proceeding.
	 *
	 * @private
	 * @param {stream.Writable} stream - The writable stream to wait on.
	 * @returns {Promise<void>} Resolves when the stream's 'finish' event is emitted.
	 */
	_waitForStreamFinish(stream) {
		return new Promise((resolve, reject) => {
			stream.on("finish", resolve);
			stream.on("error", reject);
		});
	}
}

module.exports = FileLogger;
