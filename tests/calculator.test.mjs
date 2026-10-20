import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createCalc } from '../js/calculator.js';

const run = (keys) => {
  const c = createCalc();
  for (const k of keys) c.press(k);
  return c.display;
};

test('basic arithmetic and chaining', () => {
  assert.equal(run(['1', '2', '+', '3', '=']), '15');
  assert.equal(run(['9', '×', '8', '−', '2', '=']), '70');
  assert.equal(run(['1', '0', '÷', '4', '=']), '2.5');
});

test('decimals avoid float noise', () => {
  assert.equal(run(['0', '.', '1', '+', '0', '.', '2', '=']), '0.3');
});

test('percent of a running total, square root, sign, backspace, clear', () => {
  assert.equal(run(['2', '0', '0', '+', '1', '5', '%']), '30');
  assert.equal(run(['1', '4', '4', '√']), '12');
  assert.equal(run(['5', '±']), '-5');
  assert.equal(run(['1', '2', '3', '⌫']), '12');
  assert.equal(run(['7', '+', '7', 'C']), '0');
});

test('memory and divide by zero', () => {
  assert.equal(run(['5', 'M+', 'C', 'MR']), '5');
  assert.equal(run(['1', '÷', '0', '=']), 'Error');
});
