# Context Brief: 원화 기반 LLM 토큰 가격 비교 사이트 (toconomics)

> 승인일: 2026-07-03 · 상태: 승인됨 (환율 갱신 주기 일 1회로 확정)

## Goal

SOTA LLM 모델들의 토큰 가격(USD)을 원화 환율로 환산해 비교 테이블로 보여주는 웹사이트를 만든다.

## Scope

### In scope

- 메인 화면 = 모델별 가격 비교 테이블 (입력/출력 토큰 1M당 가격, 원화 + USD 병기, 제공사명)
- 가격 데이터: OpenRouter `/api/v1/models`(키 불필요, 400+ 모델)에서 자동 수집 + 큐레이션된 SOTA 목록(Fable 5, GPT-5.5, Opus 4.8, Kimi K2.7 Code, GLM-5.2, DeepSeek V4 계열 등)으로 필터링
- 환율: open.er-api.com(키 불필요, 일 1회 갱신)에서 USD→KRW 자동 갱신, 서버 캐시
- Next.js + Vercel 배포, 서버사이드 캐싱(ISR/route handler)
- 디자인 토큰: 레퍼런스 2번 이미지 기준 — 오프화이트 바탕, 블랙 모노크롬, 강렬한 레드 액센트, 뉴스페이퍼/증시 콜라주 무드

### Out of scope

- 비용 계산기, 시계열 차트 (추후 확장 가능)
- 캐싱 가격·컨텍스트 윈도우 등 부가 컬럼
- 사용자 계정, 다국어

## Technical Context

- 워크스페이스(`C:\Users\tmdgu\toconomics`)는 현재 비어 있음 — 그린필드 프로젝트
- **가격 소스**: OpenRouter Models API는 토큰 1개당 USD 문자열을 반환하므로 ×1,000,000 변환 필요. OpenRouter 경유 최저가라 공식가와 약간 다를 수 있음(예: Kimi K2.7이 공식 $0.95/$4.00 vs OpenRouter $0.74/$3.50). 공식가가 중요해지면 llm-prices.com `current-v1.json`을 보조 소스로 병기 가능
- **환율 소스**: open.er-api.com은 무제한·키 불필요, 일 1회 갱신, 출처 표기 필수. 한국 관행의 "매매기준율"이 필요하면 한국수출입은행 API(무료 키, 1,000회/일)로 교체 가능하도록 소스 추상화
- 2026년 7월 기준 참고 가격(1M 토큰당 input/output USD): Fable 5 $10/$50, GPT-5.5 $5/$30, Opus 4.8 $5/$25, Kimi K2.7 Code $0.95/$4.00, GLM-5.2 $1.40/$4.40, DeepSeek V4-Flash $0.14/$0.28

## Constraints

- 환율 갱신은 일 1회 (무료 API 기준) — 사용자 승인 완료. 아키텍처는 환율 소스 교체 가능하게 설계
- 두 외부 API 모두 키 불필요·무료이므로 비밀 관리 부담 없음, 단 open.er-api.com 출처 표기 필요
- 큐레이션 모델 목록은 코드 내 설정(모델 ID 배열)으로 관리 — 모델 추가/제거 시 커밋 필요

## Success Criteria

- 배포된 사이트 접속 시 큐레이션된 SOTA 모델들의 입력/출력 가격이 원화(+USD 병기)로 테이블에 표시된다
- 환율과 가격이 서버 캐시를 통해 자동 갱신된다 (일 1회 이상)
- 마지막 환율 갱신 시각과 적용 환율이 화면에 명시된다
- 디자인이 레퍼런스 2번의 톤(오프화이트/블랙/레드)을 반영한 디자인 토큰 체계로 구현된다

## Open Questions

- OpenRouter 가격(경유가) vs 공식가 병기 여부 — 일단 OpenRouter 단일 소스로 시작 (확장 여지만 남김)

## Complexity Assessment

| Signal | 점수 | 근거 |
|--------|------|------|
| Scope breadth | 2 | 테이블 UI + 데이터 수집 레이어 2개 컴포넌트 |
| File impact | 2 | 그린필드 Next.js, 초기 파일 다수지만 구조 단순 |
| Interface boundaries | 1 | 표준 Next.js 패턴 내에서 공개 API 소비만 |
| Dependency depth | 1 | 데이터 레이어 → UI 선형 의존 |
| Risk surface | 2 | 외부 API 2개 의존 (모두 무료·키 불필요) |

**Score:** 8 · **Verdict:** Simple
**Rationale:** 단일 페이지 그린필드 프로젝트로 한 번의 계획 사이클에 충분히 들어감. 외부 API 의존이 유일한 리스크지만 둘 다 키 없는 공개 API라 낮음.

## Suggested Next Step

`plan-crafting`으로 진행 — 단일 계획 사이클로 충분.
