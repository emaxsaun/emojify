# emojify

Turn a message into Slack letter emojis (`:alphabet-white-a:`, `:alphabet-yellow-a:`, …) and copy it to the clipboard.

## Install

```bash
npm install -g .
```

## Usage

```bash
emojify                  # prompt for a message (paste, then Enter)
emojify 'ship it!'       # emojify the arguments (single quotes avoid zsh `!` expansion)
emojify -y hello         # yellow letters (default is white)
emojify -m hello         # alternate white/yellow per letter
emojify --no-copy hello  # print only, don't copy to the clipboard
```

Supports `a`–`z` plus `@ ! # ?`. Other characters pass through unchanged; words are separated by three spaces.
