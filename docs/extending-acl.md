# [Advanced Console Log Documentation](/docs/README.md)

## How to Extend or Customize ACL

The ACL module is designed with extensibility in mind, allowing developers to tailor the logging behavior to their specific needs. Below are several common use cases for extending or customizing ACL:

### 1. Adding New Log Levels

You can add custom log levels (e.g., `verbose`, `critical`) by creating new methods in your subclass and setting custom colors for each level.

#### Example:

```js
class CustomACL extends ACL {
	verbose(condition = true, ...args) {
		this.logWithColorAndCondition(this.color.info, condition, 0, ...args);
	}

	critical(condition = true, ...args) {
		this.logWithColorAndCondition(this.color.fatal, condition, 5, ...args);
	}
}
```

### 2. Integrating with Third-Party Logging Services

You can extend ACL to send logs to third-party services (e.g., Elasticsearch, Loggly, Datadog) by overriding the `logWithColorAndCondition` method.

#### Example Integration:

```js
class ServiceLogger extends ACL {
	logWithColorAndCondition(color, condition, level, ...args) {
		super.logWithColorAndCondition(color, condition, level, ...args);
		// Custom integration code to send logs to a third-party service
	}
}
```

### 3. Overriding Internal Methods

You can override methods like `getFormattedMemoryUsage`, `writeHeader`, or `getCallerInfo` to adapt ACL to your logging needs.

#### Example:

Override `writeHeader` to customize the log file header:

```js
class CustomHeaderLogger extends ACL {
	writeHeader() {
		const customHeader = `Custom Log File - ${new Date().toISOString()}\n`;
		fs.appendFileSync(this.outputFilename, customHeader, "utf8");
	}
}
```

### 4. Using `loadDynamicMethodsAndProperties`

The ACL class includes a powerful utility to dynamically load methods and properties from external classes. Use `loadDynamicMethodsAndProperties` to inject custom behaviors:

```js
class ExtendedACL extends ACL {
	constructor(config) {
		super(config);
		this.loadDynamicMethodsAndProperties(CustomMethodsClass);
	}
}
```

By using `loadDynamicMethodsAndProperties`, you can easily integrate custom methods without modifying the base class.
