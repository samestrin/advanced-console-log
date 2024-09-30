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
	 * @param {number} [config.outputFilenameLogLevel=1] - File logging level.
	 * @param {string} [config.outputFilename=null] - Output file name for log messages.
	 * @param {boolean} [config.includeTimestamps=true] - Whether to include timestamps in logs.
	 * @param {boolean} [config.includeMemoryUsage=true] - Whether to include memory usage in logs.
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
	 */
	constructor(config = {}) {
		// Logging level settings
		this.logLevel = typeof config.logLevel === "number" ? config.logLevel : 1;

		// File logging options
		this.outputFilename = config.outputFilename || null;
		this.outputFilenameLogLevel = config.outputFilenameLogLevel ?? 1;

		// Include timestamps in log messages
		this.includeTimestamps = config.includeTimestamps !== false;

		// Memory usage settings
		this.includeMemoryUsage = config.includeMemoryUsage || false;
		this.memoryCheckFrequency = config.memoryCheckFrequency ?? 10; // Accept 0 values
		this.memoryDisplayMode = config.memoryDisplayMode ?? 1; // Accept 0 values

		// Caller info settings
		this.includeCallerInfo = config.includeCallerInfo || false;
		this.callerInfoLevel = config.callerInfoLevel ?? 2; // Accept 0 values
		this.callerInfoDisplayMode = config.callerInfoDisplayMode ?? 1; // Accept 0 values

		// Inline caller info settings
		this.includeInlineCallerInfo = !!config.includeInlineCallerInfo;
		this.inlineCallerInfoLevel = config.inlineCallerInfoLevel ?? 1; // Accept 0 values

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
			process.stderr.write(
				`Failed to write header to log file: ${err.message}\n`
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
			this.outputFilenameLogLevel === 0 ||
			(typeof condition === "boolean" && !condition) ||
			(this.outputFilenameLogLevel === 2 && level < 2) ||
			(this.outputFilenameLogLevel === 3 && level < 3)
		) {
			return false;
		}
		return true;
	}

	/**
	 * ACL a message with a specific color and condition.
	 * @param {string} color - The color to use for the log message.
	 * @param {boolean} condition - Condition to check before logging.
	 * @param {number} level - The level of the log message.
	 * @param {...any} args - The message arguments.
	 */
	logWithColorAndCondition(color, condition = true, level, ...args) {
		const shouldLogToConsole = this.shouldLogToConsole(condition, level);
		const shouldLogToFile = this.shouldLogToFile(condition, level);

		if (!shouldLogToConsole && !shouldLogToFile) return;

		const formattedArgs = formatArgs(
			condition === true ? args : [condition, ...args],
			COLORS.RESET
		);

		// Check if stack trace should be included
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
			? `${COLORS.LIGHT_BLUE}${ACL.getCurrentTimestamp(this.timestampFormat)}${
					COLORS.RESET
			  } `
			: "";

		if (
			this.includeMemoryUsage &&
			this.logEventCount % this.memoryCheckFrequency === 0
		) {
			this.memoryUsage = this.getFormattedMemoryUsage();
			this.logEventCount = 0;
		}

		const inlineCallerInfo = this.shouldIncludeInlineCallerInfo(level)
			? `${this.color.inlineCaller}${this.getInlineCallerInfo(
					this.inlineCallerInfoLevel
			  )}${COLORS.RESET} `
			: "";

		const callerInfo = this.shouldIncludeCallerInfo(level)
			? this.getCallerInfo()
			: "";

		this.logEventCount++;

		const firstNewline = this.firstShown ? "" : "\n";
		if (!this.firstShown) this.firstShown = true;

		const formattedMessage = formattedArgs.join(" ").trim();

		const consoleMessage = `${firstNewline}${timestamp}${
			this.memoryUsage
		}${inlineCallerInfo}${color}${formattedMessage}${COLORS.RESET}${
			this.space
		}${callerInfo}\n${stackTrace ? stackTrace + "\n" : ""}`;

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

		// Output to file
		if (shouldLogToFile && this.outputFilename) {
			const logFilePath = path.resolve(this.outputFilename);
			handleLogFileRotation(
				logFilePath,
				this.maxLogFileSizeMB,
				this.maxLogFiles
			);

			try {
				fs.appendFileSync(this.outputFilename, fileMessage, "utf8");
			} catch (err) {
				// Handle file write errors
				process.stderr.write(`Failed to write to log file: ${err.message}\n`);
			}
		}
	}

	/**
	 * ACL a message with a specific color and condition asynchronously.
	 * @param {string} color - The color to use for the log message.
	 * @param {boolean} condition - Condition to check before logging.
	 * @param {number} level - The level of the log message.
	 * @param {...any} args - The message arguments.
	 */
	logWithColorAndConditionAsync(color, condition = true, level, ...args) {
		const shouldLogToConsole = this.shouldLogToConsole(condition, level);
		const shouldLogToFile = this.shouldLogToFile(condition, level);

		if (!shouldLogToConsole && !shouldLogToFile) return;

		setImmediate(() => {
			const formattedArgs = formatArgs(
				condition === true ? args : [condition, ...args],
				COLORS.RESET
			);

			const timestamp = this.includeTimestamps
				? `${COLORS.LIGHT_BLUE}${ACL.getCurrentTimestamp(
						this.timestampFormat
				  )}${COLORS.RESET} `
				: "";

			if (
				this.includeMemoryUsage &&
				this.logEventCount % this.memoryCheckFrequency === 0
			) {
				this.memoryUsage = this.getFormattedMemoryUsage();
				this.logEventCount = 0;
			}

			const inlineCallerInfo = this.shouldIncludeInlineCallerInfo(level)
				? `${this.color.inlineCaller}${this.getInlineCallerInfo(
						this.inlineCallerInfoLevel
				  )}${COLORS.RESET} `
				: "";

			const callerInfo = this.shouldIncludeCallerInfo(level)
				? this.getCallerInfo()
				: "";

			this.logEventCount++;

			const firstNewline = this.firstShown ? "" : "\n";
			if (!this.firstShown) this.firstShown = true;

			const formattedMessage = formattedArgs.join(" ").trim();

			const consoleMessage = `${firstNewline}${timestamp}${this.memoryUsage}${inlineCallerInfo}${color}${formattedMessage}${COLORS.RESET}${this.space}${callerInfo}\n`;

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

			// Output to file
			if (shouldLogToFile && this.outputFilename) {
				fs.appendFile(this.outputFilename, fileMessage, "utf8", (err) => {
					if (err) {
						// Handle file write errors
						process.stderr.write(
							`Failed to write to log file: ${err.message}\n`
						);
					}
				});
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
				`To use Log.report(), the generateReport parameter must be set to true.`
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
