import type { DialogueSet } from './types';

export const DIALOGUES_EN: DialogueSet = {
  welcome: {
    title: '[Meridian-7 System Log]',
    lines: [
      '>> [Meridian-7 System Log — Cycle 47]',
      '>> Fuel reserves: 2.3%',
      '>> Life support: 312 hours remaining',
      '>> Standard distress frequencies: No response',
      '',
      '>> [Anomaly Detected]',
      '>> Spectrum scan found unknown signal source…',
      '>> Protocol identification failed…',
      '>> Language structure: Non-human encoding',
      '',
      'Across all anomalous data, one marker repeats:',
    ],
  },

  rexReveal: '            r E x',

  storyLines: [
    "This isn't an attack. Not noise.",
    'It is a language.',
    '',
    'If you can crack it,',
    'maybe we still have a chance to go home.',
  ],

  startButton: '🤖 Initialize Signal Parser',

  chapterIntro: {
    1: {
      title: '[📡 Chapter 1 — Signal Contact]',
      lines: [
        '>> Meridian-7 sensor array detected anomalous electromagnetic waves.',
        '>> The signal is extremely faint, flickering amid cosmic background noise.',
        '>> Your first mission: isolate the signal from chaos.',
      ],
    },
    2: {
      title: '[🔍 Chapter 2 — Pattern Recognition]',
      lines: [
        ">> The signal is back — and it's stronger.",
        '>> rEx seems to have noticed your response.',
        '>> New data is more structured — it is testing you.',
      ],
    },
    3: {
      title: '[⚡ Chapter 3 — Syntax Awakening]',
      lines: [
        ">> rEx's signal has evolved.",
        '>> No longer fragments and codes — this is structured information.',
        '>> It is trying to tell you something. You need to understand its syntax.',
      ],
    },
    4: {
      title: '[🛰️ Chapter 4 — Transmission]',
      lines: [
        ">> You can read rEx's language now.",
        '>> Now you need to establish a formal communication protocol.',
        ">> Meridian-7's distress signal must be sent in a format rEx can understand.",
        '>> Fuel remaining: 0.8%. No second chances.',
      ],
    },
    5: {
      title: '[🌌 Chapter 5 — rEx Response]',
      lines: [
        '>> …the signal is back.',
        '>> Not the one you sent. A new one.',
        '>> rEx received your message. It is responding.',
        '>> But its response is more complex than anything before.',
        '>> Prove you understand — and it will help you.',
      ],
    },
    6: {
      title: '[🔧 Chapter 6 — Origin]',
      lines: [
        '>> rEx station provided an alien propulsion module.',
        '>> Fuel replenished. But the engine won\'t start.',
        '>> Reason: alien parts communicate via rEx protocol,',
        '>> and Meridian-7\'s systems can\'t recognize it.',
        '>> Final step — protocol adaptation. Make human systems read alien hardware.',
      ],
    },
  },

  chapterComplete: {
    1: "Signal source confirmed. This isn't natural — someone is speaking to you.",
    2: "Tests passed. rEx's encoding rules — tokens, identifiers, number systems — you've mastered them.",
    3: "Syntax mastered. You're no longer just decoding — you're beginning to understand what rEx is 'saying'.",
    4: "Communication protocol established. Your distress signal has been sent. Now… wait for a response.",
    5: 'All signals decrypted. rEx says: "Protocol established. We will help."',
    6: 'Protocol adaptation complete. Alien propulsion module online. Meridian-7, liftoff.',
  },

  rexSignals: [
    '…you are parsing…',
    '…pattern detected…',
    '…signal accepted…',
    '…you are close…',
    '…syntax recognized…',
    '…transmission received…',
  ],

  rexFinalSignals: [
    '…you understand now…',
    '…the language is yours…',
    '…protocol established. We will help.…',
  ],
};
