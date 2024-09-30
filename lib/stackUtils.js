// lib/stackUtils.js

/**
 * Utility functions for stack traces.
 * @module stackUtils
 */

const path = require("path");

/**
 * Retrieve caller information.
 * @param {string} currentFileName - The current file name.
 * @param {string} cwd - The current working directory.
 * @param {number} callerInfoDisplayMode - The display mode for caller info.
 * @returns {string} - Formatted caller information.
 */
function getCallerInfo(currentFileName, cwd, callerInfoDisplayMode) {
	const originalPrepareStackTrace = Error.prepareStackTrace;
	Error.prepareStackTrace = (err, stack) => stack;

	const err = new Error();
	const stack = err.stack;

	Error.prepareStackTrace = originalPrepareStackTrace;

	const formattedStack = [];
	let shouldLog = false;
	let visibleFrameCount = 0;

	for (let i = 1; i < stack.length; i++) {
		const caller = stack[i];
		const callerFile = caller.getFileName();
		const callerFunction = caller.getFunctionName() || "anonymous function";
		const callerLineNumber = caller.getLineNumber();
		const callerColumnNumber = caller.getColumnNumber();

		if (!callerFile) continue;

		if (!shouldLog && !callerFile.includes(currentFileName)) {
			shouldLog = true;
		}

		if (!shouldLog) continue;

		visibleFrameCount++;

		const shortCallerFile = path.relative(cwd, callerFile);

		let formattedFrame;
		if (callerInfoDisplayMode === 1) {
			const indentation = "    ".repeat(visibleFrameCount);
			formattedFrame = `${indentation}File: ${shortCallerFile}\n${indentation}Function: ${callerFunction}\n${indentation}Line: ${callerLineNumber}, Column: ${callerColumnNumber}\n`;
		} else {
			formattedFrame = `    ${callerFunction} (${shortCallerFile}:${callerLineNumber}:${callerColumnNumber})`;
		}

		formattedStack.push(formattedFrame);
	}

	return `\n\n${formattedStack.join("\n")}\n`;
}

/**
 * Retrieve inline caller information based on the specified detail level.
 * @param {string} currentFileName - The current file name.
 * @param {string} cwd - The current working directory.
 * @param {number} level - The detail level for the inline caller information.
 * @returns {string} - Formatted inline caller information.
 */
function getInlineCallerInfo(currentFileName, cwd, level) {
	const originalPrepareStackTrace = Error.prepareStackTrace;
	Error.prepareStackTrace = (err, stack) => stack;

	const err = new Error();
	const stack = err.stack;

	Error.prepareStackTrace = originalPrepareStackTrace;

	for (let i = 1; i < stack.length; i++) {
		const caller = stack[i];
		const callerFile = caller.getFileName();
		const callerFunction = caller.getFunctionName() || "anonymous function";
		const callerLineNumber = caller.getLineNumber();
		const callerColumnNumber = caller.getColumnNumber();

		if (!callerFile) continue;

		if (!callerFile.includes(currentFileName)) {
			const shortCallerFile = path.relative(cwd, callerFile);

			switch (level) {
				case 1:
					return `${shortCallerFile}:`;
				case 2:
					return `${shortCallerFile} (${callerLineNumber}, ${callerColumnNumber}):`;
				case 3:
					return `${shortCallerFile} (${callerLineNumber}, ${callerColumnNumber}) > ${callerFunction}:`;
				default:
					return "";
			}
		}
	}
	return "";
}

module.exports = {
	getCallerInfo,
	getInlineCallerInfo,
};
