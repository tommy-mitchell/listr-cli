# listr-cli

Command-line task lists made pretty.

<p align="center"><img src="media/demo.gif"></p>

Gracefully handles and displays failures, including if a given command is not found. Allows [setting environment variables](#environment---env--e) cross-platform.

If used in a CI environment, command output is outputted as is.

## Install

```sh
npm install --save-dev listr-cli
```

<details>
<summary>Other Package Managers</summary>

```sh
yarn add -D listr-cli
```
</details>

## Usage

```sh
$ listr <command> […]
```

Commands should be space-separated. Commands with spaces in them must be surrounded by quotes.

Equivalent to `command1 && command2 && …`.

### Options

#### `--all-optional`

Continue executing tasks if one fails. *(default: exit)*

<details>
<summary>Example</summary>

```sh
$ npx listr xo 'ava --tap | node parse.js' tsd --all-optional
✔ xo [2s]
✖ ava
  › Passed: 10, Failed: 2
✔ tsd [2s]
```

</details>

#### `--hide-timer`

Disable showing successful task durations. *(default: show)*

<details>
<summary>Example</summary>

```sh
$ npx listr xo 'ava --tap | node parse.js' tsd --hide-timer
✔ xo
✖ ava
  › Passed: 10, Failed: 2
✔ tsd
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
