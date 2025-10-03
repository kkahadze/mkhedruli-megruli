export function mkhedruliToLatinized(text: string): string {
  const georgianToLatin: Record<string, string> = {
    'ა': 'a', 'ბ': 'b', 'გ': 'g', 'დ': 'd', 'ე': 'e',
    'ვ': 'v', 'ზ': 'z', 'თ': 't', 'ი': 'i', 'კ': "k'",
    'ლ': 'l', 'მ': 'm', 'ნ': 'n', 'ო': 'o', 'პ': "p'",
    'ჟ': 'zh', 'რ': 'r', 'ს': 's', 'ტ': "t'", 'უ': 'u',
    'ფ': 'p', 'ქ': 'k', 'ღ': 'gh', 'ყ': 'q', 'შ': 'sh',
    'ჩ': 'ch', 'ც': 'c', 'ძ': 'dz', 'წ': "ts'", 'ჭ': "ch'",
    'ხ': 'x', 'ჯ': 'j', 'ჰ': 'h', 'ჷ': "e'", 'ჸ': '՚',
    'ʼ': "'"
  };
  
  let result = '';
  for (let char of text) {
    result += georgianToLatin[char] || char;
  }
  return result;
}

export function latinizedToMkhedruli(text: string): string {
  const latinToGeorgian: Record<string, string> = {
    "ts'": 'წ',
    "ch'": 'ჭ',
    "k'": 'კ',
    "p'": 'პ',
    "t'": 'ტ',
    "q'": 'ყ',
    "e'": 'ჷ',
    'zh': 'ჟ',
    'gh': 'ღ',
    'sh': 'შ',
    'ch': 'ჩ',
    'dz': 'ძ',
    'a': 'ა',
    'b': 'ბ',
    'g': 'გ',
    'd': 'დ',
    'e': 'ე',
    'v': 'ვ',
    'z': 'ზ',
    't': 'თ',
    'i': 'ი',
    'l': 'ლ',
    'm': 'მ',
    'n': 'ნ',
    'o': 'ო',
    'r': 'რ',
    's': 'ს',
    'u': 'უ',
    'p': 'ფ',
    'k': 'ქ',
    'q': 'ყ',
    'c': 'ც',
    'x': 'ხ',
    'j': 'ჯ',
    'h': 'ჰ',
    'y': 'ჲ',
    '՚': 'ჸ',
    "'": 'ჸ'
  };

  // Sort mappings by length (longest first) to handle multi-char sequences
  const sortedMappings = Object.entries(latinToGeorgian).sort((a, b) => b[0].length - a[0].length);
  
  let result = text.toLowerCase();
  
  for (const [latin, georgian] of sortedMappings) {
    result = result.replaceAll(latin, georgian);
  }
  
  return result;
}

export function isGeorgianScript(text: string): boolean {
  // Check if the first non-whitespace character is Georgian/Mingrelian
  const trimmed = text.trim();
  if (!trimmed) return false;
  
  const firstChar = trimmed[0];
  // Georgian Unicode range: U+10A0 to U+10FF
  const charCode = firstChar.charCodeAt(0);
  return (charCode >= 0x10A0 && charCode <= 0x10FF);
}

