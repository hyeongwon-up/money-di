-- 1. 모든 데이터 초기화
DELETE FROM asset;
DELETE FROM asset_history;
DELETE FROM asset_item_history;

-- 2. 자산 전체 추이(AssetHistory) 데이터 삽입 (순 자산 기준: 금액 - 부채)
-- 2025-12-25: 713,359,682 - 363,398,000 = 349,961,682
INSERT INTO asset_history (recorded_date, total_amount) VALUES ('2025-06-07', 81185947);
INSERT INTO asset_history (recorded_date, total_amount) VALUES ('2025-06-28', 104109839);
INSERT INTO asset_history (recorded_date, total_amount) VALUES ('2025-07-26', 110492941);
INSERT INTO asset_history (recorded_date, total_amount) VALUES ('2025-08-27', 117890763);
INSERT INTO asset_history (recorded_date, total_amount) VALUES ('2025-09-25', 129675368);
INSERT INTO asset_history (recorded_date, total_amount) VALUES ('2025-10-26', 168709554);
INSERT INTO asset_history (recorded_date, total_amount) VALUES ('2025-11-27', 181290505);
INSERT INTO asset_history (recorded_date, total_amount) VALUES ('2025-12-25', 349961682);
INSERT INTO asset_history (recorded_date, total_amount) VALUES ('2026-01-26', 714584784);

-- 3. 현재 상세 자산 현황(Asset) 삽입
-- 최신 데이터를 더 상세하게 분리하여 예시로 넣어둡니다. (추후 수정 가능)
INSERT INTO asset (id, name, amount, previous_amount, category, description, created_at) 
VALUES (1, '주거래 예금', 181290505, 168709554, 'SAVINGS', '노션 이관 데이터 기반', '2025-11-27 00:00:00');

INSERT INTO asset (id, name, amount, previous_amount, category, description, created_at) 
VALUES (2, '부동산 자산(순자산)', 349961682, 0, 'REAL_ESTATE', '부채 제외 순자산 (25/12/25 기준)', '2025-12-25 00:00:00');

INSERT INTO asset (id, name, amount, previous_amount, category, description, created_at) 
VALUES (3, '최신 반영 자산', 183332597, 0, 'STOCK', '26/01/26 증분 반영분', '2026-01-26 00:00:00');

-- 4. 개별 자산 이력(AssetItemHistory) 초기값 삽입
INSERT INTO asset_item_history (asset_id, amount, recorded_date) VALUES (1, 181290505, '2025-11-27');
INSERT INTO asset_item_history (asset_id, amount, recorded_date) VALUES (2, 349961682, '2025-12-25');
INSERT INTO asset_item_history (asset_id, amount, recorded_date) VALUES (3, 183332597, '2026-01-26');
