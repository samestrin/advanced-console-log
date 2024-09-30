// lib/utils.js

/**
 * Utility functions for the logger.
 * @module utils
 */

const util = require("util");

/**
 * Format arguments for logging.
 * @param {Array} args - The arguments to format.
 * @returns {Array<string>} - The formatted arguments.
 */
function formatArgs(args) {
	return args.map((arg) => {
		if (typeof arg === "object" && arg !== null) {
			return util.inspect(arg, {
				showHidden: false,
				depth: null,
				colors: true,
				maxArrayLength: null,
				compact: false,
			});
		}
		return String(arg);
	});
}

/**
 * Strip ANSI color codes from a string.
 * @param {string} str - The string to strip.
 * @returns {string} - The string without ANSI codes.
 */
function stripAnsiCodes(str) {
	return str.replace(/\u001b\[[0-9]{1,2}m/g, "");
}

module.exports = {
	formatArgs,
	stripAnsiCodes,
};
