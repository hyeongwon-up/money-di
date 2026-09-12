import test from 'node:test';
import assert from 'node:assert/strict';
import { daysUntil, filterPlans, toSpendingPayload } from '../src/utils/spending.js';

const today = new Date(2026, 8, 12, 23, 59);
const plans = [
  {title: '보험료', amount: 100, dueDate:'2026-09-11', paid:false},
  {title: '적금', amount: 200, dueDate:'2026-09-12', paid:false},
  {title: '카드', amount: 300, dueDate:'2026-09-10', paid:true}
];
test('납부 완료 시 응답 객체의 이전 paid 값과 충돌하지 않는다', () => {
  assert.deepEqual(toSpendingPayload({...plans[0], isPaid:true}), {title:'보험료',amount:100,dueDate:'2026-09-11',description:undefined,paid:true});
  assert.equal(toSpendingPayload({...plans[2], isPaid:false}).paid, false);
});
test('기한 경과 목록은 오늘 납부와 이미 완료한 건을 제외한다', () => {
  assert.deepEqual(filterPlans(plans, 'overdue', '', today).map(p => p.title), ['보험료']);
});
test('검색과 납부 필터를 함께 적용한다', () => {
  assert.equal(filterPlans(plans, 'unpaid', '카드', today).length, 0);
  assert.equal(filterPlans(plans, 'paid', ' 카드 ', today).length, 1);
});
test('납부일까지의 날짜는 시간과 월 경계에 영향받지 않는다', () => {
  assert.equal(daysUntil('2026-09-12', today), 0);
  assert.equal(daysUntil('2026-10-01', new Date(2026,8,30,23,59)), 1);
});
