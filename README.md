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
emojify -d pizza party   # describe the message with standard Slack emoji
emojify --no-copy hello  # print only, don't copy to the clipboard
```

Letter mode supports `a`–`z` plus `@ ! # ?`. Other characters pass through unchanged; words are separated by three spaces.

Describe mode (`-d`) matches words and phrases against ~700 keywords mapped to Slack's built-in emoji, so it works in any workspace:

```
$ emojify -d 'lol the build is broken again, fixing the bug now'
:joy::building_construction::x::hammer_and_wrench::bug:
```

Words without a match are skipped. To add more, edit `EMOJI_KEYWORDS` in `emojify.js` (use underscores for phrases, e.g. `good_morning`).
