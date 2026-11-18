export const SUPPORTED_LOCALES = ['en', 'vi', 'zh', 'th', 'ja'];

export const LANGUAGE_ROWS = [
  { code: 'en', name: 'English', direction: 'LTR' },
  { code: 'vi', name: 'Tiếng Việt', direction: 'LTR' },
  { code: 'zh', name: '中文', direction: 'LTR' },
  { code: 'th', name: 'ภาษาไทย', direction: 'LTR' },
  { code: 'ja', name: '日本語', direction: 'LTR' },
];

export const LOCALE_NAMES: Record<string, string> = {
  en: 'English',
  vi: 'Vietnamese',
  zh: 'Simplified Chinese',
  th: 'Thai',
  ja: 'Japanese',
};

export const UNITS: Record<string, Record<string, string>> = {
  pcs: { vi: 'miếng', zh: '件', th: 'ชิ้น', ja: '個' },
  pax: { vi: 'người', zh: '位', th: 'ท่าน', ja: '名' },
  pairs: { vi: 'đôi', zh: '对', th: 'คู่', ja: '対' },
};

export const PHRASES: Record<string, Record<string, string>> = {
  'per portion': { vi: 'Mỗi phần', zh: '每份', th: 'ต่อที่', ja: '1人前' },
  'per person': { vi: 'Mỗi người', zh: '每位', th: 'ต่อท่าน', ja: '1名様' },
  regular: { vi: 'Thường', zh: '常规', th: 'ปกติ', ja: '並' },
  small: { vi: 'Nhỏ', zh: '小', th: 'เล็ก', ja: '小' },
  large: { vi: 'Lớn', zh: '大', th: 'ใหญ่', ja: '大' },
};

const CJK = /[\u4e00-\u9fff]/;
const KANA = /[\u3040-\u30ff\uff66-\uff9f]/;
const THAI = /[\u0e00-\u0e7f]/;
const VIETNAMESE =
  /[ăâđêôơưạảấầẩẫậắằẳẵặẹẻẽếềểễệỉịọỏốồổỗộớờởỡợụủứừửữựỳỵỷỹ]/i;

/** Verify that generated text matches the expected script for a locale. */
export function isTextInLocaleScript(
  text: string,
  lang: string,
  isSentence: boolean,
): boolean {
  switch (lang) {
    case 'zh':
      return CJK.test(text) && !KANA.test(text) && !THAI.test(text);
    case 'ja':
      return (
        (isSentence ? KANA.test(text) : KANA.test(text) || CJK.test(text)) &&
        !THAI.test(text)
      );
    case 'th':
      return THAI.test(text) && !KANA.test(text);
    case 'vi':
      return (
        !CJK.test(text) &&
        !KANA.test(text) &&
        !THAI.test(text) &&
        (!isSentence || VIETNAMESE.test(text))
      );
    default:
      return !CJK.test(text) && !KANA.test(text) && !THAI.test(text);
  }
}
