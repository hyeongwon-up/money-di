import test from 'node:test';
import assert from 'node:assert/strict';
import { getCategoryTotals } from '../src/utils/assetSummary.js';
const categories = { SAVINGS: { label: '예금' }, DEBT: { label: '부채', isLiability: true }, STOCK: { label: '주식' } };
test('동일 카테고리의 문자열·숫자 금액을 합산한다', () => {
  const result = getCategoryTotals([{ category: 'SAVINGS', amount: '150000' }, { category: 'SAVINGS', amount: 250000 }], categories);
  assert.equal(result[0].amount, 400000);
  assert.equal(result[0].count, 2);
});
test('기존 LOAN과 DEBT를 부채로 합산하고 음수를 보존한다', () => {
  const result = getCategoryTotals([{ category: 'LOAN', amount: -300000 }, { category: 'DEBT', amount: '-200000' }], categories);
  assert.equal(result[1].amount, -500000);
  assert.equal(result[1].count, 2);
});
test('미등록 카테고리와 금액이 0인 등록 자산을 구분한다', () => {
  const result = getCategoryTotals([{ category: 'STOCK', amount: 0 }], categories);
  assert.equal(result[0].amount, 0);
  assert.equal(result[0].count, 0);
  assert.equal(result[2].amount, 0);
  assert.equal(result[2].count, 1);
});
