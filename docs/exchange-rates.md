# USD / USDT 원화 환산

- 기존 자산의 null currency는 KRW로 처리한다. 기존 원화 금액과 과거 이력은 변환하지 않는다.
- 외화 자산은 currency(USD/USDT), foreignAmount(소수 8자리까지)를 저장한다. amount는 마지막 저장 시 원화 평가액이다.
- 서버가 클라이언트 평가액을 신뢰하지 않고 외화 수량 × 서버 환율을 HALF_UP 원 단위로 계산한다. 부채 부호는 카테고리로 결정한다.
- GET /api/assets는 최신 적용 시세로 평가한 복사본을 반환한다. 조회가 기존 자산·과거 이력을 변경하지 않는다. 자산을 저장/삭제할 때 생성되는 당일 이력에는 당시 환산액을 반영한다.
- GET /api/exchange-rates는 USD/USDT의 rate, source, asOf, fetchedAt, available, stale을 반환한다.

## 공급자와 갱신

USD: https://api.frankfurter.dev/v2/rate/USD/KRW (일별 참고 환율, 서버 캐시 1시간).
USDT: https://api.upbit.com/v1/ticker?markets=KRW-USDT (업비트 현재가, 서버 캐시 60초).
둘 다 키 없이 공개 시세를 조회한다. 사용자 자산/수량을 공급자에게 전송하지 않는다.

화면이 보일 때 1분 간격으로 확인한다. 공급자 호출은 캐시 만료 시에만 수행하며, 연결 2초/요청 4초 제한과 실패 후 60초 재시도 간격을 둔다. 동일 서버 내 요청을 직렬화해 동시 갱신을 줄인다.

## Render 및 장애

스케줄러에 의존하지 않는다. 조회 시 만료된 환율을 갱신하며 마지막 정상 응답을 PostgreSQL에 저장한다. Render 재시작 후에도 DB에서 복구한다. 외부 조회 실패 시 이전 시세와 기준 시각을 표시한다. 한 번도 정상 환율이 없으면 원화 0으로 대체하지 않으며 외화 등록을 막는다.

브라우저는 공개 시세만 localStorage에 보관한다. 자산 정보는 별도로 영구 캐시하지 않는다. 서버가 완전히 중단되었을 때 신규 접속으로 자산을 조회하거나 저장할 수는 없다. 이미 열린 화면은 기존 데이터와 시세를 유지한다. 최초 조회/환율 조회는 최대 60초 기다리고 자산 조회 실패는 15초 뒤 재시도한다.

## 배포

백엔드를 먼저 배포한 뒤 프론트엔드를 배포한다. Hibernate ddl-auto=update 환경에서는 추가 테이블/컬럼이 생성된다. validate/none 환경에서는 `docs/migrations/20260928-exchange-rates.sql`을 먼저 적용한다. DB를 유지해야 서버 재시작 후 이전 시세 복구가 가능하다. API 키나 추가 환경변수는 필요 없다.

검증: backend `./gradlew test`, frontend `node --test tests/*.test.js` 및 `npm run build`.
