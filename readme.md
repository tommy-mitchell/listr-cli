# listr-cli

Command-line task lists made pretty.

<p align="center"><img src="media/demo.gif"></p>

Gracefully handles and displays failures, including if a given command is not found. Supports local binaries from `node_modules/bin` without specifying `npx`, and allows [setting environment variables](#environment---env--e) cross-platform.

If used in a CI environment, command output is outputted as is.

## Install

```sh
npm install --save-dev listr-cli
```

<details>
<summary>Other Package Managers</summary>

```sh
yarn add --dev listr-cli
```
</details>

## Usage

```sh
$ npx listr [title::]<command> […]
```

Commands should be space-separated. Commands with spaces in them must be surrounded by quotes.

Equivalent to `command1 && command2 && …`.

### Named Tasks

Tasks can be prefixed with a custom name, in the form `title::command`. Multi-word titles must be surrounded by quotes. By default, task titles use the first word of a command.

<details>
<summary>Example</summary>

```sh
$ listr 'lint::xo --fix' tsd
✔ lint [5s]
✔ tsd [2s]
```

</details>

### Options

#### `--hide-timer`

Disable showing successful task durations. By default, durations are shown.

<details>
<summary>Example</summary>

```sh
$ npx listr xo tsd --hide-timer
✔ xo
✔ tsd
```

</details>

#### `--no-persist`

Disable persisting task output. By default, task outputs persist after completion.

<details>
<summary>Example</summary>

```sh
$ npx listr xo ava --no-persist
✔ xo [2s]
⠼ ava
  › ✔ cli › main
```

</details>

#### `--all-optional` (`--opt`)

Continue executing tasks if one fails. By default, the task list will cancel early.

<details>
<summary>Example</summary>

```sh
$ listr xo 'ava --tap | node parse.js' tsd --all-optional
✔ xo [2s]
✖ ava
  › Passed: 10, Failed: 2
✔ tsd [2s]
```

</details>

#### `--environment` (`--env`, `-e`)

Set environment variables cross-platform via `process.env`. Follows the same syntax as [Rollup](https://rollupjs.org/command-line-interface/#environment-values):

```sh
$ listr ava --env CI,NODE_OPTIONS:'--loader=tsx'
#=> process.env.CI = "true"
#=> process.env.NODE_OPTIONS = "--loader=tsx"
```

## Related

- [listr2](https://github.com/cenk1cenk2/listr2) - Create beautiful CLI interfaces via easy and logical to implement task lists that feel alive and interactive.
