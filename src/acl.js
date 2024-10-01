// src/acl.js

/**
 * ACL class for logging messages with various levels and features.
 * @module ACL
 */

const path = require("path");
const fs = require("fs");
const util = require("util");

const { COLORS } = require("../lib/constants");
const { formatArgs, stripAnsiCodes } = require("../lib/utils");
const {
	getTotalHeapSizeLimit,
	getFormattedMemoryUsage,
} = require("../lib/memoryUtils");
const { handleLogFileRotation } = require("../lib/logFiles");
const { getCallerInfo, getInlineCallerInfo } = require("../lib/stackUtils");
const { startTimer, stopTimer, getTimer } = require("../lib/timerUtils");

/**
 * Class representing a logger with multiple features like console/file logging,
 * colored output, memory usage tracking, caller info, and more.
 */
class ACL {
	/**
	 * Constructor for the Log class.
	 * @param {Object} config - Configuration object.
	 * @param {number} [config.logLevel=1] - Console logging level.
	 * @param {number} [config.outputFileLogLevel=1] - File logging level.
	 * @param {string} [config.outputFilename=null] - Output file name for log messages.
	 * @param {boolean} [config.includeTimestamps=true] - Whether to include timestamps in logs.
	 * @param {boolean} [config.includeMemoryUsage=false] - Whether to include memory usage in logs.
	 * @param {number} [config.memoryCheckFrequency=10] - Frequency of memory checks.
	 * @param {number} [config.memoryDisplayMode=1] - Memory display mode (1: MB, 2: %, 3: both).
	 * @param {Object} [config.color] - Color overrides for different log levels.
	 * @param {boolean} [config.extraSpace=false] - Whether to include extra space after each log.
	 * @param {boolean} [config.terminateOnFatal=false] - Whether to terminate the program on fatal logs.
	 * @param {number|boolean} [config.includeCallerInfo=0] - Whether to include caller info in logs (0 for none, 1 for warn/error/fatal, 2 for all levels).
	 * @param {number} [config.callerInfoLevel=2] - Minimum log level for including caller info (e.g., 2 for warn and above).
	 * @param {number} [config.callerInfoDisplayMode=1] - Caller info display mode (1 for regular, 2 for compressed).
	 * @param {boolean} [config.includeInlineCallerInfo=false] - Whether to include inline caller info in logs.
	 * @param {number} [config.inlineCallerInfoLevel=1] - Inline caller info detail level (1 for file, 2 for file, line, col, 3 for file, line, col, function).
	 * @param {boolean} [config.includeStackTrace=false] - Automatically include stack trace for error or fatal logs if not provided by the user.
	 * @param {boolean} [config.useAsyncLogging=false] - If true, enables async versions of all log methods (`debugAsync`, `infoAsync`, etc.).
	 * @param {number} [config.maxLogFileSizeMB=10] - Maximum size of a log file in MB before rotation.
	 * @param {number} [config.maxLogFiles=5] - Maximum number of log files to retain.
	 * @param {boolean} [config.outputFileBatchOutput=false] - Enable batched file output.
	 * @param {number} [config.outputFileBatchOutputSize=25] - Batch size for batched file output (number of log entries).
	 * @
	 */
	constructor(config = {}) {
		// Logging level settings
		this.logLevel = typeof config.logLevel === "number" ? config.logLevel : 1;

		// File logging options
		this.outputFilename = config.outputFilename || null;
		this.outputFileLogLevel = config.outputFileLogLevel ?? 1;

		// Include timestamps in log messages
		this.includeTimestamps = config.includeTimestamps !== false;

		// Memory usage settings
		this.includeMemoryUsage = config.includeMemoryUsage || false;
		this.memoryCheckFrequency = config.memoryCheckFrequency ?? 10;
		this.memoryDisplayMode = config.memoryDisplayMode ?? 1;

		// Caller info settings
		this.includeCallerInfo = config.includeCallerInfo || false;
		this.callerInfoLevel = config.callerInfoLevel ?? 2;
		this.callerInfoDisplayMode = config.callerInfoDisplayMode ?? 1;

		// Inline caller info settings
		this.includeInlineCallerInfo = !!config.includeInlineCallerInfo;
		this.inlineCallerInfoLevel = config.inlineCallerInfoLevel ?? 1;

		// Include stack trace in error and fatal messages
		this.includeStackTrace = !!config.includeStackTrace;

		this.timestampFormat = config.timestampFormat || "HH:mm:ss.SSS";

		// Color settings or defaults
		this.color = {
			debug: config.color?.debug || COLORS.CYAN,
			log: config.color?.log || COLORS.GREEN,
			info: config.color?.info || COLORS.LIGHT_GREEN,
			warn: config.color?.warn || COLORS.YELLOW,
			error: config.color?.error || COLORS.LIGHT_RED,
			fatal: config.color?.fatal || COLORS.MAGENTA,
			caller: config.color?.caller || COLORS.LIGHT_MAGENTA, // Color for caller info
			inlineCaller: COLORS.LIGHT_CYAN, // Color for inline caller info
		};

		// Control extra space after each log
		this.space = config.extraSpace ? "\n" : "";

		// Report generation settings
		this.generateReport = !!config.generateReport;

		// Termination on fatal logs
		this.terminateOnFatal = !!config.terminateOnFatal;

		// Async logging settings
		this.useAsyncLogging = !!config.useAsyncLogging;

		// Log file rotation settings
		this.maxLogFileSizeMB = config.maxLogFileSizeMB || 10; // 10 MB by default
		this.maxLogFiles = config.maxLogFiles || 5; // Retain up to 5 log files by default

		this.outputFileBatchOutput = config.outputFileBatchOutput || false;
		this.outputFileBatchOutputSize = config.outputFileBatchOutputSize || 25;
		this.batchedLogs = [];

		// Memory tracking
		if (this.includeMemoryUsage) {
			this._totalHeapSizeLimit = getTotalHeapSizeLimit();
		}

		// Alias synchronous methods to their asynchronous counterparts if `useAsyncLogging` is enabled
		if (this.useAsyncLogging) {
			this.aliasSyncToAsyncMethods();
		}

		// Other initialization
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

		this.currentFileName = __filename.replace(this.cwd, "").replace(/^\//, "");

		// Call the method to write the header if outputFilename is defined
		if (this.outputFilename) {
			this.writeHeader();
		}
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
	static getInstance(config) {
		if (!ACL.instance) {
			ACL.instance = new ACL(config);
		}
		return ACL.instance;
	}

	/**
	 * Writes a custom header to the log file at the start of every new run.
	 *
	 * The header includes the current file name (`this.currentFileName`) and a timestamp
	 * in the format defined by `this.timestampFormat`. It also inserts a separator line
	 * (`-----------------------------`) for better visual distinction of log sessions.
	 *
	 * Example Header Format:
	 * ```
	 * /path/to/currentFile.js (YYYY-MM-DD HH:mm:ss.SSS):
	 * -----------------------------
	 * ```
	 *
	 * This method is called automatically during initialization if `outputFilename` is defined.
	 * If the file cannot be written, an error message is printed to `stderr`.
	 *
	 * @throws {Error} If writing to the log file fails, logs an error message to `stderr`.
	 */
	writeHeader() {
		const scriptName = require.main ? require.main.filename : process.argv[1];
		const header = `\n${ACL.getCurrentTimestamp(
			"MM-DD-YYYY HH:mm:ss.SSS"
		)} ${scriptName}\n\n`;
		try {
			fs.appendFileSync(this.outputFilename, header, "utf8");
		} catch (err) {
			this.error(
				true,
				`writeHeader failed: Unable to write header to log file - ${err.message}`
			);
		}
	}

	/**
	 * Get the current timestamp formatted according to the given pattern.
	 * Supported patterns: YYYY, MM, DD, HH, mm, ss, SSS
	 * @param {string} format - The format string, e.g., "YYYY-MM-DD HH:mm:ss.SSS".
	 * @returns {string} - The formatted timestamp.
	 */
	static getCurrentTimestamp(format = "HH:mm:ss.SSS") {
		const date = new Date();

		// Extract individual date components
		const components = {
			YYYY: date.getFullYear(),
			MM: String(date.getMonth() + 1).padStart(2, "0"), // Months are 0-based
			DD: String(date.getDate()).padStart(2, "0"),
			HH: String(date.getHours()).padStart(2, "0"),
			mm: String(date.getMinutes()).padStart(2, "0"),
			ss: String(date.getSeconds()).padStart(2, "0"),
			SSS: String(date.getMilliseconds()).padStart(3, "0"),
		};

		// Replace the format tokens in the input format string
		return format.replace(
			/YYYY|MM|DD|HH|mm|ss|SSS/g,
			(match) => components[match]
		);
	}

	/**
	 * Retrieve caller information (file name, function name, line number, and column number).
	 * @returns {string} - Formatted caller information with indentation showing call hierarchy.
	 */
	getCallerInfo() {
		return getCallerInfo(
			this.currentFileName,
			this.cwd,
			this.callerInfoDisplayMode
		);
	}

	/**
	 * Retrieve inline caller information based on the specified detail level.
	 * @param {number} level - The detail level for the inline caller information.
	 * @returns {string} - Formatted inline caller information.
	 */
	getInlineCallerInfo(level) {
		return getInlineCallerInfo(this.currentFileName, this.cwd, level);
	}

	/**
	 * Determine if caller info should be included based on the log level.
	 * @param {number} level - The level of the log message.
	 * @returns {boolean} - Whether to include caller info.
	 */
	shouldIncludeCallerInfo(level) {
		if (this.includeInlineCallerInfo) {
			return level >= this.callerInfoLevel;
		} else {
			return false;
		}
	}

	/**
	 * Determine if inline caller info should be included based on the log level.
	 * @param {number} level - The level of the log message.
	 * @returns {boolean} - Whether to include inline caller info.
	 */
	shouldIncludeInlineCallerInfo(level) {
		return this.includeInlineCallerInfo && level >= 1;
	}

	/**
	 * Determine if a message should be logged to the console.
	 * @param {boolean} condition - The condition for logging.
	 * @param {number} level - The level of the log message.
	 * @returns {boolean} - Whether to log to console.
	 */
	shouldLogToConsole(condition, level) {
		if (
			this.logLevel === 0 ||
			(typeof condition === "boolean" && !condition) ||
			(this.logLevel === 2 && level < 2) ||
			(this.logLevel === 3 && level < 3)
		) {
			return false;
		}
		return true;
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
			this.outputFileLogLevel === 0 ||
			(typeof condition === "boolean" && !condition) ||
			(this.outputFileLogLevel === 2 && level < 2) ||
			(this.outputFileLogLevel === 3 && level < 3)
		) {
			return false;
		}
		return true;
	}

	/**
	 * Flush batched logs to the file.
	 */
	flushBatchLogs() {
		if (this.batchedLogs.length === 0) return;
		const fileContent = this.batchedLogs.join("\n") + "\n";
		fs.appendFileSync(this.outputFilename, fileContent, "utf8");
		this.batchedLogs = [];
	}

	/**
	 * Logs a message synchronously with a specific color and condition to console and/or file.
	 * Supports batched logging if `outputFileBatchOutput` is enabled.
	 *
	 * @param {string} color - The color code for the log message in the console.
	 * @param {boolean} [condition=true] - Condition to determine whether the log message should be printed.
	 * @param {number} level - The log level of the message (e.g., `0` for debug, `1` for log, etc.).
	 * @param {...any} args - The log message arguments to be formatted and printed.
	 */
	logWithColorAndCondition(color, condition = true, level, ...args) {
		const shouldLogToConsole = this.shouldLogToConsole(condition, level);
		const shouldLogToFile = this.shouldLogToFile(condition, level);

		// Skip logging if neither console nor file output is enabled
		if (!shouldLogToConsole && !shouldLogToFile) return;

		// Format the log message arguments
		const formattedArgs = formatArgs(
			condition === true ? args : [condition, ...args],
			COLORS.RESET
		);

		// Include stack trace if necessary
		let stackTrace = "";
		const isErrorOrFatal = level >= 3;
		const hasExistingStackTrace = formattedArgs.some(
			(arg) =>
				typeof arg === "string" && arg.includes("Error") && arg.includes("at ")
		);

		if (this.includeStackTrace && isErrorOrFatal && !hasExistingStackTrace) {
			stackTrace = new Error().stack;
		}

		// Prepare the timestamp if included
		const timestamp = this.includeTimestamps
			? `${COLORS.LIGHT_BLUE}${ACL.getCurrentTimestamp(this.timestampFormat)}${
					COLORS.RESET
			  } `
			: "";

		// Update memory usage if tracking is enabled
		if (
			this.includeMemoryUsage &&
			this.logEventCount % this.memoryCheckFrequency === 0
		) {
			this.memoryUsage = this.getFormattedMemoryUsage();
			this.logEventCount = 0;
		}

		// Retrieve inline caller info if configured
		const inlineCallerInfo = this.shouldIncludeInlineCallerInfo(level)
			? `${this.color.inlineCaller}${this.getInlineCallerInfo(
					this.inlineCallerInfoLevel
			  )}${COLORS.RESET} `
			: "";

		// Retrieve detailed caller info if enabled for the log level
		const callerInfo = this.shouldIncludeCallerInfo(level)
			? this.getCallerInfo()
			: "";

		// Increment the log event counter
		this.logEventCount++;

		// Prepare formatted message for console and file output
		const firstNewline = this.firstShown ? "" : "\n";
		if (!this.firstShown) this.firstShown = true;
		const formattedMessage = formattedArgs.join(" ").trim();

		// Construct the console message
		const consoleMessage = `${firstNewline}${timestamp}${
			this.memoryUsage
		}${inlineCallerInfo}${color}${formattedMessage}${COLORS.RESET}${
			this.space
		}${callerInfo}\n${stackTrace ? stackTrace + "\n" : ""}`;

		// Construct the file message without ANSI codes
		const fileMessage = `${
			this.includeTimestamps
				? ACL.getCurrentTimestamp(this.timestampFormat) + " "
				: ""
		}${
			inlineCallerInfo ? stripAnsiCodes(inlineCallerInfo) : ""
		}${stripAnsiCodes(formattedMessage)}${this.space}${
			callerInfo ? stripAnsiCodes(callerInfo) : ""
		}\n${stackTrace ? stripAnsiCodes(stackTrace) + "\n" : ""}`;

		// Output to console
		if (shouldLogToConsole) {
			process.stdout.write(consoleMessage);
		}

		// Output to file if enabled
		if (shouldLogToFile && this.outputFilename) {
			const logFilePath = path.resolve(this.outputFilename);

			// Handle file rotation if necessary
			handleLogFileRotation(
				logFilePath,
				this.maxLogFileSizeMB,
				this.maxLogFiles
			);

			// Perform batched logging if enabled
			if (this.outputFileBatchOutput) {
				this.batchedLogs.push(fileMessage);
				if (this.batchedLogs.length >= this.outputFileBatchOutputSize) {
					this.flushBatchLogs();
				}
			} else {
				// Write directly to file synchronously
				try {
					fs.appendFileSync(this.outputFilename, fileMessage, "utf8");
				} catch (err) {
					this.error(
						true,
						`logWithColorAndCondition failed: Unable to write to file '${this.outputFilename}' - ${err.message}`
					);
				}
			}
		}
	}

	/**
	 * Logs a message asynchronously with a specific color and condition to console and/or file.
	 * Supports batched logging if `outputFileBatchOutput` is enabled.
	 *
	 * @param {string} color - The color code for the log message in the console.
	 * @param {boolean} [condition=true] - Condition to determine whether the log message should be printed.
	 * @param {number} level - The log level of the message (e.g., `0` for debug, `1` for log, etc.).
	 * @param {...any} args - The log message arguments to be formatted and printed.
	 */
	logWithColorAndConditionAsync(color, condition = true, level, ...args) {
		// Determine if the log message should be logged to console or file
		const shouldLogToConsole = this.shouldLogToConsole(condition, level);
		const shouldLogToFile = this.shouldLogToFile(condition, level);

		// Skip logging if neither console nor file output is enabled
		if (!shouldLogToConsole && !shouldLogToFile) return;

		setImmediate(() => {
			// Format the log message arguments
			const formattedArgs = formatArgs(
				condition === true ? args : [condition, ...args],
				COLORS.RESET
			);

			// Prepare the timestamp if included
			const timestamp = this.includeTimestamps
				? `${COLORS.LIGHT_BLUE}${ACL.getCurrentTimestamp(
						this.timestampFormat
				  )}${COLORS.RESET} `
				: "";

			// Update memory usage if tracking is enabled
			if (
				this.includeMemoryUsage &&
				this.logEventCount % this.memoryCheckFrequency === 0
			) {
				this.memoryUsage = this.getFormattedMemoryUsage();
				this.logEventCount = 0;
			}

			// Retrieve inline caller info if configured
			const inlineCallerInfo = this.shouldIncludeInlineCallerInfo(level)
				? `${this.color.inlineCaller}${this.getInlineCallerInfo(
						this.inlineCallerInfoLevel
				  )}${COLORS.RESET} `
				: "";

			// Retrieve detailed caller info if enabled for the log level
			const callerInfo = this.shouldIncludeCallerInfo(level)
				? this.getCallerInfo()
				: "";

			// Increment the log event counter
			this.logEventCount++;

			// Prepare formatted message for console and file output
			const firstNewline = this.firstShown ? "" : "\n";
			if (!this.firstShown) this.firstShown = true;
			const formattedMessage = formattedArgs.join(" ").trim();

			// Construct the console message
			const consoleMessage = `${firstNewline}${timestamp}${this.memoryUsage}${inlineCallerInfo}${color}${formattedMessage}${COLORS.RESET}${this.space}${callerInfo}\n`;

			// Construct the file message without ANSI codes
			const fileMessage = `${
				this.includeTimestamps
					? ACL.getCurrentTimestamp(this.timestampFormat) + " "
					: ""
			}${
				inlineCallerInfo ? stripAnsiCodes(inlineCallerInfo) : ""
			}${stripAnsiCodes(formattedMessage)}${this.space}${
				callerInfo ? stripAnsiCodes(callerInfo) : ""
			}\n`;

			// Output to console
			if (shouldLogToConsole) {
				process.stdout.write(consoleMessage);
			}

			// Output to file if enabled
			if (shouldLogToFile && this.outputFilename) {
				const logFilePath = path.resolve(this.outputFilename);

				// Handle file rotation if necessary
				handleLogFileRotation(
					logFilePath,
					this.maxLogFileSizeMB,
					this.maxLogFiles
				);

				// Perform batched logging if enabled
				if (this.outputFileBatchOutput) {
					this.batchedLogs.push(fileMessage);
					if (this.batchedLogs.length >= this.outputFileBatchOutputSize) {
						setImmediate(() => this.flushBatchLogs());
					}
				} else {
					// Write directly to file asynchronously
					setImmediate(async () => {
						try {
							await fs.promises.appendFile(
								this.outputFilename,
								fileMessage,
								"utf8"
							);
						} catch (err) {
							this.error(
								true,
								`logWithColorAndConditionAsync failed: Unable to write to file '${this.outputFilename}' - ${err.message}`
							);
						}
					});
				}
			}
		});
	}

	/**
	 * ACL a debug message.
	 * @param {boolean} [condition=true] - Condition to check before logging.
	 * @param {...any} args - The message arguments.
	 */
	debug(condition = true, ...args) {
		if (this.generateReport) this.reportData.debug++;
		this.logWithColorAndCondition(this.color.debug, condition, 1, ...args);
	}

	/**
	 * ACL a debug message asynchronously.
	 * @param {boolean} [condition=true] - Condition to check before logging.
	 * @param {...any} args - The message arguments.
	 */
	debugAsync(condition = true, ...args) {
		if (this.generateReport) this.reportData.debug++;
		this.logWithColorAndConditionAsync(this.color.debug, condition, 1, ...args);
	}

	/**
	 * ACL a regular message.
	 * @param {boolean} [condition=true] - Condition to check before logging.
	 * @param {...any} args - The message arguments.
	 */
	log(condition = true, ...args) {
		if (this.generateReport) this.reportData.log++;
		this.logWithColorAndCondition(this.color.log, condition, 1, ...args);
	}

	/**
	 * ACL a regular message asynchronously.
	 * @param {boolean} [condition=true] - Condition to check before logging.
	 * @param {...any} args - The message arguments.
	 */
	logAsync(condition = true, ...args) {
		if (this.generateReport) this.reportData.log++;
		this.logWithColorAndConditionAsync(this.color.log, condition, 1, ...args);
	}

	/**
	 * ACL an info message.
	 * @param {boolean} [condition=true] - Condition to check before logging.
	 * @param {...any} args - The message arguments.
	 */
	info(condition = true, ...args) {
		if (this.generateReport) this.reportData.info++;
		this.logWithColorAndCondition(this.color.info, condition, 1, ...args);
	}

	/**
	 * ACL an info message asynchronously.
	 * @param {boolean} [condition=true] - Condition to check before logging.
	 * @param {...any} args - The message arguments.
	 */
	infoAsync(condition = true, ...args) {
		if (this.generateReport) this.reportData.info++;
		this.logWithColorAndConditionAsync(this.color.info, condition, 1, ...args);
	}

	/**
	 * ACL a warning message.
	 * @param {boolean} [condition=true] - Condition to check before logging.
	 * @param {...any} args - The message arguments.
	 */
	warn(condition = true, ...args) {
		if (this.generateReport) this.reportData.warn++;
		this.logWithColorAndCondition(this.color.warn, condition, 2, ...args);
	}

	/**
	 * ACL a warning message asynchronously.
	 * @param {boolean} [condition=true] - Condition to check before logging.
	 * @param {...any} args - The message arguments.
	 */
	warnAsync(condition = true, ...args) {
		if (this.generateReport) this.reportData.warn++;
		this.logWithColorAndConditionAsync(this.color.warn, condition, 2, ...args);
	}

	/**
	 * ACL an error message.
	 * @param {boolean} [condition=true] - Condition to check before logging.
	 * @param {...any} args - The message arguments.
	 */
	error(condition = true, ...args) {
		if (this.generateReport) this.reportData.error++;
		this.logWithColorAndCondition(this.color.error, condition, 3, ...args);
	}

	/**
	 * ACL an error message asynchronously.
	 * @param {boolean} [condition=true] - Condition to check before logging.
	 * @param {...any} args - The message arguments.
	 */
	errorAsync(condition = true, ...args) {
		if (this.generateReport) this.reportData.error++;
		this.logWithColorAndConditionAsync(this.color.error, condition, 3, ...args);
	}

	/**
	 * ACL a fatal message.
	 * @param {boolean} [condition=true] - Condition to check before logging.
	 * @param {...any} args - The message arguments.
	 */
	fatal(condition = true, ...args) {
		if (this.generateReport) this.reportData.fatal++;
		this.logWithColorAndCondition(this.color.fatal, condition, 3, ...args);
		if (this.terminateOnFatal) {
			process.exit(1); // Exit the process with an error code
		}
	}

	/**
	 * ACL a fatal message asynchronously.
	 * @param {boolean} [condition=true] - Condition to check before logging.
	 * @param {...any} args - The message arguments.
	 */
	fatalAsync(condition = true, ...args) {
		if (this.generateReport) this.reportData.fatal++;
		this.logWithColorAndConditionAsync(this.color.fatal, condition, 3, ...args);
		if (this.terminateOnFatal) {
			setImmediate(() => process.exit(1));
		}
	}

	/**
	 * Start a timer with a specific label.
	 * @param {string} label - The label for the timer.
	 */
	startTimer(label) {
		startTimer(this.timers, label);
		this.debug(true, `Timer started: ${label}`);
	}

	/**
	 * Stop a timer with a specific label and log the elapsed time.
	 * @param {string} label - The label for the timer.
	 */
	stopTimer(label) {
		const elapsedTime = stopTimer(this.timers, label);
		if (elapsedTime !== null) {
			this.debug(true, `Timer stopped: ${label}. Elapsed time: ${elapsedTime}`);
		} else {
			this.error(true, `No such timer: ${label}`);
		}
	}

	/**
	 * Get the elapsed time for a specific timer label.
	 * @param {string} label - The label for the timer.
	 * @returns {number|null} - The elapsed time in milliseconds or null if timer doesn't exist.
	 */
	getTimer(label) {
		const elapsed = getTimer(this.timers, label);
		if (elapsed !== null) {
			return elapsed;
		} else {
			this.error(true, `No such timer: ${label}`);
			return null;
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
		const trace = new Error().stack;
		process.stdout.write(`${COLORS.RESET}${trace}\n`);
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
		if (this.generateReport) {
			const totalCalls = Object.values(this.reportData).reduce(
				(acc, val) => acc + val,
				0
			);
			const formatPercentage = (count) =>
				totalCalls
					? parseFloat(((count / totalCalls) * 100).toFixed(2))
					: parseFloat(0.0);

			const reportTable = [
				{
					Method: "debug",
					Calls: this.reportData.debug,
					Percentage: formatPercentage(this.reportData.debug),
				},
				{
					Method: "log",
					Calls: this.reportData.log,
					Percentage: formatPercentage(this.reportData.log),
				},
				{
					Method: "info",
					Calls: this.reportData.info,
					Percentage: formatPercentage(this.reportData.info),
				},
				{
					Method: "warn",
					Calls: this.reportData.warn,
					Percentage: formatPercentage(this.reportData.warn),
				},
				{
					Method: "error",
					Calls: this.reportData.error,
					Percentage: formatPercentage(this.reportData.error),
				},
				{
					Method: "fatal",
					Calls: this.reportData.fatal,
					Percentage: formatPercentage(this.reportData.fatal),
				},
			];

			process.stdout.write(`\n\n${this.color.info}ACL Report:${COLORS.RESET}
This report details the number of times each method was called and their respective percentages.\n`);
			console.table(reportTable, ["Method", "Calls", "Percentage"]);
			console.log();
		} else {
			throw new Error(
				`ACL Report Error: The 'generateReport' parameter must be set to true to generate a report.`
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
