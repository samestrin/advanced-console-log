/**
 * Pretty Printing Example
 * Demonstrates using the dir method to pretty print complex objects.
 */

const ACL = require("../index");

// Create an instance of ACL
const logger = ACL.getInstance();

function main() {
	const complexObject = {
		name: "Alice",
		age: 30,
		skills: ["JavaScript", "Node.js", "React"],
		address: {
			street: "123 Main St",
			city: "Anytown",
			zip: "12345",
		},
		active: true,
	};

	logger.dir(complexObject);
}

main();
