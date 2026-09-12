/**
 * @title Chart Scale
 * @category lib
 * @description Pure math shared by the data components: nice axis ticks, linear scales, an on-theme series palette and jitter-free number formatting.
 * @tags chart, axis, ticks, scale, palette, format
 * @example
 * const ticks = niceTicks(0, 87); // [0, 20, 40, 60, 80, 100]
 * const y = scaleLinear([ticks[0], ticks[ticks.length - 1]], [400, 0]);
 * const colors = palette(theme.colors.accent, theme.colors.highlight, theme.colors.foreground, 4);
 * const label = formatter([12.5, 40], "en-US")(12.5); // "12.5"
 */

/** Drops float noise such as 0.6000000000000001 and turns -0 into 0. */
const clean = (value: number) => Number(value.toPrecision(12));

/**
 * Round axis ticks covering [min, max] on a 1-2-5 step. Zero is always a tick when the domain crosses it.
 * `count` is a target, not a promise.
 */
export function niceTicks(min: number, max: number, count = 5): number[] {
  let lo = Math.min(min, max);
  let hi = Math.max(min, max);
  if (!isFinite(lo) || !isFinite(hi)) return [0, 1];
  if (lo === hi) {
    if (lo === 0) hi = 1;
    else if (lo > 0) lo = 0;
    else hi = 0;
  }
  const raw = (hi - lo) / Math.max(1, count);
  const magnitude = 10 ** Math.floor(Math.log10(raw));
  const norm = raw / magnitude;
  let nice = 10;
  for (const candidate of [1, 2, 5]) {
    if (norm <= candidate + 1e-9) {
      nice = candidate;
      break;
    }
  }
  const step = nice * magnitude;
  // The epsilon stops 0.6 / 0.2 = 2.9999999999999996 from adding a stray tick.
  const first = Math.floor(lo / step + 1e-9);
  const last = Math.ceil(hi / step - 1e-9);
  const ticks: number[] = [];
  for (let i = first; i <= last; i++) ticks.push(clean(i * step));
  return ticks;
}

/** Maps `domain` onto `range` linearly. Pass an inverted range (`[bottom, top]`) for SVG y axes. */
export function scaleLinear(domain: [number, number], range: [number, number]): (value: number) => number {
  const [d0, d1] = domain;
  const [r0, r1] = range;
  if (d0 === d1) return () => (r0 + r1) / 2;
  return (value) => r0 + ((value - d0) / (d1 - d0)) * (r1 - r0);
}

/**
 * Series colors that stay on-theme: the accent, then the highlight, then `color-mix` blends of the two with the
 * foreground and with transparency.
 */
export function palette(accent: string, highlight: string, foreground: string, count: number): string[] {
  const recipes: [string, number, string][] = [
    [accent, 50, highlight],
    [accent, 55, foreground],
    [highlight, 55, foreground],
    [accent, 60, "transparent"],
    [highlight, 60, "transparent"],
    [foreground, 50, "transparent"],
  ];
  const colors: string[] = [];
  for (let i = 0; i < count; i++) {
    if (i === 0) colors.push(accent);
    else if (i === 1) colors.push(highlight);
    else {
      const [a, weight, b] = recipes[(i - 2) % recipes.length];
      const round = Math.floor((i - 2) / recipes.length);
      colors.push(`color-mix(in srgb, ${a} ${Math.max(10, weight - round * 20)}%, ${b})`);
    }
  }
  return colors;
}

/** Decimal places needed to write every value exactly, capped at 3. */
export function decimals(values: number[]): number {
  let most = 0;
  for (const value of values) {
    if (!isFinite(value)) continue;
    const text = String(Math.abs(value));
    const exponent = text.indexOf("e-");
    const dot = text.indexOf(".");
    const places = exponent >= 0 ? Number(text.slice(exponent + 2)) : dot >= 0 ? text.length - dot - 1 : 0;
    most = Math.max(most, places);
  }
  return Math.min(most, 3);
}

/**
 * Number formatter for animated labels. Without `format` it holds the precision of `values`, so a label counting up
 * to 12.5 reads 3.0, 7.4, 12.5 instead of jumping between 3, 7.41 and 12.5.
 */
export function formatter(
  values: number[],
  locale?: string,
  format?: Intl.NumberFormatOptions,
): (value: number) => string {
  const places = decimals(values);
  const numberFormat = new Intl.NumberFormat(
    locale,
    format ?? { minimumFractionDigits: places, maximumFractionDigits: places },
  );
  return (value) => numberFormat.format(value);
}
