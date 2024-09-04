# 🧪 [Pipe]

`Pipe` allows you to process files in a pipeline, making it easy to perform
various operations on them.

### Installation

To get started with `Pipe`, follow these steps:

Install the `Pipe` package using `npm`:

```sh
npm install -D -E @playform/pipe
```

Create a new `Pipe` instance:

**`Main.ts`**

```ts
await new (await import("@playform/pipe")).default().In("./Input");
```

### Getting started

With `Pipe`, you can use the `Pipe` method to perform operations on files within
the pipe. Here's an example of how to do it with some file writes:

**`Main.ts`**

```ts
await(
	await(
		await new (await import("@playform/pipe")).default().In("./Input"),
	).By("**/*.md"),
).Pipe({
	// Append some content to all of the text files
	Wrote: (On) => (On.Buffer += "LICENSE [MIT]"),
});
```

### Default Callbacks

`Pipe` provides default callbacks for file processing. These callbacks can be
customized to suit your specific needs. Here are the default callbacks:

```ts
await new (await import("@playform/pipe")).default().Pipe({
	// Read the file into a buffer
	Read: async ({ Input }) => await fs.promises.readFile(Input, "utf-8"),

	// Wrote the buffer into a file
	Wrote: async ({ Buffer }) => Buffer,

	// Passed the file through a check
	Passed: async (On) => On && true,

	// Failed processing the file
	Failed: async ({ Input }) => `Error: Cannot process file ${Input}!`,

	// Accomplished processing the file
	Accomplished: async ({ Input, Output }) =>
		`Processed ${Input} in ${Output}.`,

	// Fulfilled the whole plan
	Fulfilled: async ({ File }) =>
		`Successfully processed a total of ${File} ${
			File === 1 ? "file" : "files"
		}.`,

	// Changed the plan
	Changed: async (Plan) => Plan,
});
```

### Add Multiple Paths

You can add multiple paths to your pipe by specifying an array as the `Path`
variable:

**`Main.ts`**

```ts
await new (await import("@playform/pipe")).default().In([
	"./Input",
	"./Input2",
]);
```

### Input-Output Mapping

`Pipe` will allow you to provide a map of paths for different input and output
directories, making it easy to control where files are read from and written to:

**`Main.ts`**

```ts
await new (await import("@playform/pipe")).default().In(
	new Map([["./Input", "./Output"]]),
);
```

### File Filtering

You can filter files to exclude specific ones from your `Pipe`. Filters can be
an array of regular expressions or a single match. You can also use functions to
match on file names:

**`Main.ts`**

```ts
await new (await import("@playform/pipe")).default().Not([
	"File.txt",
	(File: string) => File === "./Input/File.txt",
]);
```

### Controlling Logging

You can control the logging level by setting the `Logger` parameter. The default
value is `2`, but you can set it to `0` if you don't want to see debug messages:

**`Main.ts`**

```ts
new (await import("@playform/pipe")).default(0);
```

[Pipe]: HTTPS://NPMJS.Org/@playform/pipe

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for a history of changes to this component.
