import test from 'node:test';
import assert from 'node:assert/strict';
import { assetPayload, validAssetAmount, valueAsset, convertToWon } from '../src/utils/currency.js';
test('외화 수량은 소수점 8자리까지 보존하고 원화는 정수만 허용한다', () => {
  assert.equal(validAssetAmount({ currency: 'USDT', amount: '12.12345678' }), true);
  assert.equal(validAssetAmount({ currency: 'USDT', amount: '12.123456789' }), false);
  assert.equal(validAssetAmount({ currency: 'USD', amount: '-1' }), false);
  assert.equal(validAssetAmount({ currency: 'KRW', amount: '1.1' }), false);
  assert.deepEqual(assetPayload({ currency: 'USDT', amount: '12.12345678' }), { currency: 'USDT', amount: null, foreignAmount: '12.12345678' });
});
test('환산액에 부채 부호를 적용하고 조회 실패는 저장 금액을 유지한다', () => {
  const asset = { currency: 'USD', foreignAmount: '1.5', amount: -1000, category: 'DEBT' };
  assert.equal(valueAsset(asset, [{ currency: 'USD', rate: 1401, available: true }]).amount, -2102);
  assert.equal(valueAsset(asset, []).amount, -1000);
  assert.equal(valueAsset({ amount: 1000 }, [{ currency: 'USD', rate: 1401, available: true }]).amount, 1000);
});
test('브라우저의 오래된 캐시로 최신 서버 평가액을 덮어쓰지 않는다', () => {
  const asset = { currency: 'USD', foreignAmount: '10', amount: 15000, exchangeRate: { available: true, currency: 'USD', rate: 1500, fetchedAt: '2026-09-28T01:00:00Z' } };
  assert.equal(valueAsset(asset, [{ currency: 'USD', available: true, rate: 1400, fetchedAt: '2026-09-27T01:00:00Z' }]).amount, 15000);
});

test('환산은 소수점 연산 오차 없이 원 단위로 반올림한다', () => {
  assert.equal(convertToWon('0.00000001', '1357.12345678'), 0);
  assert.equal(convertToWon('1.25', '1400.4'), 1751);
});
