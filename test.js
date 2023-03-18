/* eslint-disable ava/no-todo-test */
import test from "ava";
import {execa} from "execa";
import {getBinPath} from "get-bin-path";

const binPath = await getBinPath();
const trim = (stdout) => stdout.trim().split("\n").map(line => line.trim());

const verifyCli = (shouldPass) => test.macro(async (t, commands, expectedLines) => {
	const args = commands ? [commands].flat() : undefined;
	const {exitCode, stdout} = await execa(binPath, args, {reject: false});
	const receivedLines = trim(stdout);

	t.is(exitCode, shouldPass ? 0 : 1, "CLI exited with the wrong exit code!");
	t.deepEqual(receivedLines, expectedLines, "CLI output different than expectations!");
});

const cliPasses = verifyCli(true);
const cliFails = verifyCli(false);

const trueCommand = "node -e 'process.exit(0)'";
const falseCommand = "node -e 'process.exit(1)'";

const trueCliLines = [
	"[STARTED] node",
	`[TITLE] Running "${trueCommand}"...`,
	"[TITLE] node",
	"[SUCCESS] node",
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
	"[DATA] hello",
	"[SUCCESS] echo",
]);

test("task title changes when running: one-word", cliFails, falseCommand, falseCliLines);

test("task title changes when running: multi-word", cliPasses, "sleep 1", [
	"[STARTED] sleep",
	"[TITLE] Running \"sleep 1\"...",
	"[TITLE] sleep",
	"[SUCCESS] sleep",
]);

test("reports when command not found", cliFails, "tsd", [
	"[STARTED] tsd",
	"[TITLE] Running \"tsd\"...",
	"[TITLE] tsd: command not found.",
]);

test("reports when multi-word command not found", cliFails, "cowsay hello", [
	"[STARTED] cowsay",
	"[TITLE] Running \"cowsay hello\"...",
	"[TITLE] cowsay: command \"cowsay hello\" not found.",
]);

test("successfully runs multiple commands", cliPasses, ["sleep 1", "echo 2"], [
	"[STARTED] sleep",
	"[TITLE] Running \"sleep 1\"...",
	"[TITLE] sleep",
	"[SUCCESS] sleep",
	"[STARTED] echo",
	"[TITLE] Running \"echo 2\"...",
	"[TITLE] echo",
	"[DATA] 2",
	"[SUCCESS] echo",
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
	"[DATA] 2",
	"[SUCCESS] node",
]);

test("commands with only one non-empty line output are trimmed", cliPasses, "echo '' && echo hello", [
	"[STARTED] echo",
	"[TITLE] Running \"echo '' && echo hello\"...",
	"[TITLE] echo",
	"[DATA] hello",
	"[SUCCESS] echo",
]);

test("commands with multiline outputs aren't trimmed", cliPasses, "node -e '[...Array(5).keys()].forEach(i => console.log(i))'", [
	"[STARTED] node",
	"[TITLE] Running \"node -e '[...Array(5).keys()].forEach(i => console.log(i))'\"...",
	"[TITLE] node",
	"[DATA] 0",
	"[DATA] 1",
	"[DATA] 2",
	"[DATA] 3",
	"[DATA] 4",
	"[DATA]",
	"[SUCCESS] node",
]);

test("outputs stdout", cliPasses, "node -e 'console.log(true)'", [
	"[STARTED] node",
	"[TITLE] Running \"node -e 'console.log(true)'\"...",
	"[TITLE] node",
	"[DATA] true",
	"[SUCCESS] node",
]);

test("outputs stderr", cliPasses, "node -e 'console.error(false)'", [
	"[STARTED] node",
	"[TITLE] Running \"node -e 'console.error(false)'\"...",
	"[TITLE] node",
	"[DATA] false",
	"[SUCCESS] node",
]);

test("outputs stdout and stderr", cliPasses, "node -e 'console.log(true); console.error(false)'", [
	"[STARTED] node",
	"[TITLE] Running \"node -e 'console.log(true); console.error(false)'\"...",
	"[TITLE] node",
	"[DATA] true",
	"[DATA] false",
	"[DATA]",
	"[SUCCESS] node",
]);

const helpText = [
	"Usage",
	"$ listr <command> [...]",
	"",
	"Commands should be space-separated. Commands with spaces in them must be surrounded by quotes.",
	"",
	"Equivalent to 'command1 && command2 && ...'.",
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
