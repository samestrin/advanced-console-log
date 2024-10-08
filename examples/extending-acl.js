/**
 * Extending ACL Example
 * Demonstrates how to extend ACL to add custom functionality.
 */

const ACL = require("../index");

// Extend ACL to add a custom log level
class CustomACL extends ACL {
	/**
	 * Logs a verbose message with custom color.
	 * @param {boolean} [condition=true] - Condition to determine if the message should be logged.
	 * @param {...any} args - Arguments to log.
	 */
	verbose(condition = true, ...args) {
		this.logWithColorAndCondition(this.color.verbose, condition, 0, 0, ...args);
	}
}

// Create an instance of the custom ACL
const logger = new CustomACL({
	color: {
		verbose: "\x1b[34m", // Blue
	},
});

function main() {
	logger.verbose("This is a custom verbose message.");
	logger.info("This is an info message.");
}

main();
