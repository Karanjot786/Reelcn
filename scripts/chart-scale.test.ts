import assert from "node:assert/strict";
import test from "node:test";
import { decimals, formatter, niceTicks, palette, scaleLinear } from "../registry/items/chart-scale.ts";

test("niceTicks picks 1-2-5 steps that cover the domain", () => {
  assert.deepEqual(niceTicks(0, 100), [0, 20, 40, 60, 80, 100]);
  assert.deepEqual(niceTicks(0, 87), [0, 20, 40, 60, 80, 100]);
  assert.deepEqual(niceTicks(0, 1234, 4), [0, 500, 1000, 1500]);
});

test("niceTicks includes zero when the domain crosses it, and handles negatives", () => {
  assert.deepEqual(niceTicks(-35, 80), [-50, 0, 50, 100]);
  assert.deepEqual(niceTicks(-12, -3), [-12, -10, -8, -6, -4, -2]);
  assert.ok(niceTicks(-0.3, 2.7).indexOf(0) >= 0);
});

test("niceTicks handles tiny, flat and reversed domains without float noise", () => {
  assert.deepEqual(niceTicks(0.2, 0.9), [0.2, 0.4, 0.6, 0.8, 1]);
  assert.deepEqual(niceTicks(0, 0.001, 2), [0, 0.0005, 0.001]);
  assert.deepEqual(niceTicks(5, 5), [0, 1, 2, 3, 4, 5]);
  assert.deepEqual(niceTicks(0, 0, 1), [0, 1]);
  assert.deepEqual(niceTicks(100, 0), niceTicks(0, 100));
});

test("scaleLinear maps endpoints, midpoints and inverted ranges", () => {
  const x = scaleLinear([0, 100], [0, 500]);
  assert.equal(x(0), 0);
  assert.equal(x(50), 250);
  assert.equal(x(100), 500);
  const y = scaleLinear([-50, 100], [600, 0]);
  assert.equal(y(-50), 600);
  assert.equal(y(100), 0);
  assert.equal(y(25), 300);
  assert.equal(scaleLinear([3, 3], [0, 10])(3), 5);
});

test("palette starts with accent then highlight, then on-theme blends", () => {
  const colors = palette("#6d7cff", "#ffd84d", "#f5f7fb", 6);
  assert.equal(colors.length, 6);
  assert.equal(colors[0], "#6d7cff");
  assert.equal(colors[1], "#ffd84d");
  assert.equal(colors[2], "color-mix(in srgb, #6d7cff 50%, #ffd84d)");
  assert.equal(new Set(colors).size, 6);
  assert.deepEqual(palette("#000", "#fff", "#888", 1), ["#000"]);
  assert.deepEqual(palette("#000", "#fff", "#888", 0), []);
  assert.equal(new Set(palette("#000", "#fff", "#888", 12)).size, 12);
});

test("decimals and formatter keep a fixed precision so counting labels do not jitter", () => {
  assert.equal(decimals([1, 20, 300]), 0);
  assert.equal(decimals([1.5, 2.25]), 2);
  assert.equal(decimals([0.1234567]), 3);
  const format = formatter([12.5, 40], "en-US");
  assert.equal(format(3), "3.0");
  assert.equal(format(1234.56), "1,234.6");
  assert.equal(formatter([1], "en-US", { style: "currency", currency: "USD" })(1234), "$1,234.00");
});
