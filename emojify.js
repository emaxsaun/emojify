#!/usr/bin/env node
// emojify — turn a message into Slack :alphabet-<color>-<char>: emojis.
//
// Usage:
//   emojify                      prompt for a message (paste, then Enter)
//   emojify hello world          emojify the arguments
//   emojify -y hello             yellow letters (default is white)
//   emojify -m hello             alternate white/yellow per letter
//   emojify -d pizza party       describe the message with standard Slack emoji
//   emojify --no-copy hello      print only, don't copy to the clipboard

const { execSync } = require('child_process');
const readline = require('readline');

const SYMBOLS = { '@': 'at', '!': 'exclamation', '#': 'hash', '?': 'question' };
const WORD_GAP = '   ';
const MAX_PHRASE_WORDS = 3;

// Standard Slack emoji (no custom ones) and the words that map to them.
// Keywords are lowercase base forms; plurals and -ing/-ed endings are handled
// by the matcher. Underscores join multi-word phrases (e.g. good_morning).

const EMOJI_KEYWORDS = {
  // Greetings & reactions
  wave: 'hi hello hey bye goodbye wave welcome cya',
  sunrise: 'good_morning morning gm',
  crescent_moon: 'good_night night gn tonight',
  pray: 'thanks thank thank_you thx ty please pray grateful',
  '+1': 'yes yeah yep yup ok okay sure agree approve approved lgtm sounds_good',
  '-1': 'no nope nah disagree reject rejected',
  white_check_mark: 'done complete completed finished fixed resolved check',
  x: 'wrong fail failed failing broken',
  heavy_plus_sign: 'plus add added',
  eyes: 'look looking watch watching eye eyes review reviewing',
  thinking_face: 'think thinking hmm wonder maybe',
  bulb: 'idea ideas brainstorm',
  raised_hands: 'yay hooray praise',
  clap: 'clap applause bravo congrats congratulations kudos',
  tada: 'party celebrate celebration shipped',
  muscle: 'strong strength gym workout lift',
  ok_hand: 'perfect nice',
  handshake: 'deal partner partnership agreement',
  shrug: 'idk dunno whatever shrug',
  face_palm: 'facepalm ugh',
  sweat_smile: 'awkward phew nervous',
  sparkles: 'shiny magic fancy sparkle clean',
  '100': 'hundred 100 totally absolutely exactly',
  question: 'question questions confusion',
  exclamation: 'important attention',
  warning: 'warning careful caution danger risk',
  rotating_light: 'emergency incident outage urgent alert',
  no_entry: 'stop blocked block forbidden',

  // Feelings
  smile: 'happy glad smile joy cheerful',
  grin: 'grin excited',
  'star-struck': 'awesome amazing great incredible',
  joy: 'lol lmao haha hahaha funny hilarious laugh laughing',
  rolling_on_the_floor_laughing: 'rofl',
  heart_eyes: 'love loving adore beautiful gorgeous',
  heart: 'heart care',
  broken_heart: 'heartbreak heartbroken breakup',
  sob: 'cry crying sob sad tears',
  cry: 'upset unhappy',
  angry: 'angry mad annoyed furious',
  rage: 'rage livid',
  scream: 'scream scary terrified horror',
  fearful: 'afraid fear worried scared',
  open_mouth: 'wow whoa surprise surprised omg',
  exploding_head: 'mindblown mind_blown shocked',
  sleeping: 'sleep sleepy asleep nap',
  yawning_face: 'tired exhausted boring bored',
  sunglasses: 'chill relaxed',
  nerd_face: 'nerd geek smart',
  face_with_rolling_eyes: 'eyeroll seriously really',
  smirk: 'smirk sly',
  wink: 'wink kidding jk',
  innocent: 'innocent angel',
  nauseated_face: 'sick gross ill',
  face_with_thermometer: 'fever flu',
  mask: 'covid virus',
  hugging_face: 'hug hugs',
  zany_face: 'crazy silly wild',
  skull: 'dead dying skull rip',
  ghost: 'ghost ghosted spooky',
  confused: 'confused confusing unclear lost',
  relieved: 'relief relieved calm',
  disappointed: 'disappointed disappointing bummer',
  partying_face: 'partying woohoo',
  money_mouth_face: 'rich profit',
  zipper_mouth_face: 'secret quiet shh',
  grimacing: 'yikes cringe eek',

  // Work & tech
  computer: 'computer laptop code coding program programming dev developer',
  keyboard: 'type typing keyboard',
  bug: 'bug bugs debug buggy',
  rocket: 'ship deploy deployed release released fast rocket launch',
  fire: 'fire hot lit burning',
  building_construction: 'build construction wip',
  hammer_and_wrench: 'fix tool tools maintenance repair',
  gear: 'settings config configure setup',
  lock: 'lock locked secure security password private',
  key: 'key keys access',
  link: 'link url',
  email: 'email mail inbox',
  phone: 'phone call calling',
  speech_balloon: 'chat talk message slack comment',
  loudspeaker: 'announce announcement',
  mega: 'shout',
  calendar: 'calendar meeting meetings schedule date today tomorrow week',
  clock3: 'time clock hour',
  hourglass: 'waiting soon later',
  alarm_clock: 'alarm deadline wake',
  chart_with_upwards_trend: 'growth grow increase rising stonks',
  chart_with_downwards_trend: 'decrease drop falling',
  bar_chart: 'data chart stats metrics dashboard analytics',
  memo: 'note notes write writing doc docs document draft',
  clipboard: 'list todo checklist plan',
  books: 'book books read reading learn study',
  mag: 'search find investigate research',
  pushpin: 'pin pinned',
  paperclip: 'attach attachment',
  file_folder: 'file files folder',
  package: 'package npm box delivery',
  briefcase: 'work job office business',
  moneybag: 'money cash pay paid salary budget',
  dollar: 'dollar dollars cost price',
  credit_card: 'card buy purchase',
  shopping_trolley: 'shop shopping cart',
  trophy: 'win winner won trophy champion',
  medal: 'medal award',
  dart: 'goal target focus',
  brain: 'brain mind',
  robot_face: 'robot bot ai claude automation',
  battery: 'battery energy',
  zap: 'power electric lightning quick',
  wrench: 'wrench',
  test_tube: 'test testing tests experiment',
  microscope: 'science lab',
  stethoscope: 'doctor medical clinic',
  pill: 'pill medicine meds drug',
  syringe: 'vaccine shot injection',
  hospital: 'hospital er',
  ambulance: 'ambulance',
  heartbeat: 'heartbeat pulse',

  // Food & drink
  coffee: 'coffee espresso latte caffeine',
  tea: 'tea',
  beer: 'beer beers drinks',
  wine_glass: 'wine',
  cocktail: 'cocktail',
  champagne: 'champagne cheers',
  pizza: 'pizza',
  hamburger: 'burger hamburger',
  hotdog: 'hotdog',
  taco: 'taco tacos',
  burrito: 'burrito',
  sushi: 'sushi',
  ramen: 'ramen noodles',
  spaghetti: 'pasta spaghetti',
  bread: 'bread toast',
  croissant: 'croissant',
  bagel: 'bagel',
  egg: 'egg eggs',
  fries: 'fries',
  popcorn: 'popcorn movie',
  doughnut: 'donut doughnut',
  cookie: 'cookie cookies',
  cake: 'cake',
  birthday: 'birthday bday',
  ice_cream: 'icecream',
  icecream: 'ice_cream',
  chocolate_bar: 'chocolate',
  candy: 'candy sweet',
  apple: 'apple',
  banana: 'banana',
  avocado: 'avocado guac',
  hot_pepper: 'spicy',
  fork_and_knife: 'lunch dinner breakfast food eat eating hungry',
  green_salad: 'salad healthy',
  cheese_wedge: 'cheese',

  // Nature & weather
  sunny: 'sun sunny summer',
  cloud: 'cloud cloudy',
  rain_cloud: 'rain rainy',
  umbrella: 'umbrella',
  snowflake: 'snow cold winter freezing',
  snowman: 'snowman',
  rainbow: 'rainbow pride',
  ocean: 'ocean sea',
  earth_americas: 'world earth global planet',
  evergreen_tree: 'tree trees forest',
  fallen_leaf: 'fall autumn',
  cherry_blossom: 'spring blossom',
  sunflower: 'flower flowers',
  seedling: 'plant growing',
  star: 'star stars',
  star2: 'favorite',
  boom: 'boom explosion',
  tornado: 'chaos tornado',

  // Animals
  dog: 'dog dogs puppy pup',
  cat: 'cat cats kitty kitten',
  mouse: 'mouse',
  rabbit: 'bunny rabbit',
  fox_face: 'fox',
  bear: 'bear',
  panda_face: 'panda',
  monkey_face: 'monkey',
  see_no_evil: 'oops embarrassed',
  horse: 'horse',
  unicorn_face: 'unicorn',
  cow: 'cow',
  pig: 'pig',
  chicken: 'chicken',
  penguin: 'penguin',
  bird: 'bird',
  duck: 'duck',
  owl: 'owl',
  frog: 'frog',
  turtle: 'turtle slow',
  snake: 'snake python',
  dragon: 'dragon',
  whale: 'whale',
  dolphin: 'dolphin',
  fish: 'fish',
  shark: 'shark',
  octopus: 'octopus',
  crab: 'crab rust',
  bee: 'bee bees',
  butterfly: 'butterfly',
  snail: 'snail',
  sloth: 'sloth lazy',
  llama: 'llama',
  goat: 'goat',

  // Places, travel & activities
  house: 'home house wfh',
  office: 'building',
  school: 'school',
  car: 'car drive driving',
  bus: 'bus',
  train: 'train',
  airplane: 'plane flight fly flying travel trip',
  ship: 'boat cruise',
  bike: 'bike cycling',
  runner: 'run running jog',
  walking: 'walk walking',
  beach_with_umbrella: 'beach vacation',
  palm_tree: 'tropical island',
  desert_island: 'pto ooo offline',
  mountain: 'mountain hike hiking',
  camping: 'camp camping',
  world_map: 'map',
  soccer: 'soccer football',
  basketball: 'basketball',
  football: 'nfl',
  baseball: 'baseball',
  tennis: 'tennis',
  golf: 'golf',
  video_game: 'game games gaming',
  musical_note: 'music song sing singing',
  headphones: 'listen listening podcast',
  guitar: 'guitar',
  art: 'art design draw drawing paint',
  camera: 'photo picture camera',
  movie_camera: 'video film',
  tv: 'tv',
  gift: 'gift present',
  balloon: 'balloon',
  confetti_ball: 'confetti',
  christmas_tree: 'christmas xmas',
  jack_o_lantern: 'halloween pumpkin',
  turkey: 'thanksgiving',
  fireworks: 'fireworks newyear',
  crown: 'king queen boss',
  gem: 'gem diamond',
  bell: 'bell notification ping',
  bomb: 'bomb',
  moyai: 'moai stone',
  anchor: 'anchor',
  hourglass_flowing_sand: 'loading',
  arrows_counterclockwise: 'refresh retry restart reload sync',
  repeat: 'repeat',
  new: 'new',
  free: 'free',
  cool: 'cool',
  sos: 'help sos',
  zzz: 'zzz',
  dash: 'dash hurry rush',
  sweat_drops: 'sweat',
  speaking_head_in_silhouette: 'speak speech',
  thought_balloon: 'thought',
  crossed_fingers: 'hope hopefully luck lucky fingers_crossed',
  saluting_face: 'salute aye',
  melting_face: 'melting melt',
};

// keyword (phrases joined by spaces) -> emoji name
const KEYWORD_INDEX = new Map();
for (const [emoji, keywords] of Object.entries(EMOJI_KEYWORDS)) {
  for (const keyword of keywords.split(/\s+/).filter(Boolean)) {
    KEYWORD_INDEX.set(keyword.replace(/_/g, ' '), emoji);
  }
}

function parseArgs(argv) {
  const opts = { color: 'white', copy: true, words: [] };
  for (const arg of argv) {
    if (arg === '-y' || arg === '--yellow') opts.color = 'yellow';
    else if (arg === '-w' || arg === '--white') opts.color = 'white';
    else if (arg === '-m' || arg === '--mix') opts.color = 'mix';
    else if (arg === '-d' || arg === '--describe') opts.describe = true;
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

// Word forms to try, most specific first: "parties" -> "party", "coding" -> "code".
function stems(word) {
  const forms = [word];
  const strip = (suffix, ...replacements) => {
    if (word.length <= suffix.length + 2 || !word.endsWith(suffix)) return;
    const base = word.slice(0, -suffix.length);
    forms.push(base, ...replacements.map((r) => base + r));
    if (/([b-df-hj-np-tv-z])\1$/.test(base)) forms.push(base.slice(0, -1)); // shipping -> ship
  };
  strip('ies', 'y');
  strip('es');
  strip('s');
  strip('ing', 'e');
  strip('ed', 'e');
  return forms;
}

function lookup(words) {
  if (words.length > 1) return KEYWORD_INDEX.get(words.join(' '));
  for (const form of stems(words[0])) {
    if (KEYWORD_INDEX.has(form)) return KEYWORD_INDEX.get(form);
  }
}

function describe(message) {
  return message
    .split('\n')
    .map((line) => {
      const words = line.toLowerCase().replace(/['’]/g, '').match(/[a-z0-9+]+/g) || [];
      const emojis = [];
      for (let i = 0; i < words.length; ) {
        let matched = false;
        // Prefer the longest phrase starting here ("good morning" over "good")
        for (let len = Math.min(MAX_PHRASE_WORDS, words.length - i); len > 0; len--) {
          const emoji = lookup(words.slice(i, i + len));
          if (emoji) {
            if (emojis[emojis.length - 1] !== emoji) emojis.push(emoji);
            i += len;
            matched = true;
            break;
          }
        }
        if (!matched) i++;
      }
      return emojis.map((e) => `:${e}:`).join('');
    })
    .filter(Boolean)
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
    console.log('Usage: emojify [-w|-y|-m|-d] [--no-copy] [message]');
    return;
  }

  const message = opts.words.length
    ? opts.words.join(' ')
    : await prompt('Message: ');
  if (!message.trim()) return;

  const output = opts.describe ? describe(message) : emojify(message, opts.color);
  if (!output) {
    console.log('🤷 No emoji matches for that message.');
    process.exitCode = 1;
    return;
  }
  console.log(`\n${output}\n`);
  if (opts.copy) {
    console.log(copyToClipboard(output) ? '📋 Copied to clipboard — paste into Slack.' : '⚠️  Could not copy to clipboard.');
  }
}

main();
