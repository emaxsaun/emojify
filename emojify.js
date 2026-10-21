#!/usr/bin/env node
// emojify — turn a message into Slack :alphabet-<color>-<char>: emojis.
//
// Usage:
//   emojify                      prompt for a message (paste, then Enter)
//   emojify hello world          emojify the arguments
//   emojify -y hello             yellow letters (default is white)
//   emojify -m hello             alternate white/yellow per letter
//   emojify --no-copy hello      print only, don't copy to the clipboard

const { execSync } = require('child_process');
const readline = require('readline');

const SYMBOLS = { '@': 'at', '!': 'exclamation', '#': 'hash', '?': 'question' };
const WORD_GAP = '   ';

function parseArgs(argv) {
  const opts = { color: 'white', copy: true, words: [] };
  for (const arg of argv) {
    if (arg === '-y' || arg === '--yellow') opts.color = 'yellow';
    else if (arg === '-w' || arg === '--white') opts.color = 'white';
    else if (arg === '-m' || arg === '--mix') opts.color = 'mix';
    else if (arg === '--no-copy') opts.copy = false;
    else if (arg === '-h' || arg === '--help') opts.help = true;
    else opts.words.push(arg);
  }
  return opts;
}

function emojify(message, color) {
  let i = 0;
  return message
    .split('\n')
    .map((line) =>
      line
        .trim()
        .split(/\s+/)
        .map((word) =>
          [...word]
            .map((ch) => {
              const lower = ch.toLowerCase();
              const name = /[a-z]/.test(lower) ? lower : SYMBOLS[ch];
              if (!name) return ch; // digits, punctuation, etc. pass through
              const c = color === 'mix' ? (i++ % 2 ? 'yellow' : 'white') : color;
              return `:alphabet-${c}-${name}:`;
            })
            .join('')
        )
        .join(WORD_GAP)
    )
    .join('\n');
}

function copyToClipboard(text) {
  const cmd =
    process.platform === 'darwin'
      ? 'pbcopy'
      : process.platform === 'win32'
        ? 'clip'
        : 'xclip -selection clipboard';
  try {
    execSync(cmd, { input: text });
    return true;
  } catch {
    return false;
  }
}

function prompt(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) =>
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    })
  );
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.help) {
    console.log('Usage: emojify [-w|-y|-m] [--no-copy] [message]');
    return;
  }

  const message = opts.words.length
    ? opts.words.join(' ')
    : await prompt('Message: ');
  if (!message.trim()) return;

  const output = emojify(message, opts.color);
  console.log(`\n${output}\n`);
  if (opts.copy) {
    console.log(copyToClipboard(output) ? '📋 Copied to clipboard — paste into Slack.' : '⚠️  Could not copy to clipboard.');
  }
}

main();
