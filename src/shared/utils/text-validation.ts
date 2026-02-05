export const getUnicodeLength = (value: string) => Array.from(value).length;

export const hasInvalidControlChars = (
  value: string,
  allowNewlines = false,
) => {
  for (let i = 0; i < value.length; i += 1) {
    const code = value.charCodeAt(i);
    if (code === 0x7f || code < 0x20) {
      if (allowNewlines && (code === 0x09 || code === 0x0a || code === 0x0d)) {
        continue;
      }
      return true;
    }
  }
  return false;
};

export const hasUnpairedSurrogates = (value: string) =>
  /[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/u.test(
    value,
  );
