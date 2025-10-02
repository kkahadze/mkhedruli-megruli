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

