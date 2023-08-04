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
	test.macro(async (t, commands: string[]) => {
		await setup();

		const { exitCode, stdout } = await execa(t.context.binPath, commands, { reject: false });
		const receivedLines = trim(stdout);

		const assertions = await t.try(tt => {
			tt.snapshot(receivedLines);
			tt.is(exitCode, shouldPass ? 0 : 1, "CLI exited with the wrong exit code!");
		});

		if (!assertions.passed) {
			t.log("commands:", commands);
		}

		assertions.commit();
		await teardown();
	})
);

const cliPasses = verifyCli(true);
const cliFails = verifyCli(false);

const trueCommand = "node -e 'process.exit(0)'";
const falseCommand = "node -e 'process.exit(1)'";

test("main", cliPasses, [
	trueCommand,
]);

test("fails", cliFails, [
	falseCommand,
]);

test("task reports command output", cliPasses, [
	"echo hello",
]);

test("task title changes when running: one-word", cliFails, [
	falseCommand,
]);

test("task title changes when running: multi-word", cliPasses, [
	"sleep 1",
]);

test("reports when command not found", cliFails, [
	"tsd",
]);

test("reports when multi-word command not found", cliFails, [
	"foobar hello",
]);

test("successfully runs multiple commands", cliPasses, [
	"sleep 1",
	"echo 2",
]);

test("fails early if a command fails", cliFails, [
	trueCommand,
	falseCommand,
	"echo 2",
]);

test("flags: --all-optional", cliPasses, [
	falseCommand,
	trueCommand,
	falseCommand,
	"--all-optional",
]);

test.todo("flags: --hide-timer");
test.todo("only show timer for succesful commands");

test("commands can have shell symbols in them", cliPasses, [
	`${trueCommand} && echo 2`,
]);

test("commands with only one non-empty line output are trimmed", cliPasses, [
	"echo '' && echo hello",
]);

test("commands with multiline outputs aren't trimmed", cliPasses, [
	"node -e '[...Array(5).keys()].forEach(i => console.log(i))'",
]);

test("outputs stdout", cliPasses, [
	"node -e 'console.log(true)'",
]);

test("outputs stderr", cliPasses, [
	"node -e 'console.error(false)'",
]);

test("outputs stdout and stderr", cliPasses, [
	"node -e 'console.log(true); console.error(false)'",
]);

// eslint-disable-next-line no-return-assign
const cliPassesCi = verifyCli(true, async () => process.env.CI = "true", async () => process.env.CI = "false");

test.serial("uses silent renderer in CI", cliPassesCi, [
	"node -e 'console.log(true)'",
]);

test("running without arguments displays help text", cliPasses, []);

test("flags: -h", cliPasses, [
	"-h",
]);

test.todo("verify help text indentation is consistent");

test.todo("task output displays color");

const envVarsFixture = {
	envVars: "FOO,BAR:baz",
	commands: ["echo $FOO", "echo $BAR"],
} as const;

test("processes environment variables", cliPasses, [
	`--environment=${envVarsFixture.envVars}`,
	...envVarsFixture.commands,
]);

test("processes environment variables: --env alias", cliPasses, [
	`--env=${envVarsFixture.envVars}`,
	...envVarsFixture.commands,
]);

test("processes environment variables: -e short flag", cliPasses, [
	`-e=${envVarsFixture.envVars}`,
	...envVarsFixture.commands,
]);

test("processes environment variables: multiple", cliPasses, [
	`-e=${envVarsFixture.envVars}`,
	"--env=FIZZ",
	...envVarsFixture.commands,
	"echo $FIZZ",
]);

test("supports custom task names", cliPasses, [
	`pass::${trueCommand}`,
	`fail::${falseCommand}`,
	"--all-optional",
]);

test("custom task names ignores quoted tasks", cliPasses, [
	"\"echo ::\"",
	"'echo ::'",
]);
