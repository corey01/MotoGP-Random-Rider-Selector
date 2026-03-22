type RGB = { r: number; g: number; b: number };

const FALLBACK_DARK = "#171717";
const FALLBACK_LIGHT = "#ffffff";

const clampByte = (value: number) => Math.max(0, Math.min(255, value));

const parseHex = (color: string): RGB | null => {
  const value = color.replace("#", "").trim();

  if (value.length === 3) {
    return {
      r: parseInt(value[0] + value[0], 16),
      g: parseInt(value[1] + value[1], 16),
      b: parseInt(value[2] + value[2], 16),
    };
  }

  if (value.length === 6) {
    return {
      r: parseInt(value.slice(0, 2), 16),
      g: parseInt(value.slice(2, 4), 16),
      b: parseInt(value.slice(4, 6), 16),
    };
  }

  return null;
};

const parseRgb = (color: string): RGB | null => {
  const match = color.match(/rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/i);
  if (!match) return null;

  return {
    r: clampByte(Number(match[1])),
    g: clampByte(Number(match[2])),
    b: clampByte(Number(match[3])),
  };
};

const parseColor = (color?: string | null): RGB | null => {
  if (!color) return null;
  const value = color.trim();
  if (!value) return null;
  if (value.startsWith("#")) return parseHex(value);
  if (value.startsWith("rgb")) return parseRgb(value);
  return null;
};

const toLinear = (channel: number) => {
  const normalized = channel / 255;
  return normalized <= 0.03928
    ? normalized / 12.92
    : ((normalized + 0.055) / 1.055) ** 2.4;
};

const luminance = (color: RGB) =>
  0.2126 * toLinear(color.r) + 0.7152 * toLinear(color.g) + 0.0722 * toLinear(color.b);

const contrastRatio = (a: RGB, b: RGB) => {
  const lighter = Math.max(luminance(a), luminance(b));
  const darker = Math.min(luminance(a), luminance(b));
  return (lighter + 0.05) / (darker + 0.05);
};

export const getReadableTextColor = (
  backgroundColor?: string | null,
  preferredTextColor?: string | null
) => {
  const background = parseColor(backgroundColor);
  if (!background) return preferredTextColor || FALLBACK_LIGHT;

  const preferred = parseColor(preferredTextColor);
  if (preferred && contrastRatio(background, preferred) >= 4.5) {
    return preferredTextColor!;
  }

  const dark = parseColor(FALLBACK_DARK)!;
  const light = parseColor(FALLBACK_LIGHT)!;

  return contrastRatio(background, dark) >= contrastRatio(background, light)
    ? FALLBACK_DARK
    : FALLBACK_LIGHT;
};
