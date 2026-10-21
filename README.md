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

Describe mode (`-d`) matches words and phrases against ~8,000 keywords mapped to Slack's built-in emoji, so it works in any workspace. Each run is a little different: words with several matching emoji get a random one, and the message ends with a mood emoji (good news, bad news, or a question).

```
$ emojify -d 'lol the build is broken again, fixing the bug now'
:joy::building_construction::x::hammer_and_wrench::bug::face_palm:
```

Words without a match are skipped.

### Keywords

- `EMOJI_KEYWORDS` in `emojify.js` is the hand-picked list. It wins most of the time when a word has several matches. Edit it directly (use underscores for phrases, e.g. `good_morning`).
- `EXTRA_KEYWORDS` is generated from [emojilib](https://github.com/muan/emojilib) keywords and [emoji-datasource](https://github.com/iamcal/emoji-data) emoji names (both MIT). Regenerate it with `node scripts/generate-keywords.js`. It skips emoji newer than Unicode 14 in case Slack doesn't have them yet.
