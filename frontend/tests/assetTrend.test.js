import test from 'node:test';
import assert from 'node:assert/strict';
import { buildTrend, changePercent, koreaToday } from '../src/utils/assetTrend.js';
const today = '2026-09-28';
test('실제 기간 기준일과 현재 순자산으로 증감과 비율을 계산한다', () => {
  const data = buildTrend([{id:1,recordedDate:'2026-08-28',totalAmount:100},{id:2,recordedDate:'2026-09-20',totalAmount:110}], [{id:1,amount:125}], [],30,today);
  assert.equal(data.baseline.recordedDate,'2026-08-28'); assert.equal(data.older,true);
  assert.equal(data.delta,25); assert.equal(data.percent,25); assert.equal(data.high.value,125);
});
test('기록 부족, 0 및 음수 기준에 잘못된 비율이나 신규자산 수익을 만들지 않는다', () => {
  assert.equal(changePercent(0,100),null); assert.equal(changePercent(-100,100),null);
  const data=buildTrend([{id:1,recordedDate:'2026-09-20',totalAmount:0}],[{id:1,amount:100}],[],30,today);
  assert.equal(data.shorter,true); assert.equal(data.changes[0].delta,null); assert.equal(data.coverage,0); assert.equal(data.residual,100);
  assert.equal(buildTrend([],[],[],30,today).delta,null);
});
test('같은 날짜 마지막 이력과 기준일 이전 개별 기록을 사용하고 부채 감소는 양수 기여다', () => {
  const data=buildTrend([{id:1,recordedDate:'2026-08-29',totalAmount:10},{id:2,recordedDate:'2026-08-29',totalAmount:20}],[{id:7,amount:-50}], [
    {id:1,assetId:7,recordedDate:'2026-08-20',amount:-120},
    {id:2,assetId:7,recordedDate:'2026-08-20',amount:-100},
    {id:3,assetId:7,recordedDate:'2026-09-20',amount:-60}],30,today);
  assert.equal(data.before,20); assert.equal(data.changes[0].before,-100); assert.equal(data.changes[0].delta,50);
});
test('미래 기록은 제외하고 현재 평가액과 과거 저장값을 따로 유지한다', () => {
  const data=buildTrend([{id:1,recordedDate:today,totalAmount:100},{id:2,recordedDate:'2027-01-01',totalAmount:900}], [{id:1,amount:110}],[],0,today);
  assert.equal(data.points.length,2); assert.equal(data.points[0].value,100); assert.equal(data.points[1].value,110);
  assert.equal(koreaToday(new Date('2026-09-27T15:01:00Z')),today);
});
