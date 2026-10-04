// Hangul 2-Bolsik Auto-Composer & QWERTY to Korean Converter
// Enables typing Korean seamlessly even in English-only Android Emulators

const HangulConverter = (function() {
  const CHO = [
    'ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ',
    'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'
  ];

  const JUNG = [
    'ㅏ', 'ㅐ', 'ㅑ', 'ㅒ', 'ㅓ', 'ㅔ', 'ㅕ', 'ㅖ', 'ㅗ', 'ㅘ',
    'ㅙ', 'ㅚ', 'ㅛ', 'ㅜ', 'ㅝ', 'ㅞ', 'ㅟ', 'ㅠ', 'ㅡ', 'ㅢ', 'ㅣ'
  ];

  const JONG = [
    '', 'ㄱ', 'ㄲ', 'ㄳ', 'ㄴ', 'ㄵ', 'ㄶ', 'ㄷ', 'ㄹ', 'ㄺ',
    'ㄻ', 'ㄼ', 'ㄽ', 'ㄾ', 'ㄿ', 'ㅀ', 'ㅁ', 'ㅂ', 'ㅄ', 'ㅅ',
    'ㅆ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'
  ];

  const KEY_MAP = {
    'r': 'ㄱ', 'R': 'ㄲ', 's': 'ㄴ', 'e': 'ㄷ', 'E': 'ㄸ',
    'f': 'ㄹ', 'a': 'ㅁ', 'q': 'ㅂ', 'Q': 'ㅃ', 't': 'ㅅ',
    'T': 'ㅆ', 'd': 'ㅇ', 'w': 'ㅈ', 'W': 'ㅉ', 'c': 'ㅊ',
    'z': 'ㅋ', 'x': 'ㅌ', 'v': 'ㅍ', 'g': 'ㅎ',
    'k': 'ㅏ', 'o': 'ㅐ', 'i': 'ㅑ', 'O': 'ㅒ', 'j': 'ㅓ',
    'p': 'ㅔ', 'u': 'ㅕ', 'P': 'ㅖ', 'h': 'ㅗ', 'y': 'ㅛ',
    'n': 'ㅜ', 'b': 'ㅠ', 'm': 'ㅡ', 'l': 'ㅣ'
  };

  const DOUBLE_JUNG = {
    'ㅗㅏ': 'ㅘ', 'ㅗㅐ': 'ㅙ', 'ㅗㅣ': 'ㅚ',
    'ㅜㅓ': 'ㅝ', 'ㅜㅔ': 'ㅞ', 'ㅜㅣ': 'ㅟ',
    'ㅡㅣ': 'ㅢ'
  };

  const DOUBLE_JONG = {
    'ㄱㅅ': 'ㄳ', 'ㄴㅈ': 'ㄵ', 'ㄴㅎ': 'ㄶ',
    'ㄹㄱ': 'ㄺ', 'ㄹㅁ': 'ㄻ', 'ㄹㅂ': 'ㄼ', 'ㄹㅅ': 'ㄽ', 'ㄹㅌ': 'ㄾ', 'ㄹㅍ': 'ㄿ', 'ㄹㅎ': 'ㅀ',
    'ㅂㅅ': 'ㅄ'
  };

  function isConsonant(ch) {
    return CHO.includes(ch) || ['ㄳ','ㄵ','ㄶ','ㄺ','ㄻ','ㄼ','ㄽ','ㄾ','ㄿ','ㅀ','ㅄ'].includes(ch);
  }

  function isVowel(ch) {
    return JUNG.includes(ch);
  }

  // Convert English QWERTY string to Korean Hangul
  function qwertyToHangul(text) {
    if (!text) return '';
    let jamoSeq = '';

    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (KEY_MAP[c]) {
        jamoSeq += KEY_MAP[c];
      } else {
        jamoSeq += c;
      }
    }

    return composeJamo(jamoSeq);
  }

  // Combine raw Jamo sequence into complete Hangul syllables
  function composeJamo(seq) {
    let result = '';
    let i = 0;

    while (i < seq.length) {
      const c1 = seq[i];

      // If not consonant, just output as is
      const choIdx = CHO.indexOf(c1);
      if (choIdx === -1) {
        result += c1;
        i++;
        continue;
      }

      // Check next for vowel
      if (i + 1 < seq.length && isVowel(seq[i + 1])) {
        let v1 = seq[i + 1];
        i += 2;

        // Check if double vowel
        if (i < seq.length && DOUBLE_JUNG[v1 + seq[i]]) {
          v1 = DOUBLE_JUNG[v1 + seq[i]];
          i++;
        }

        const jungIdx = JUNG.indexOf(v1);

        // Check for batchim (final consonant)
        let jongIdx = 0;
        if (i < seq.length && isConsonant(seq[i])) {
          const c2 = seq[i];

          // If next is vowel, c2 is NOT batchim, it belongs to the next syllable
          if (i + 1 < seq.length && isVowel(seq[i + 1])) {
            // jongIdx remains 0
          } else {
            // Check double batchim
            if (i + 1 < seq.length && DOUBLE_JONG[c2 + seq[i + 1]]) {
              const doubleC = DOUBLE_JONG[c2 + seq[i + 1]];
              // If after double batchim there is a vowel, second consonant goes to next syllable
              if (i + 2 < seq.length && isVowel(seq[i + 2])) {
                jongIdx = JONG.indexOf(c2);
                i++;
              } else {
                jongIdx = JONG.indexOf(doubleC);
                i += 2;
              }
            } else {
              jongIdx = JONG.indexOf(c2);
              if (jongIdx === -1) jongIdx = 0;
              else i++;
            }
          }
        }

        // Syllable code
        const code = 0xAC00 + (choIdx * 21 * 28) + (jungIdx * 28) + jongIdx;
        result += String.fromCharCode(code);
      } else {
        result += c1;
        i++;
      }
    }

    return result;
  }

  return {
    qwertyToHangul,
    composeJamo
  };
})();
