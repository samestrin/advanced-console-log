// src/acl.js

/**
 * ACL class for logging messages with various levels and features.
 * @module ACL
 */

const util = require("util");
const path = require("path");
const { COLORS } = require("../lib/constants");
const { formatArgs, stripAnsiCodes } = require("../lib/formatUtils");
const {
	getTotalHeapSizeLimit,
	getFormattedMemoryUsage,
} = require("../lib/memoryUtils");
const { getCurrentTimestamp } = require("../lib/timestampUtils");

let FileLogger, FileLogHandler, TimerUtility, WorkerHandler, ReportGenerator;

/**
 * Class representing a logger with multiple features like console/file logging,
 * colored output, memory usage tracking, caller info, and more.
 */
class ACL {
	/**
	 * Creates an instance of the Advanced Console Logger.
	 * @param {Object} config - Configuration options for the logger.
	 * @param {string} config.mode - Logging mode ("regular", "async", "async-queue", or "worker").
	 * @param {number} [config.logLevel=1] - Console log level (0 = debug, 5 = fatal).
	 * @param {boolean} [config.includeTimestamps=true] - Include timestamps in logs.
	 * @param {boolean} [config.includeMemoryUsage=false] - Include memory usage info.
	 * @param {number} [config.memoryUpdateInterval=1000] - Frequency of memory checks in ms
	 * @param {number} [config.memoryDisplayMode=1] - Memory display format (1 = MB, 2 = %, 3 = both).
	 * @param {boolean} [config.includeCallerInfo=false] - Include caller info in logs.
	 * @param {number} [config.callerInfoLevel=2] - Log level for including caller info.
	 * @param {number} [config.callerInfoDisplayMode=1] - Display mode for caller info.
	 * @param {boolean} [config.includeInlineCallerInfo=false] - Include inline caller info in logs.
	 * @param {number} [config.inlineCallerInfoLevel=1] - Log level for inline caller info.
	 * @param {boolean} [config.includeStackTrace=false] - Include stack trace for errors.
	 * @param {string} [config.timestampFormat="HH:mm:ss.SSS"] - Timestamp format.
	 * @param {Object} [config.color] - Custom colors for log levels.
	 * @param {boolean} [config.extraSpace=false] - Adds extra space after each log message.
	 * @param {boolean} [config.generateReport=false] - Generate a report of log usage.
	 * @param {boolean} [config.terminateOnFatal=false] - Terminate the process on fatal error.
	 * @param {string} [config.outputFilename=null] - File path for file logging.
	 * @param {number} [config.maxLogFileSizeMB=10] - Maximum size of log files in MB.
	 * @param {number} [config.maxLogFiles=5] - Maximum number of retained log files.
	 * @param {boolean} [config.outputFileBatchOutput=false] - Batch output to file.
	 * @param {number} [config.outputFileBatchOutputSize=25] - Size of batch before writing to file.
	 * @param {boolean} [config.enableTimers=false] - Enables timer functionality if set to true.
	 */
	constructor(config = {}) {
		this.mode = config.mode || "regular"; // Set default mode
		this.enableExitHandlers = config.enableExitHandlers || false;
		this.logLevel = typeof config.logLevel === "number" ? config.logLevel : 1;
		this.includeTimestamps = config.includeTimestamps !== false;
		this.includeMemoryUsage = config.includeMemoryUsage || false;
		this.memoryDisplayMode = config.memoryDisplayMode ?? 1;
		this.includeCallerInfo = config.includeCallerInfo || false;
		this.callerInfoLevel = config.callerInfoLevel ?? 2;
		this.callerInfoDisplayMode = config.callerInfoDisplayMode ?? 1;
		this.includeInlineCallerInfo = !!config.includeInlineCallerInfo;
		this.inlineCallerInfoLevel = config.inlineCallerInfoLevel ?? 1;
		this.includeStackTrace = !!config.includeStackTrace;
		this.timestampFormat = config.timestampFormat || "HH:mm:ss.SSS";
		this.color = {
			debug: config.color?.debug || COLORS.CYAN,
			log: config.color?.log || COLORS.GREEN,
			info: config.color?.info || COLORS.LIGHT_GREEN,
			warn: config.color?.warn || COLORS.YELLOW,
			error: config.color?.error || COLORS.LIGHT_RED,
			fatal: config.color?.fatal || COLORS.MAGENTA,
			caller: config.color?.caller || COLORS.LIGHT_MAGENTA,
			inlineCaller: COLORS.LIGHT_CYAN,
			position: COLORS.CYAN,
		};
		this.space = config.extraSpace ? "\n" : "";
		this.generateReport = !!config.generateReport;
		this.terminateOnFatal = !!config.terminateOnFatal;

		this.memoryUpdateInterval = config.memoryUpdateInterval || 1000;

		this.firstShown = false;
		this.timers = {};
		this.logEventCount = 0;
		this.reportData = {
			debug: 0,
			log: 0,
			info: 0,
			warn: 0,
			error: 0,
			fatal: 0,
		};
		this.memoryUsage = "";
		this.cwd = process.cwd();
		this.currentFileName = __filename.replace(this.cwd, "").replace(/^\\/, "");

		if (this.includeMemoryUsage) {
			this._totalHeapSizeLimit = getTotalHeapSizeLimit();
			this.startMemoryUsageUpdates();
		}

		// Lazy load FileLogger when file logging is needed
		if (config.outputFilename) {
			this.outputFilename = config.outputFilename;
			this.outputFileLogLevel =
				typeof config.outputFileLogLevel === "number"
					? config.outputFileLogLevel
					: 1;
			this._initializeFileLogger(config);

			// Set up different modes
			switch (this.mode) {
				case "async":
					//case "async-queue":
					this.aliasSyncToAsyncMethods();
					break;
				case "worker":
					this.setupWorkerMode(config);
					break;
				default:
					break;
			}
		}

		if (this.generateReport) {
			this._initializeReportGenerator();
		}

		// Lazy initialization for timers
		this.enableTimers = !!config.enableTimers;
		this.timers = null;

		if (this.enableTimers) {
			this._initializeTimers();
		}

		if (this.enableExitHandlers) {
			// Register process exit handlers for automatic cleanup
			this._registerExitHandlers();
		}

		// Use FinalizationRegistry to monitor for garbage collection
		const registry = new FinalizationRegistry((heldValue) => {
			heldValue.cleanup(); // Automatically call cleanup when instance is GC'd
		});
		registry.register(this, { cleanup: () => this.close() });
	}

	/**
	 * Dynamically loads methods and properties from the provided utility class into this instance.
	 * @param {class} SupportClass - Class containing methods and properties to be loaded.
	 */
	loadMethodsAndProperties(SupportClass) {
		const supportClass = new SupportClass();

		// Get all properties and methods from the utility class, including inherited ones
		Object.getOwnPropertyNames(SupportClass.prototype).forEach(
			(propertyName) => {
				if (propertyName !== "constructor") {
					// Check if it's a method and bind it
					if (typeof supportClass[propertyName] === "function") {
						this[propertyName] = supportClass[propertyName].bind(this);
					}
				}
			}
		);

		// Get all instance variables from the utility class
		Object.keys(supportClass).forEach((variableName) => {
			if (typeof supportClass[variableName] !== "function") {
				this[variableName] = supportClass[variableName];
			}
		});
	}

	_initializeReportGenerator() {
		if (!ReportGenerator) {
			ReportGenerator = require("./ReportGenerator");
		}
		this.reportGenerator = this.generateReport ? new ReportGenerator() : null;
	}

	/**
	 * Initializes the FileLogger instance lazily and sets up appropriate mode configurations.
	 * Handles both synchronous and asynchronous modes, ensuring only one logger setup.
	 *
	 * @param {Object} config - Logger configuration.
	 */
	_initializeFileLogger(config) {
		if (!FileLogger) {
			FileLogger = require("./FileLogger"); // Lazy load the FileLogger class
		}
		if (!FileLogHandler) {
			FileLogHandler = require("../handlers/FileLogHandler"); // Lazy load the FileLogHandler class
		}

		// Instantiate the FileLogger and FileLogHandler with the provided configurations
		this.fileLogger = new FileLogger(config, (errorMessage) =>
			this.error(true, errorMessage)
		);

		// Create the appropriate handler based on the current mode
		this.fileLogHandler = new FileLogHandler(
			this.fileLogger,
			this.mode,
			config.queueBatchSize || 10,
			config.flushInterval || 50, // Added to handle default flush interval
			(errorMessage) => this.error(true, errorMessage)
		);

		// Adjust logging methods for async and queue modes
		if (this.mode === "async" || this.mode === "async-queue") {
			this.aliasSyncToAsyncMethods();
		}
	}

	logWithFileLogger(message) {
		if (this.fileLogHandler) {
			this.fileLogHandler.log(message);
		}
	}

	/**
	 * Set up the worker-based logging mode using worker_threads.
	 * @param {object} config - Configuration for worker mode.
	 */
	setupWorkerMode(config) {
		if (!WorkerHandler) {
			WorkerHandler = require("../handlers/WorkerHandler"); // Lazy load the WorkerHandler class
		}

		// Ensure the config object is complete and has all necessary fields
		const completeConfig = {
			outputFilename: config.outputFilename || "default.log",
			maxLogFileSizeMB: config.maxLogFileSizeMB || 5,
			maxLogFiles: config.maxLogFiles || 3,
			includeTimestamps: config.includeTimestamps !== false,
			writeHeader: false,
			...config, // Include any other properties
		};

		// Initialize the worker with the complete configuration
		this.workerHandler = new WorkerHandler(completeConfig);
		this.workerHandler._initializeWorker();
	}

	/**
	 * Log messages using worker threads.
	 * @param {string} message - The log message to send to the worker.
	 */
	logWithWorker(message) {
		if (this.workerHandler) {
			this.workerHandler.logToWorker(message);
		} else {
			console.error("Worker not _initialized. Cannot log message.");
		}
	}

	/**
	 * Flushes any pending logs in the FileLogger.
	 * Ensures that all batched or queued logs are written out based on the logging mode.
	 * Uses synchronous or asynchronous flushing based on `mode`
	 */
	async flushFileLogs() {
		if (this.fileLogHandler) {
			try {
				if (this.mode === "async" || this.mode === "async-queue") {
					await this.fileLogHandler.flushQueue(); // Ensure async queue is flushed
				} else {
					this.fileLogger.flush(); // Synchronous flush
				}
			} catch (err) {
				this.error(true, `ACL: Error flushing file logs: ${err.message}`);
			}
		}
	}

	/**
	 * Closes the FileLogger and the FileLogHandler, ensuring all pending logs are written.
	 * Uses synchronous or asynchronous closing based on the logging mode.
	 * This method should be the only one handling FileLogger closure to avoid conflicts.
	 */
	async closeFileLogger() {
		if (this.fileLogHandler) {
			try {
				await this.fileLogHandler.close(); // Wait for the handler to close properly
			} catch (err) {
				this.error(true, `ACL: Error closing FileLogHandler: ${err.message}`);
			}
			this.fileLogHandler = null; // Reset handler reference after closing
		}

		if (this.fileLogger) {
			try {
				await this.fileLogger.closeAsync(); // Ensure all pending writes are flushed before closing
			} catch (err) {
				this.error(true, `ACL: Error closing FileLogger: ${err.message}`);
			}
			this.fileLogger = null; // Reset logger reference after closing
		}
	}

	/**
	 * Closes the ACL logger instance, ensuring all async operations and pending logs are completed.
	 * This method handles the complete shutdown process, including any FileLogger and Worker cleanup.
	 *
	 * @returns {Promise<void>} Resolves when the logger is fully closed.
	 */
	async close() {
		// Guard clause to prevent redundant close calls
		if (this.isClosing || this.isClosed) {
			return;
		}

		// Mark the logger as closing to prevent new logs from being processed
		this.isClosing = true;

		try {
			if (includeMemoryUsage) {
				this.stopMemoryUsageUpdates();
			}

			// Flush and close file logs if enabled
			if (this.fileLogHandler) {
				await this.flushFileLogs();
			}

			// Ensure proper shutdown of the file logger and log handler
			await this.closeFileLogger();

			// If using worker mode, shut down the worker properly
			if (this.workerHandler) {
				await this.workerHandler.closeWorker(); // Ensure worker cleanup
			}

			this.isClosed = true; // Mark as closed once all operations complete
		} catch (err) {
			console.error(`ACL: Error during close operation: ${err.message}`);
		} finally {
			this.isClosing = false; // Reset closing flag to prevent deadlocks
		}
	}

	// Automatically clean up on process exit or garbage collection
	_registerExitHandlers() {
		// Handle process exit events for automatic worker cleanup
		process.on("exit", () => {
			this.close();
		});

		process.on("SIGINT", () => {
			this.close();
			process.exit(); // Ensure a clean exit
		});

		process.on("uncaughtException", (err) => {
			console.error(`Uncaught Exception: ${err.message}`);
			this.close();
			process.exit(1); // Exit with failure
		});

		process.on("unhandledRejection", (reason, promise) => {
			console.error(`Unhandled Rejection at: ${promise} reason: ${reason}`);
			this.close();
			process.exit(1);
		});
	}

	/**
	 * Alias synchronous methods to their asynchronous counterparts if `useAsyncLogging` is enabled.
	 */
	aliasSyncToAsyncMethods() {
		this.debug = this.debugAsync;
		this.log = this.logAsync;
		this.info = this.infoAsync;
		this.warn = this.warnAsync;
		this.error = this.errorAsync;
		this.fatal = this.fatalAsync;
	}

	/**
	 * Retrieves the singleton instance of the Log.
	 * If the instance does not exist, it creates a new one with the provided configuration.
	 * @param {Object} config - Configuration object.
	 * @returns {Log} - The singleton instance of the Log.
	 */
	static getInstance(config, name = "default") {
		if (!ACL.instance) {
			ACL.instance = {};
		}

		if (!ACL.instance[name]) {
			ACL.instance[name] = new ACL(config);
		}
		return ACL.instance[name];
	}

	/**
	 * Retrieve caller information (file name, function name, line number, and column number).
	 * @returns {string} - Formatted caller information with indentation showing call hierarchy.
	 */
	getCallerInfo(displayMode = 1) {
		// Save the original prepareStackTrace function to restore later
		const originalPrepareStackTrace = Error.prepareStackTrace;

		// Override prepareStackTrace to get the stack as an array of call sites
		Error.prepareStackTrace = (err, stack) => stack;

		// Create a new error to capture the stack trace
		const err = new Error();

		// Get the stack trace
		const stack = err.stack;

		// Restore the original prepareStackTrace
		Error.prepareStackTrace = originalPrepareStackTrace;

		// Skip internal files (use a set to list them)
		const internalFiles = new Set([__filename]);

		let shouldLog = false;
		const formattedStack = [];
		let visibleFrameCount = 0;

		for (const frame of stack) {
			const callerFile = frame.getFileName();
			const callerFunction = frame.getFunctionName() || "anonymous function";
			const lineNumber = frame.getLineNumber();
			const columnNumber = frame.getColumnNumber();

			// Skip frames that do not have file names (e.g., internal calls)
			if (!callerFile) continue;

			// Skip internal files from the logger itself
			if (internalFiles.has(callerFile)) continue;

			// Set `shouldLog` when we're out of the internal logger files
			if (!shouldLog) shouldLog = true;

			// If still within internal files, skip this frame
			if (!shouldLog) continue;

			// Increment visible frame count for indentation
			visibleFrameCount++;

			// Shorten the file path by removing the current working directory
			const relativeFilePath = path.relative(this.cwd, callerFile);

			// Format the current stack frame based on display mode
			let formattedFrame;
			if (displayMode === 1) {
				// Regular display mode
				const indentation = "    ".repeat(visibleFrameCount);
				formattedFrame = `${indentation}File: ${relativeFilePath}\n${indentation}Function: ${callerFunction}\n${indentation}Line: ${lineNumber}, Column: ${columnNumber}\n`;
			} else {
				// Compressed display mode
				formattedFrame = `    ${callerFunction} (${relativeFilePath}:${lineNumber}:${columnNumber})`;
			}

			// Add formatted frame to the stack
			formattedStack.push(formattedFrame);
		}

		// Join the formatted stack frames into a single string
		return `\n\n${formattedStack.join("\n")}\n`;
	}

	/**
	 * Retrieve inline caller information based on the specified detail level.
	 * This method is now directly a part of the ACL class.
	 * @param {number} level - The detail level for the inline caller information.
	 * @returns {string} - Formatted inline caller information.
	 */
	getInlineCallerInfo(level = 1) {
		// Save the original prepareStackTrace function to restore later
		const originalPrepareStackTrace = Error.prepareStackTrace;

		// Override prepareStackTrace to get the stack as an array of call sites
		Error.prepareStackTrace = (err, stack) => stack;

		// Create a new error to capture the stack trace
		const err = new Error();

		// Get the stack trace
		const stack = err.stack;

		// Restore the original prepareStackTrace
		Error.prepareStackTrace = originalPrepareStackTrace;

		const internalFiles = [__filename]; // Use __filename to refer to the current class file

		for (const frame of stack) {
			const callerFile = frame.getFileName();

			// Skip frames that do not have file names (e.g., internal calls)
			if (!callerFile) continue;

			// Check if this file is one of the internal files and skip it if so
			if (
				internalFiles.some((internalFile) => callerFile.includes(internalFile))
			)
				continue;

			// We found the first external frame, get the caller info
			const callerFunction = frame.getFunctionName() || "anonymous function";
			const lineNumber = frame.getLineNumber();
			const columnNumber = frame.getColumnNumber();

			// Shorten the file path by removing the current working directory
			const relativeFilePath = require("path").relative(
				process.cwd(),
				callerFile
			);

			// Format based on the specified level
			switch (level) {
				case 1:
					return `${relativeFilePath}:`;
				case 2:
					return `${relativeFilePath} ${this.color.position}(${lineNumber}, ${columnNumber})${this.color.inlineCaller}:`;
				case 3:
					return `${relativeFilePath} ${this.color.position}(${lineNumber}, ${columnNumber})${this.color.inlineCaller} > ${callerFunction}:`;
				default:
					return "";
			}
		}

		// If no valid external frame is found, return an empty string
		return "";
	}

	/**
	 * Determine if a message should be logged to the console.
	 * @param {boolean} condition - The condition for logging.
	 * @param {number} level - The level of the log message.
	 * @returns {boolean} - Whether to log to console.
	 */
	shouldLogToConsole(condition, level) {
		if (typeof condition === "boolean" && !condition) {
			return false;
		}
		return level >= this.logLevel;
	}

	/**
	 * Determine if a message should be logged to the file.
	 * @param {boolean} condition - The condition for logging.
	 * @param {number} level - The level of the log message.
	 * @returns {boolean} - Whether to log to file.
	 */
	shouldLogToFile(condition, level) {
		if (
			!this.outputFilename ||
			(typeof condition === "boolean" && !condition)
		) {
			return false;
		}
		return level >= this.outputFileLogLevel;
	}

	/**
	 * Starts a timer to update memory usage at a regular interval.
	 */
	startMemoryUsageUpdates() {
		if (!this.memoryTimer && this.includeMemoryUsage) {
			this.memoryUsage = this.getFormattedMemoryUsage();

			this.memoryTimer = setInterval(() => {
				this.memoryUsage = this.getFormattedMemoryUsage();
			}, this.memoryUpdateInterval);
		}
	}

	/**
	 * Stops the memory usage updates when the logger is closed or memory tracking is disabled.
	 */
	stopMemoryUsageUpdates() {
		if (this.memoryTimer) {
			clearInterval(this.memoryTimer);
			this.memoryTimer = null;
		}
	}

	/**
	 * Determines and returns the formatted caller information based on the current configuration.
	 *
	 * @param {number} level - The log level of the current message.
	 * @returns {string} The formatted caller information to be included in the log.
	 */
	getFormattedCallerInfo(level) {
		if (this.includeCallerInfo && level >= this.callerInfoLevel) {
			return this.getCallerInfo();
		}

		return "";
	}

	getLogLevelName(level) {
		switch (level) {
			case 0:
				return "DEBUG";
			case 1:
				return "LOG";
			case 2:
				return "INFO";
			case 3:
				return "WARN";
			case 4:
				return "ERROR";
			case 5:
				return "FATAL";
			default:
				return "UNKNOWN";
		}
	}

	/**
	 * Log a message to the console and/or file based on the provided conditions and levels.
	 * @param {string} color - Message color for console output.
	 * @param {boolean} [condition=true] - Condition to determine if the message should be logged.
	 * @param {number} level - Log level for the message.
	 * @param {...any} args - Arguments for the log message.
	 */
	logWithColorAndCondition(color, condition = true, level, logLevel, ...args) {
		const shouldLogToConsole = this.shouldLogToConsole(condition, level);
		const shouldLogToFile =
			this.fileLogger && this.shouldLogToFile(condition, level);

		if (!shouldLogToConsole && !shouldLogToFile) return;

		const formattedArgs = formatArgs(
			condition === true ? args : [condition, ...args],
			COLORS.RESET
		);

		let stackTrace = "";
		const isErrorOrFatal = level >= 3;
		const hasExistingStackTrace = formattedArgs.some(
			(arg) =>
				typeof arg === "string" && arg.includes("Error") && arg.includes("at ")
		);
		if (this.includeStackTrace && isErrorOrFatal && !hasExistingStackTrace) {
			stackTrace = new Error().stack;
		}

		const timestamp = this.includeTimestamps
			? `${COLORS.LIGHT_BLUE}${getCurrentTimestamp(this.timestampFormat)}${
					COLORS.RESET
			  } `
			: "";

		const inlineCallerInfo =
			this.includeInlineCallerInfo && level >= 1
				? `${this.color.inlineCaller}${this.getInlineCallerInfo(
						this.inlineCallerInfoLevel
				  )}${COLORS.RESET} `
				: "";

		const callerInfo = this.getFormattedCallerInfo(level);

		this.logEventCount++;

		const formattedMessage = formattedArgs.join(" ").trim();

		const consoleMessage = `${timestamp}${
			this.memoryUsage
		}${inlineCallerInfo}${color}${formattedMessage}${COLORS.RESET}${
			this.space
		}${callerInfo}\n${stackTrace ? stackTrace + "\n" : ""}`;
		const logLevelString = `[${this.getLogLevelName(logLevel)}]`;

		const fileMessage = `${stripAnsiCodes(timestamp)}${logLevelString} ${
			inlineCallerInfo ? stripAnsiCodes(inlineCallerInfo) : ""
		}${stripAnsiCodes(formattedMessage)}${this.space}${
			callerInfo ? stripAnsiCodes(callerInfo) : ""
		}\n${stackTrace ? stripAnsiCodes(stackTrace) + "\n" : ""}`;

		if (shouldLogToConsole) {
			process.stdout.write(consoleMessage);
		}

		if (this.mode === "worker") {
			this.logWithWorker(fileMessage);
		} else if (shouldLogToFile) {
			this.logWithFileLogger(fileMessage);
		}
	}

	/**
	 * Logs a message asynchronously with a specific color and condition to console and/or file.
	 * Supports batched logging if `outputFileBatchOutput` is enabled.
	 * @param {string} color - The color code for the log message in the console.
	 * @param {boolean} [condition=true] - Condition to determine if the log message should be printed.
	 * @param {number} level - The log level of the message (e.g., `0` for debug, `1` for log, etc.).
	 * @param {...any} args - The log message arguments to be formatted and printed.
	 */
	logWithColorAndConditionAsync(
		color,
		condition = true,
		level,
		logLevel,
		...args
	) {
		const shouldLogToConsole = this.shouldLogToConsole(condition, level);
		const shouldLogToFile =
			this.fileLogger && this.shouldLogToFile(condition, level);

		if (!shouldLogToConsole && !shouldLogToFile) return;

		(async () => {
			const formattedArgs = formatArgs(
				condition === true ? args : [condition, ...args],
				COLORS.RESET
			);

			const timestamp = this.includeTimestamps
				? `${COLORS.LIGHT_BLUE}${getCurrentTimestamp(this.timestampFormat)}${
						COLORS.RESET
				  } `
				: "";

			const inlineCallerInfo =
				this.includeInlineCallerInfo && level >= 1
					? `${this.color.inlineCaller}${this.getInlineCallerInfo(
							this.inlineCallerInfoLevel
					  )}${COLORS.RESET} `
					: "";

			// Get formatted caller info
			const callerInfo = this.getFormattedCallerInfo(level);

			this.logEventCount++;

			const formattedMessage = formattedArgs.join(" ").trim();

			const consoleMessage = `${timestamp}${this.memoryUsage}${inlineCallerInfo}${color}${formattedMessage}${COLORS.RESET}${this.space}${callerInfo}\n`;
			const logLevelString = `[${this.getLogLevelName(logLevel)}]`;

			const fileMessage = `${stripAnsiCodes(timestamp)}${logLevelString} ${
				inlineCallerInfo ? stripAnsiCodes(inlineCallerInfo) : ""
			}${stripAnsiCodes(formattedMessage)}${this.space}${
				callerInfo ? stripAnsiCodes(callerInfo) : ""
			}\n`;

			if (shouldLogToConsole) {
				process.stdout.write(consoleMessage);
			}

			if (this.mode === "worker") {
				this.logWithWorker(fileMessage);
			} else if (shouldLogToFile) {
				this.logWithFileLogger(fileMessage);
			}
		})();
	}

	/**
	 * ACL a debug message.
	 * @param {boolean} [condition=true] - Condition to check before logging.
	 * @param {...any} args - The message arguments.
	 */
	debug(condition = true, ...args) {
		if (
			this.generateReport &&
			this.reportGenerator &&
			typeof this.reportGenerator.incrementLogCount === "function"
		) {
			this.reportGenerator.incrementLogCount("debug");
		}

		this.logWithColorAndCondition(this.color.debug, condition, 1, 0, ...args);
	}

	/**
	 * ACL a debug message asynchronously.
	 * @param {boolean} [condition=true] - Condition to check before logging.
	 * @param {...any} args - The message arguments.
	 */
	async debugAsync(condition = true, ...args) {
		if (
			this.generateReport &&
			this.reportGenerator &&
			typeof this.reportGenerator.incrementLogCount === "function"
		) {
			this.reportGenerator.incrementLogCount("debugAsync");
		}

		await this.logWithColorAndConditionAsync(
			this.color.debug,
			condition,
			1,
			0,
			...args
		);
	}

	/**
	 * ACL a regular message.
	 * @param {boolean} [condition=true] - Condition to check before logging.
	 * @param {...any} args - The message arguments.
	 */
	log(condition = true, ...args) {
		if (
			this.generateReport &&
			this.reportGenerator &&
			typeof this.reportGenerator.incrementLogCount === "function"
		) {
			this.reportGenerator.incrementLogCount("log");
		}

		this.logWithColorAndCondition(this.color.log, condition, 1, 1, ...args);
	}

	/**
	 * ACL a regular message asynchronously.
	 * @param {boolean} [condition=true] - Condition to check before logging.
	 * @param {...any} args - The message arguments.
	 */
	async logAsync(condition = true, ...args) {
		if (
			this.generateReport &&
			this.reportGenerator &&
			typeof this.reportGenerator.incrementLogCount === "function"
		) {
			this.reportGenerator.incrementLogCount("logAsync");
		}

		await this.logWithColorAndConditionAsync(
			this.color.log,
			condition,
			1,
			1,
			...args
		);
	}

	/**
	 * ACL an info message.
	 * @param {boolean} [condition=true] - Condition to check before logging.
	 * @param {...any} args - The message arguments.
	 */
	info(condition = true, ...args) {
		if (
			this.generateReport &&
			this.reportGenerator &&
			typeof this.reportGenerator.incrementLogCount === "function"
		) {
			this.reportGenerator.incrementLogCount("info");
		}

		this.logWithColorAndCondition(this.color.info, condition, 1, 2, ...args);
	}

	/**
	 * ACL an info message asynchronously.
	 * @param {boolean} [condition=true] - Condition to check before logging.
	 * @param {...any} args - The message arguments.
	 */
	async infoAsync(condition = true, ...args) {
		if (
			this.generateReport &&
			this.reportGenerator &&
			typeof this.reportGenerator.incrementLogCount === "function"
		) {
			this.reportGenerator.incrementLogCount("infoAsync");
		}

		await this.logWithColorAndConditionAsync(
			this.color.info,
			condition,
			1,
			2,
			...args
		);
	}

	/**
	 * ACL a warning message.
	 * @param {boolean} [condition=true] - Condition to check before logging.
	 * @param {...any} args - The message arguments.
	 */
	warn(condition = true, ...args) {
		if (
			this.generateReport &&
			this.reportGenerator &&
			typeof this.reportGenerator.incrementLogCount === "function"
		) {
			this.reportGenerator.incrementLogCount("warn");
		}

		this.logWithColorAndCondition(this.color.warn, condition, 2, 3, ...args);
	}

	/**
	 * ACL a warning message asynchronously.
	 * @param {boolean} [condition=true] - Condition to check before logging.
	 * @param {...any} args - The message arguments.
	 */
	async warnAsync(condition = true, ...args) {
		if (
			this.generateReport &&
			this.reportGenerator &&
			typeof this.reportGenerator.incrementLogCount === "function"
		) {
			this.reportGenerator.incrementLogCount("warnAsync");
		}

		await this.logWithColorAndConditionAsync(
			this.color.warn,
			condition,
			2,
			3,
			...args
		);
	}

	/**
	 * ACL an error message.
	 * @param {boolean} [condition=true] - Condition to check before logging.
	 * @param {...any} args - The message arguments.
	 */
	error(condition = true, ...args) {
		if (
			this.generateReport &&
			this.reportGenerator &&
			typeof this.reportGenerator.incrementLogCount === "function"
		) {
			this.reportGenerator.incrementLogCount("error");
		}

		this.logWithColorAndCondition(this.color.error, condition, 3, 4, ...args);
	}

	/**
	 * ACL an error message asynchronously.
	 * @param {boolean} [condition=true] - Condition to check before logging.
	 * @param {...any} args - The message arguments.
	 */
	async errorAsync(condition = true, ...args) {
		if (
			this.generateReport &&
			this.reportGenerator &&
			typeof this.reportGenerator.incrementLogCount === "function"
		) {
			this.reportGenerator.incrementLogCount("errorAsync");
		}

		await this.logWithColorAndConditionAsync(
			this.color.error,
			condition,
			3,
			4,
			...args
		);
	}

	/**
	 * ACL a fatal message.
	 * @param {boolean} [condition=true] - Condition to check before logging.
	 * @param {...any} args - The message arguments.
	 */
	fatal(condition = true, ...args) {
		if (
			this.generateReport &&
			this.reportGenerator &&
			typeof this.reportGenerator.incrementLogCount === "function"
		) {
			this.reportGenerator.incrementLogCount("fatal");
		}

		this.logWithColorAndCondition(this.color.fatal, condition, 3, 5, ...args);
		if (this.terminateOnFatal) {
			process.exit(1); // Exit the process with an error code
		}
	}

	/**
	 * ACL a fatal message asynchronously.
	 * @param {boolean} [condition=true] - Condition to check before logging.
	 * @param {...any} args - The message arguments.
	 */
	async fatalAsync(condition = true, ...args) {
		if (
			this.generateReport &&
			this.reportGenerator &&
			typeof this.reportGenerator.incrementLogCount === "function"
		) {
			this.reportGenerator.incrementLogCount("fatalAsync");
		}

		await this.logWithColorAndConditionAsync(
			this.color.fatal,
			condition,
			3,
			5,
			...args
		);
		if (this.terminateOnFatal) {
			await this.close(); // Gracefully handle all shutdown procedures
			setImmediate(() => process.exit(0)); // Exit with code 0 after cleanup
		}
	}

	/**
	 * Initializes the TimerUtility instance if timers are enabled.
	 */
	_initializeTimers() {
		if (!TimerUtility) {
			TimerUtility = require("./TimerUtility");
		}
		this.timers = new TimerUtility();
	}

	/**
	 * Start a timer with a specific label if timers are enabled.
	 * @param {string} label - The label for the timer.
	 */
	startTimer(label) {
		if (this.enableTimers && this.timers) {
			this.timers.startTimer(label);
			this.debug(true, `Timer started: '${label}'`);
		} else {
			throw new Error(
				"ACL Timer Error: The 'enableTimers' config option must be set to true to use timers."
			);
		}
	}

	/**
	 * Stop a timer with a specific label and log the elapsed time if timers are enabled.
	 * @param {string} label - The label for the timer.
	 */
	stopTimer(label) {
		if (this.enableTimers && this.timers) {
			const elapsedTime = this.timers.stopTimer(label);
			if (elapsedTime !== null) {
				this.debug(
					true,
					`Timer stopped: '${label}'. Elapsed time: ${elapsedTime}`
				);
			} else {
				this.error(true, `No such timer: ${label}`);
			}
		} else {
			throw new Error(
				"ACL Timer Error: The 'enableTimers' config option must be set to true to use timers."
			);
		}
	}

	/**
	 * Get the elapsed time for a specific timer label if timers are enabled.
	 * @param {string} label - The label for the timer.
	 * @returns {number|null} - The elapsed time in milliseconds or null if timer doesn't exist.
	 */
	getTimer(label) {
		if (this.enableTimers && this.timers) {
			return this.timers.getTimer(label);
		} else {
			throw new Error(
				"ACL Timer Error: The 'enableTimers' config option must be set to true to use timers."
			);
		}
	}

	/**
	 * Clear all active timers.
	 */
	clearAllTimers() {
		if (this.enableTimers && this.timers) {
			this.timers.clearAllTimers();
		} else {
			throw new Error(
				"ACL Timer Error: The 'enableTimers' config option must be set to true to use timers."
			);
		}
	}

	/**
	 * Pretty print an object, similar to console.dir.
	 * @param {Object} obj - The object to print.
	 */
	dir(obj) {
		process.stdout.write(
			`${COLORS.RESET}${util.inspect(obj, {
				showHidden: false,
				depth: null,
				colors: true,
				maxArrayLength: null,
				compact: false,
			})}\n`
		);
	}

	/**
	 * Print a stack trace, similar to console.trace.
	 */
	trace() {
		// Capture the original stack trace
		const originalPrepareStackTrace = Error.prepareStackTrace;

		Error.prepareStackTrace = (err, stack) => stack;

		const err = new Error();
		const stack = err.stack;

		Error.prepareStackTrace = originalPrepareStackTrace;

		// Get the current file path to filter out ACL internal calls
		const internalFile = __filename;

		// Filter out internal ACL class frames from the stack trace
		const filteredStack = stack
			.filter(
				(frame) =>
					frame.getFileName() && !frame.getFileName().includes(internalFile)
			)
			.map(
				(frame) =>
					`    at ${
						frame.getFunctionName() || "anonymous"
					} (${frame.getFileName()}:${frame.getLineNumber()}:${frame.getColumnNumber()})`
			)
			.join("\n");

		// Log the filtered stack trace
		process.stdout.write(`${COLORS.RESET}Trace:\n${filteredStack}\n`);
	}

	/**
	 * Start a timer with a specific label, similar to console.time.
	 * @param {string} label - The label for the timer.
	 */
	time(label) {
		this.startTimer(label);
	}

	/**
	 * Stop a timer with a specific label and log the elapsed time, similar to console.timeEnd.
	 * @param {string} label - The label for the timer.
	 */
	timeEnd(label) {
		const elapsedTime = this.getTimer(label);
		if (elapsedTime !== null) {
			this.debug(
				true,
				`Timer '${label}' ended. Elapsed time: ${elapsedTime}ms`
			);
			delete this.timers[label];
		} else {
			this.error(true, `Timer '${label}' does not exist.`);
		}
	}

	/**
	 * Generate and print a usage report.
	 */
	report() {
		if (
			this.generateReport &&
			this.reportGenerator &&
			typeof this.reportGenerator.generateReport === "function"
		) {
			this.reportGenerator.generateReport();
		} else {
			throw new Error(
				`ACL Report Error: The 'generateReport' config option must be set to true to generate a report.`
			);
		}
	}

	/**
	 * Get the formatted memory usage based on the memory display mode.
	 * @returns {string} - The formatted memory usage.
	 */
	getFormattedMemoryUsage() {
		return getFormattedMemoryUsage(
			this._totalHeapSizeLimit,
			this.memoryDisplayMode
		);
	}
}

module.exports = ACL;
