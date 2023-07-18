import process from "node:process";
import anyTest, { type TestFn } from "ava";
import { execa } from "execa";
import { getBinPath } from "get-bin-path";
import { isExecutable } from "is-executable";
import stripAnsi from "strip-ansi";

const test = anyTest as TestFn<{
	binPath: string;
}>;

test.before("setup context", async t => {
	const binPath = await getBinPath();
	t.truthy(binPath, "No bin path found!");

	t.context.binPath = binPath!.replace("dist", "src").replace(".js", ".ts");
	t.true(await isExecutable(t.context.binPath), "Source binary not executable!");
});

// eslint-disable-next-line no-return-assign
test.before("disable CI check", () => process.env.CI = "false");

const trim = (stdout: string) => stdout.trim().split("\n").map(line => stripAnsi(line).trim());

const verifyCli = (shouldPass: boolean, setup = async () => "", teardown = async () => "") => (
	test.macro(async (t, commands: string | string[], expectedLines: string[]) => {
		await setup();

		const args = commands ? [commands].flat() : undefined;
		const { exitCode, stdout } = await execa(t.context.binPath, args, { reject: false });
		const receivedLines = trim(stdout);

		t.deepEqual(receivedLines, expectedLines, "CLI output different than expectations!");
		t.is(exitCode, shouldPass ? 0 : 1, "CLI exited with the wrong exit code!");

		await teardown();
	})
);

const cliPasses = verifyCli(true);
const cliFails = verifyCli(false);

const trueCommand = "node -e 'process.exit(0)'";
const falseCommand = "node -e 'process.exit(1)'";

const trueCliLines = [
	"[STARTED] node",
	`[TITLE] Running "${trueCommand}"...`,
	"[TITLE] node",
	"",
	"[COMPLETED] node",
];

const falseCliLines = [
	"[STARTED] node",
	`[TITLE] Running "${falseCommand}"...`,
	"[TITLE] node",
];

test("main", cliPasses, trueCommand, trueCliLines);

test("fails", cliFails, falseCommand, falseCliLines);

test("task reports command output", cliPasses, "echo hello", [
	"[STARTED] echo",
	"[TITLE] Running \"echo hello\"...",
	"[TITLE] echo",
	"[OUTPUT] hello",
	"[COMPLETED] echo",
]);

test("task title changes when running: one-word", cliFails, falseCommand, falseCliLines);

test("task title changes when running: multi-word", cliPasses, "sleep 1", [
	"[STARTED] sleep",
	"[TITLE] Running \"sleep 1\"...",
	"[TITLE] sleep",
	"",
	"[COMPLETED] sleep",
]);

test("reports when command not found", cliFails, "tsd", [
	"[STARTED] tsd",
	"[TITLE] Running \"tsd\"...",
	"[TITLE] tsd: command not found.",
]);

test("reports when multi-word command not found", cliFails, "foobar hello", [
	"[STARTED] foobar",
	"[TITLE] Running \"foobar hello\"...",
	"[TITLE] foobar: command \"foobar hello\" not found.",
]);

test("successfully runs multiple commands", cliPasses, ["sleep 1", "echo 2"], [
	"[STARTED] sleep",
	"[TITLE] Running \"sleep 1\"...",
	"[TITLE] sleep",
	"",
	"[COMPLETED] sleep",
	"[STARTED] echo",
	"[TITLE] Running \"echo 2\"...",
	"[TITLE] echo",
	"[OUTPUT] 2",
	"[COMPLETED] echo",
]);

test("fails early if a command fails", cliFails, [trueCommand, falseCommand, "echo 2"], [
	...trueCliLines,
	...falseCliLines,
]);

test("flags: --all-optional", cliPasses, [falseCommand, trueCommand, falseCommand, "--all-optional"], [
	...falseCliLines,
	...trueCliLines,
	...falseCliLines,
]);

test.todo("flags: --hide-timer");
test.todo("only show timer for succesful commands");

test("commands can have shell symbols in them", cliPasses, `${trueCommand} && echo 2`, [
	"[STARTED] node",
	`[TITLE] Running "${trueCommand} && echo 2"...`,
	"[TITLE] node",
	"[OUTPUT] 2",
	"[COMPLETED] node",
]);

test("commands with only one non-empty line output are trimmed", cliPasses, "echo '' && echo hello", [
	"[STARTED] echo",
	"[TITLE] Running \"echo '' && echo hello\"...",
	"[TITLE] echo",
	"[OUTPUT] hello",
	"[COMPLETED] echo",
]);

test("commands with multiline outputs aren't trimmed", cliPasses, "node -e '[...Array(5).keys()].forEach(i => console.log(i))'", [
	"[STARTED] node",
	"[TITLE] Running \"node -e '[...Array(5).keys()].forEach(i => console.log(i))'\"...",
	"[TITLE] node",
	"[OUTPUT] 0",
	"[OUTPUT] 1",
	"[OUTPUT] 2",
	"[OUTPUT] 3",
	"[OUTPUT] 4",
	"",
	"[COMPLETED] node",
]);

test("outputs stdout", cliPasses, "node -e 'console.log(true)'", [
	"[STARTED] node",
	"[TITLE] Running \"node -e 'console.log(true)'\"...",
	"[TITLE] node",
	"[OUTPUT] true",
	"[COMPLETED] node",
]);

test("outputs stderr", cliPasses, "node -e 'console.error(false)'", [
	"[STARTED] node",
	"[TITLE] Running \"node -e 'console.error(false)'\"...",
	"[TITLE] node",
	"[OUTPUT] false",
	"[COMPLETED] node",
]);

test("outputs stdout and stderr", cliPasses, "node -e 'console.log(true); console.error(false)'", [
	"[STARTED] node",
	"[TITLE] Running \"node -e 'console.log(true); console.error(false)'\"...",
	"[TITLE] node",
	"[OUTPUT] true",
	"[OUTPUT] false",
	"",
	"[COMPLETED] node",
]);

// eslint-disable-next-line no-return-assign
const cliPassesCi = verifyCli(true, async () => process.env.CI = "true", async () => process.env.CI = "false");

test.serial("uses silent renderer in CI", cliPassesCi, "node -e 'console.log(true)'", ["true"]);

const helpText = [
	"Usage",
	"$ listr <command> […]",
	"",
	"Commands should be space-separated. Commands with spaces in them must be surrounded by quotes.",
	"",
	"Equivalent to 'command1 && command2 && …'.",
	"",
	"Options",
	"--all-optional  Continue executing tasks if one fails.      [default: exit]",
	"--hide-timer    Disable showing successful task durations.  [default: show]",
	"",
	"Examples",
	"Run test commands in order",
	"$ listr xo 'c8 ava'",
	"",
	"Run commands that can fail",
	"$ listr xo ava tsd --all-optional",
];

test("running without arguments displays help text", cliPasses, "", helpText);

test("flags: -h", cliPasses, "-h", helpText);

test.todo("verify help text indentation is consistent");

test.todo("task output displays color");

const envVarsFixture = {
	envVars: "FOO,BAR:baz",
	commands: ["echo $FOO", "echo $BAR"],
	output: [
		"[STARTED] echo",
		"[TITLE] Running \"echo $FOO\"...",
		"[TITLE] echo",
		"[OUTPUT] true",
		"[COMPLETED] echo",
		"[STARTED] echo",
		"[TITLE] Running \"echo $BAR\"...",
		"[TITLE] echo",
		"[OUTPUT] baz",
		"[COMPLETED] echo",
	],
};

test("processes environment variables", cliPasses,
	[`--environment=${envVarsFixture.envVars}`, ...envVarsFixture.commands], envVarsFixture.output,
);

test("processes environment variables: --env alias", cliPasses,
	[`--env=${envVarsFixture.envVars}`, ...envVarsFixture.commands], envVarsFixture.output,
);
test("processes environment variables: -e short flag", cliPasses,
	[`-e=${envVarsFixture.envVars}`, ...envVarsFixture.commands], envVarsFixture.output,
);
