export interface FormatRule {
  pattern: RegExp
  replacement: (match: string, ...groups: string[]) => string
}

// Markdown-like formatting rules
export const FORMAT_RULES: FormatRule[] = [
  // Bold: **text** or __text__
  { pattern: /\*\*(.+?)\*\*/g, replacement: (_, text) => `<strong>${text}</strong>` },
  { pattern: /__(.+?)__/g, replacement: (_, text) => `<strong>${text}</strong>` },

  // Italic: *text* or _text_
  { pattern: /\*(.+?)\*/g, replacement: (_, text) => `<em>${text}</em>` },
  { pattern: /(?<!\w)_(.+?)_(?!\w)/g, replacement: (_, text) => `<em>${text}</em>` },

  // Strikethrough: ~~text~~
  { pattern: /~~(.+?)~~/g, replacement: (_, text) => `<del>${text}</del>` },

  // Inline code: `code`
  { pattern: /`([^`]+)`/g, replacement: (_, code) => `<code class="inline-code">${code}</code>` },

  // Code blocks: ```code```
  {
    pattern: /```(\w*)\n?([\s\S]*?)```/g,
    replacement: (_, lang, code) =>
      `<pre class="code-block" data-lang="${lang || 'text'}"><code>${escapeHtml(code.trim())}</code></pre>`,
  },
]

// Emoji shortcuts - no duplicates
export const EMOJI_SHORTCUTS: Record<string, string> = {
  ':smile:': '😊',
  ':laughing:': '😆',
  ':blush:': '😊',
  ':smiley:': '😃',
  ':relaxed:': '☺️',
  ':smirk:': '😏',
  ':heart_eyes:': '😍',
  ':kissing_heart:': '😘',
  ':stuck_out_tongue_winking_eye:': '😜',
  ':stuck_out_tongue:': '😛',
  ':disappointed:': '😞',
  ':worried:': '😟',
  ':angry:': '😠',
  ':rage:': '😡',
  ':cry:': '😢',
  ':sob:': '😭',
  ':fearful:': '😨',
  ':weary:': '😩',
  ':sleepy:': '😪',
  ':tired_face:': '😫',
  ':unamused:': '😒',
  ':sunglasses:': '😎',
  ':yum:': '😋',
  ':sweat:': '😓',
  ':pensive:': '😔',
  ':confused:': '😕',
  ':confounded:': '😖',
  ':kissing_closed_eyes:': '😚',
  ':flushed:': '😳',
  ':dizzy_face:': '😵',
  ':persevere:': '😣',
  ':disappointed_relieved:': '😥',
  ':open_mouth:': '😮',
  ':hushed:': '😯',
  ':sleeping:': '😴',
  ':drooling:': '🤤',
  ':astonished:': '😲',
  ':clown:': '🤡',
  ':santa:': '🎅',
  ':ghost:': '👻',
  ':skull:': '💀',
  ':poop:': '💩',
  ':alien:': '👽',
  ':robot:': '🤖',
  ':heart:': '❤️',
  ':orange_heart:': '🧡',
  ':yellow_heart:': '💛',
  ':green_heart:': '💚',
  ':blue_heart:': '💙',
  ':purple_heart:': '💜',
  ':black_heart:': '🖤',
  ':broken_heart:': '💔',
  ':fire:': '🔥',
  ':star:': '⭐',
  ':star2:': '🌟',
  ':sparkles:': '✨',
  ':zap:': '⚡',
  ':sunny:': '☀️',
  ':cloud:': '☁️',
  ':rain:': '🌧️',
  ':snow:': '❄️',
  ':thunder:': '⛈️',
  ':rainbow:': '🌈',
  ':ocean:': '🌊',
  ':moon:': '🌙',
  ':trophy:': '🏆',
  ':medal:': '🥇',
  ':clap:': '👏',
  ':wave:': '👋',
  ':muscle:': '💪',
  ':pray:': '🙏',
  ':handshake:': '🤝',
  ':thumbsup:': '👍',
  ':thumbsdown:': '👎',
  ':ok:': '👌',
  ':punch:': '👊',
  ':fist:': '✊',
  ':v:': '✌️',
  ':point_up:': '☝️',
  ':point_down:': '👇',
  ':point_left:': '👈',
  ':point_right:': '👉',
  ':raised_hands:': '🙌',
  ':eyes:': '👀',
  ':tongue:': '👅',
  ':lips:': '👄',
  ':ear:': '👂',
  ':nose:': '👃',
  ':foot:': '🦶',
  ':leg:': '🦵',
  ':bone:': '🦴',
  ':dog:': '🐶',
  ':cat:': '🐱',
  ':mouse:': '🐭',
  ':hamster:': '🐹',
  ':rabbit:': '🐰',
  ':fox:': '🦊',
  ':bear:': '🐻',
  ':panda:': '🐼',
  ':koala:': '🐨',
  ':tiger:': '🐯',
  ':lion:': '🦁',
  ':cow:': '🐮',
  ':pig:': '🐷',
  ':frog:': '🐸',
  ':monkey:': '🐵',
  ':chicken:': '🐔',
  ':penguin:': '🐧',
  ':bird:': '🐦',
  ':eagle:': '🦅',
  ':duck:': '🦆',
  ':owl:': '🦉',
  ':bat:': '🦇',
  ':wolf:': '🐺',
  ':boar:': '🐗',
  ':horse:': '🐴',
  ':unicorn:': '🦄',
  ':bee:': '🐝',
  ':bug:': '🐛',
  ':butterfly:': '🦋',
  ':snail:': '🐌',
  ':shell:': '🐚',
  ':ladybug:': '🐞',
  ':ant:': '🐜',
  ':spider:': '🕷️',
  ':scorpion:': '🦂',
  ':crab:': '🦀',
  ':fish:': '🐟',
  ':tropical_fish:': '🐠',
  ':dolphin:': '🐬',
  ':whale:': '🐋',
  ':shark:': '🦈',
  ':octopus:': '🐙',
  ':squid:': '🦑',
  ':rose:': '🌹',
  ':flower:': '🌸',
  ':blossom:': '🌺',
  ':sunflower:': '🌻',
  ':tulip:': '🌷',
  ':seedling:': '🌱',
  ':evergreen:': '🌲',
  ':deciduous:': '🌳',
  ':palm:': '🌴',
  ':cactus:': '🌵',
  ':mushroom:': '🍄',
  ':apple:': '🍎',
  ':pear:': '🍐',
  ':orange:': '🍊',
  ':lemon:': '🍋',
  ':banana:': '🍌',
  ':watermelon:': '🍉',
  ':grapes:': '🍇',
  ':strawberry:': '🍓',
  ':peach:': '🍑',
  ':melon:': '🍈',
  ':cherry:': '🍒',
  ':pizza:': '🍕',
  ':hamburger:': '🍔',
  ':fries:': '🍟',
  ':hotdog:': '🌭',
  ':taco:': '🌮',
  ':burrito:': '🌯',
  ':popcorn:': '🍿',
  ':donut:': '🍩',
  ':cookie:': '🍪',
  ':cake:': '🎂',
  ':pie:': '🥧',
  ':chocolate:': '🍫',
  ':candy:': '🍬',
  ':lollipop:': '🍭',
  ':coffee:': '☕',
  ':tea:': '🍵',
  ':beer:': '🍺',
  ':beers:': '🍻',
  ':wine:': '🍷',
  ':cocktail:': '🍸',
  ':tropical_drink:': '🍹',
  ':champagne:': '🥂',
  ':bottle:': '🍾',
  ':water:': '💧',
  ':gem:': '💎',
  ':ring:': '💍',
  ':crown:': '👑',
  ':glasses:': '👓',
  ':tie:': '👔',
  ':shirt:': '👕',
  ':jeans:': '👖',
  ':dress:': '👗',
  ':kimono:': '👘',
  ':bikini:': '👙',
  ':womans_hat:': '👒',
  ':mans_shoe:': '👞',
  ':athletic_shoe:': '👟',
  ':high_heel:': '👠',
  ':boot:': '👢',
  ':house:': '🏠',
  ':house_with_garden:': '🏡',
  ':office:': '🏢',
  ':hospital:': '🏥',
  ':bank:': '🏦',
  ':church:': '⛪',
  ':mosque:': '🕌',
  ':synagogue:': '🕍',
  ':kaaba:': '🕋',
  ':clock1:': '🕐',
  ':clock2:': '🕑',
  ':clock3:': '🕒',
  ':clock4:': '🕓',
  ':clock5:': '🕔',
  ':clock6:': '🕕',
  ':clock7:': '🕖',
  ':clock8:': '🕗',
  ':clock9:': '🕘',
  ':clock10:': '🕙',
  ':clock11:': '🕚',
  ':clock12:': '🕛',
  ':rocket:': '🚀',
  ':airplane:': '✈️',
  ':car:': '🚗',
  ':bus:': '🚌',
  ':train:': '🚆',
  ':ship:': '🚢',
  ':bike:': '🚲',
  ':scooter:': '🛴',
  ':skateboard:': '🛹',
  ':airship:': '🛩️',
  ':ufo:': '🛸',
  ':guitar:': '🎸',
  ':piano:': '🎹',
  ':drum:': '🥁',
  ':microphone:': '🎤',
  ':headphones:': '🎧',
  ':saxophone:': '🎷',
  ':trumpet:': '🎺',
  ':violin:': '🎻',
  ':game:': '🎮',
  ':dart:': '🎯',
  ':bowling:': '🎳',
  ':soccer:': '⚽',
  ':basketball:': '🏀',
  ':football:': '🏈',
  ':baseball:': '⚾',
  ':tennis:': '🎾',
  ':volleyball:': '🏐',
  ':golf:': '⛳',
  ':skiing:': '⛷️',
  ':skate:': '⛸️',
  ':surfing:': '🏄',
  ':swimming:': '🏊',
  ':running:': '🏃',
  ':walking:': '🚶',
  ':dancing:': '💃',
  ':weightlifting:': '🏋️',
  ':yoga:': '🧘',
  ':meditation:': '🧘',
  ':sun:': '☀️',
  ':sparkle:': '❇️',
  ':boom:': '💥',
  ':collision:': '💥',
  ':sweat_drops:': '💦',
  ':dash:': '💨',
  ':cyclone:': '🌀',
  ':umbrella:': '☔',
  ':umbrella_with_rain_drops:': '☔',
  ':umbrella2:': '⛱️',
  ':fog:': '🌫️',
  ':wind:': '🌬️',
  ':tornado:': '🌪️',
  ':volcano:': '🌋',
  ':mountain:': '🏔️',
  ':mountain_snow:': '🗻',
  ':camping:': '🏕️',
  ':beach:': '🏖️',
  ':desert:': '🏜️',
  ':island:': '🏝️',
  ':moyai:': '🗿',
  ':fountain:': '⛲',
  ':tent:': '⛺',
  ':ferris_wheel:': '🎡',
  ':roller_coaster:': '🎢',
  ':carousel_horse:': '🎠',
  ':performing_arts:': '🎭',
  ':art:': '🎨',
  ':clapper:': '🎬',
  ':circus_tent:': '🎪',
  ':microphone2:': '🎙️',
  ':headphones2:': '🎧',
  ':radio:': '📻',
  ':sax:': '🎷',
  ':guitar2:': '🎸',
  ':musical_note:': '🎵',
  ':notes:': '🎶',
  ':musical_keyboard:': '🎹',
  ':trumpet2:': '🎺',
  ':violin2:': '🎻',
  ':game_die:': '🎲',
  ':dart2:': '🎯',
  ':bowling2:': '🎳',
  ':video_game:': '🎮',
  ':slot_machine:': '🎰',
  ':jigsaw:': '🧩',
  ':ice_cream:': '🍦',
  ':shaved_ice:': '🍧',
  ':ice_cream2:': '🍨',
  ':doughnut:': '🍩',
  ':cookie2:': '🍪',
  ':birthday:': '🎂',
  ':cake2:': '🍰',
  ':cupcake:': '🧁',
  ':pie2:': '🥧',
  ':chocolate_bar:': '🍫',
}

// Common reactions
export const QUICK_REACTIONS = ['👍', '❤️', '🔥', '😂', '🎉', '😮', '😢', '🤔', '👀', '💯']

// Emoji categories with their emojis
export const EMOJI_CATEGORIES = [
  {
    name: 'Smileys',
    icon: '😀',
    emojis: [
      '😀', '😁', '😂', '🤣', '😃', '😄', '😅', '😆', '😉', '😊',
      '😋', '😎', '😍', '🥰', '😘', '😗', '😙', '😚', '🙂', '🤗',
      '🤩', '🤔', '🤨', '😐', '😑', '😶', '🙄', '😏', '😣', '😥',
      '😮', '🤐', '😯', '😪', '😫', '😴', '😌', '😛', '😜', '😝',
      '🤤', '😒', '😓', '😔', '😕', '🙃', '🤑', '😲', '🙁', '😖',
      '😞', '😟', '😤', '😢', '😭', '😦', '😧', '😨', '😩', '🤯',
      '😬', '😰', '😱', '🥵', '🥶', '😳', '🤪', '😵', '🥴', '😠',
      '😡', '🤬', '😈', '👿', '💀', '☠️', '💩', '🤡', '👹', '👺',
    ],
  },
  {
    name: 'Gestures',
    icon: '👋',
    emojis: [
      '👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤌', '🤏', '✌️', '🤞',
      '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👍',
      '👎', '✊', '👊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝',
      '🙏', '💪', '🦾', '🖕', '✍️', '🤳', '💅', '👂', '🦻', '👃',
      '👣', '👀', '👁️', '👅', '👄', '💋', '🫂', '🧠', '🫀', '🦷',
    ],
  },
  {
    name: 'Hearts',
    icon: '❤️',
    emojis: [
      '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔',
      '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '♥️',
      '🫶', '💑', '💏', '👩‍❤️‍👨', '👨‍❤️‍👨', '👩‍❤️‍👩',
    ],
  },
  {
    name: 'Nature',
    icon: '🌸',
    emojis: [
      '🌸', '💮', '🏵️', '🌹', '🥀', '🌺', '🌻', '🌼', '🌷', '🌱',
      '🪴', '🌲', '🌳', '🌴', '🌵', '🌾', '🌿', '☘️', '🍀', '🍁',
      '🍂', '🍃', '🍄', '🌰', '🐚', '🌍', '🌎', '🌏', '🌕', '🌖',
      '🌗', '🌘', '🌑', '🌒', '🌓', '🌔', '🌙', '🌚', '🌛', '🌜',
      '☀️', '🌝', '🌞', '⭐', '🌟', '✨', '⚡', '☄️', '💥', '🔥',
    ],
  },
  {
    name: 'Food',
    icon: '🍕',
    emojis: [
      '🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍈',
      '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🥦',
      '🥬', '🥒', '🌶️', '🫑', '🌽', '🥕', '🧄', '🧅', '🥔', '🍠',
      '🥐', '🥯', '🍞', '🥖', '🥨', '🧀', '🥚', '🍳', '🧈', '🥞',
      '🧇', '🥓', '🥩', '🍗', '🍖', '🦴', '🌭', '🍔', '🍟', '🍕',
    ],
  },
  {
    name: 'Activities',
    icon: '⚽',
    emojis: [
      '⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱',
      '🪀', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '🪃', '🥅', '⛳',
      '🪁', '🏹', '🎣', '🤿', '🥊', '🥋', '🎽', '🛹', '🛼', '🛷',
      '⛸️', '🥌', '🎿', '🎯', '🪀', '🎮', '🕹️', '🎲', '🧩', '♟️',
    ],
  },
  {
    name: 'Objects',
    icon: '💡',
    emojis: [
      '⌚', '📱', '📲', '💻', '⌨️', '🖥️', '🖨️', '🖱️', '🖲️', '🕹️',
      '🗜️', '💽', '💾', '💿', '📀', '📼', '📷', '📸', '📹', '🎥',
      '📽️', '🎞️', '📞', '☎️', '📟', '📠', '📺', '📻', '🎙️', '🎚️',
      '🎛️', '🧭', '⏱️', '⏲️', '⏰', '🕰️', '⌛', '⏳', '📡', '🔋',
      '🔌', '💡', '🔦', '🕯️', '🪔', '🧯', '🛢️', '💸', '💵', '💴',
    ],
  },
  {
    name: 'Symbols',
    icon: '💯',
    emojis: [
      '💯', '🔴', '🟠', '🟡', '🟢', '🔵', '🟣', '⚫', '⚪', '🟤',
      '🔺', '🔻', '🔸', '🔹', '🔶', '🔷', '🔳', '🔲', '▪️', '▫️',
      '◾', '◽', '◼️', '◻️', '🟥', '🟧', '🟨', '🟩', '🟦', '🟪',
      '⬛', '⬜', '🟫', '➕', '➖', '➗', '✖️', '🟰', '♾️', '‼️',
      '⁉️', '❓', '❔', '❕', '❗', '〰️', '💱', '💲', '⚕️', '♻️',
    ],
  },
]

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

export function convertEmojiShortcuts(text: string): string {
  return text.replace(/:[a-z0-9_]+:/gi, (match) => {
    return EMOJI_SHORTCUTS[match.toLowerCase()] || match
  })
}

export function formatMessageText(text: string): string {
  let formatted = escapeHtml(text)

  // Convert emoji shortcuts first
  formatted = convertEmojiShortcuts(formatted)

  // Apply formatting rules
  for (const rule of FORMAT_RULES) {
    formatted = formatted.replace(rule.pattern, rule.replacement as any)
  }

  // Convert newlines to <br>
  formatted = formatted.replace(/\n/g, '<br>')

  return formatted
}

export function insertFormatting(
  textarea: HTMLTextAreaElement,
  prefix: string,
  suffix: string
): void {
  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const text = textarea.value
  const selectedText = text.substring(start, end)

  const newText =
    text.substring(0, start) + prefix + (selectedText || 'text') + suffix + text.substring(end)

  textarea.value = newText

  // Set cursor position
  if (selectedText) {
    textarea.setSelectionRange(start + prefix.length, end + prefix.length)
  } else {
    textarea.setSelectionRange(start + prefix.length, start + prefix.length + 4)
  }

  textarea.focus()
}

export function insertListFormatting(
  textarea: HTMLTextAreaElement,
  ordered: boolean
): void {
  const start = textarea.selectionStart
  const text = textarea.value
  const lineStart = text.lastIndexOf('\n', start - 1) + 1
  const prefix = ordered ? '1. ' : '- '

  textarea.value = text.substring(0, lineStart) + prefix + text.substring(lineStart)
  textarea.setSelectionRange(start + prefix.length, start + prefix.length)
  textarea.focus()
}

export function insertCodeBlock(textarea: HTMLTextAreaElement): void {
  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const text = textarea.value
  const selectedText = text.substring(start, end)

  const newText =
    text.substring(0, start) +
    '```\n' +
    (selectedText || 'code') +
    '\n```' +
    text.substring(end)

  textarea.value = newText
  textarea.setSelectionRange(start + 4, start + 4 + (selectedText.length || 4))
  textarea.focus()
}
