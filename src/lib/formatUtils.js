// lib/formatUtils.js

/**
 * Utility functions for formatting.
 * @module utils
 */

const util = require("util");

/**
 * Format arguments for logging.
 * @param {Array} args - The arguments to format.
 * @returns {Array<string>} - The formatted arguments.
 */
function formatArgs(args, reset) {
	let firstObjectEncountered = false; // Flag to track if we've found the first object
	let firstArgument = true; // Flag to track if we are processing the first argument

	return args.map((arg) => {
		if (typeof arg === "object" && arg !== null) {
			// Determine if this is the first object or the first argument that is an object
			const prefix = !firstObjectEncountered && firstArgument ? "Object: " : "";
			firstObjectEncountered = true; // Set flag after the first object is encountered
			firstArgument = false; // After processing the first argument, set the flag to false

			// Format object with reset color and the optional prefix
			return `${prefix}${reset}${util.inspect(arg, {
				showHidden: false,
				depth: null,
				colors: true,
				maxArrayLength: null,
				compact: false,
			})}`;
		}

		// For non-objects, handle as a regular string, no prefix, but track as first argument
		firstArgument = false;
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
