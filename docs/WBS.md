# Work Breakdown Structure (WBS) v0.2

> World Sim - 10주 개발 마일스톤

---

## 0. 원칙

### MVP 스코프 엄수
- 문서에 **"제외"** 명시된 항목은 WBS에 없음
- 매주 **데모 가능한 단위**로 쪼갬
- 기능보다 **동작하는 코드** 우선

### 검수 기준 (문서 정합성)
- [ ] ERD가 GDD의 모든 루프/UGC/모더레이션을 지원
- [ ] ARCHITECTURE가 ERD 엔티티 CRUD + 배치 정산을 지원
- [ ] WBS가 모든 필수 기능을 커버 (제외 항목은 WBS에 없음)

---

## 개요

| 항목 | 내용 |
|------|------|
| 총 기간 | 10주 |
| MVP 목표 | 1일 1턴 루프 + UGC 챌린지 + 리더보드 |
| 팀 구성 | 1인 개발 (Claude Code 지원) |

---

## Week 1-2: Plan 완료 + 프로젝트 셋업

### Week 1: Plan 문서 완료 ✅

| Task | 설명 | 산출물 | 상태 |
|------|------|--------|------|
| 1.1 | GDD v0.2 작성 | `docs/GDD.md` | ✅ |
| 1.2 | ERD v0.2 작성 | `docs/ERD.md` | ✅ |
| 1.3 | ARCHITECTURE v0.2 작성 | `docs/ARCHITECTURE.md` | ✅ |
| 1.4 | WBS v0.2 작성 | `docs/WBS.md` | ✅ |
| 1.5 | 교차 검증 체크리스트 통과 | 문서 정합성 확인 | ✅ |

### Week 2: 프로젝트 셋업

| Task | 설명 | 산출물 |
|------|------|--------|
| 2.1 | Next.js 14 프로젝트 생성 | 프로젝트 구조 |
| 2.2 | TypeScript, ESLint, Prettier 설정 | 설정 파일 |
| 2.3 | Tailwind CSS 설정 | `tailwind.config.ts` |
| 2.4 | Prisma 설정 + 스키마 작성 | `prisma/schema.prisma` |
| 2.5 | DB 마이그레이션 | 테이블 생성 |
| 2.6 | Redis 연결 설정 | `lib/cache/redis.ts` |
| 2.7 | NextAuth 설정 (Google) | 로그인 동작 |
| 2.8 | 폴더 구조 생성 | ARCHITECTURE 기준 |
| 2.9 | 시드 데이터 작성 | NationTemplate, PolicyCard |
| 2.10 | 정산 엔진 락/중복방지 설계 | `lib/cache/lock.ts` |

**체크포인트**:
- `npm run dev` 정상 동작
- DB 연결 및 마이그레이션 완료
- 로그인/로그아웃 동작

---

## Week 3-4: 핵심 게임 루프

### Week 3: GameSession + 대시보드

| Task | 설명 | 산출물 |
|------|------|--------|
| 3.1 | 랜딩 페이지 UI | `app/page.tsx` |
| 3.2 | 로그인/로그아웃 UI | `app/(auth)/*` |
| 3.3 | 국가 템플릿 선택 UI | `app/(game)/select/` |
| 3.4 | 국가 템플릿 목록 API | `GET /api/game/nations` |
| 3.5 | GameSession 생성 API | `POST /api/game/session` |
| 3.6 | 현재 세션 조회 API | `GET /api/game/session/current` |
| 3.7 | 대시보드 UI (스탯 표시) | `app/(game)/dashboard/` |
| 3.8 | StatsDisplay 컴포넌트 | `components/game/` |
| 3.9 | useGameStore 작성 | `stores/useGameStore.ts` |

**체크포인트**:
- 로그인 → 국가 선택 → 대시보드 이동 플로우 동작
- 스탯 9개 표시

### Week 4: TurnDecision 제출

| Task | 설명 | 산출물 |
|------|------|--------|
| 4.1 | BudgetSlider 컴포넌트 | `components/game/BudgetSlider.tsx` |
| 4.2 | PolicyCardSlot 컴포넌트 | `components/game/PolicyCardSlot.tsx` |
| 4.3 | 정책 카드 목록 API | `GET /api/game/policies` |
| 4.4 | TurnDecision 제출 API | `POST /api/game/turn/decision` |
| 4.5 | TurnDecision 조회 API | `GET /api/game/turn/decision/latest` |
| 4.6 | 턴 입력 UI (예산+정책) | `app/(game)/play/` |
| 4.7 | Zod 입력 검증 | `lib/game/validation/turnDecision.ts` |
| 4.8 | 턴 입력 상태 저장 확인 | 테스트 |

**체크포인트**:
- 예산 배분 (합계 100%) UI 동작
- 정책 카드 3장 선택 가능
- TurnDecision DB 저장 확인

---

## Week 5-6: 정산 엔진 + 이벤트 시스템

### Week 5: 정산 엔진 구현

| Task | 설명 | 산출물 |
|------|------|--------|
| 5.1 | 스탯 계산 로직 | `lib/game/engine/statsCalculator.ts` |
| 5.2 | Score 계산 로직 | `lib/game/engine/scoreCalculator.ts` |
| 5.3 | 정산 메인 프로세서 | `lib/game/engine/settlement.ts` |
| 5.4 | Redis 분산 락 구현 | `lib/cache/lock.ts` |
| 5.5 | 멱등성 처리 (중복 방지) | TurnSnapshot unique 체크 |
| 5.6 | 정산 API 엔드포인트 | `POST /api/jobs/daily-settlement` |
| 5.7 | TurnSnapshot 저장 | DB 저장 로직 |
| 5.8 | 정산 단위 테스트 | `tests/unit/statsCalculator.test.ts` |
| 5.9 | Vercel Cron 설정 | `vercel.json` |

**체크포인트**:
- 수동 정산 API 호출 → TurnSnapshot 생성
- 스탯 변화 확인
- 중복 실행 시 스킵 확인

### Week 6: 이벤트 시스템 (데이터 드리븐)

| Task | 설명 | 산출물 |
|------|------|--------|
| 6.1 | EventDefinition 시드 데이터 | 기본 이벤트 20개 |
| 6.2 | 이벤트 프로세서 | `lib/game/engine/eventProcessor.ts` |
| 6.3 | 이벤트 롤 로직 (확률/조건) | 트리거 조건 평가 |
| 6.4 | EventInstance 생성/저장 | 정산 엔진 연동 |
| 6.5 | TurnSnapshot 응답 API | `GET /api/game/turn/snapshot/latest` |
| 6.6 | TurnResultReport 컴포넌트 | `components/game/TurnResultReport.tsx` |
| 6.7 | EventNotification 컴포넌트 | `components/game/EventNotification.tsx` |
| 6.8 | 턴 히스토리 UI | `app/(game)/history/` |
| 6.9 | 이벤트 단위 테스트 | `tests/unit/eventProcessor.test.ts` |

**체크포인트**:
- 정산 시 이벤트 발생 (조건부)
- 이벤트 효과 스탯 반영
- 턴 결과 리포트 UI 표시

---

## Week 7: UGC v1 - 데일리 챌린지

| Task | 설명 | 산출물 |
|------|------|--------|
| 7.1 | Challenge CRUD API | `POST/GET /api/ugc/challenges` |
| 7.2 | Challenge 생성 UI | `app/(game)/challenges/create/` |
| 7.3 | 템플릿 검증 로직 | `lib/ugc/templateValidator.ts` |
| 7.4 | Challenge 목록 UI | `app/(game)/challenges/` |
| 7.5 | Challenge 상세 UI | `app/(game)/challenges/[id]/` |
| 7.6 | 챌린지 플레이 API | `POST /api/ugc/challenges/:id/play` |
| 7.7 | 챌린지 세션 연결 | GameSession.challengeId |
| 7.8 | 승리 조건 체크 로직 | 정산 시 winConditions 평가 |
| 7.9 | 챌린지 publish API | `POST /api/ugc/challenges/:id/publish` |
| 7.10 | UGC 상태 관리 (DRAFT/PUBLISHED) | 상태 전이 |
| 7.11 | 제작자 지표 (playCount, completionCount) | DB 업데이트 |

**체크포인트**:
- 챌린지 생성 → 공개 → 플레이 → 클리어 플로우
- 승리 조건 달성 시 완주 처리
- 제작자 통계 업데이트

---

## Week 8: UGC v2 - 정책 덱 + 모더레이션

### 정책 덱 (시간 여유 시)

| Task | 설명 | 산출물 |
|------|------|--------|
| 8.1 | PolicyDeck CRUD API | `POST/GET /api/ugc/decks` |
| 8.2 | 덱 생성 UI (8장 선택) | `app/(game)/decks/create/` |
| 8.3 | 덱 목록/상세 UI | `app/(game)/decks/` |
| 8.4 | 덱 복사 API | `POST /api/ugc/decks/:id/copy` |
| 8.5 | 덱 publish API | 상태 관리 |

### 모더레이션 (필수)

| Task | 설명 | 산출물 |
|------|------|--------|
| 8.6 | UGC 신고 API | `POST /api/ugc/report` |
| 8.7 | 금지어 필터 | `lib/ugc/contentFilter.ts` |
| 8.8 | 어드민 신고 목록 UI | `app/admin/moderation/` |
| 8.9 | 어드민 제재 API | `POST /api/admin/moderation/action` |
| 8.10 | ModerationAction 로그 | DB 저장 |

**체크포인트**:
- 덱 생성 → 공유 → 복사 플로우
- 신고 → 검토 → 제재 플로우
- UGC 상태 변경 (HIDDEN/BANNED)

---

## Week 9: 리더보드 + UI 개선

### 리더보드

| Task | 설명 | 산출물 |
|------|------|--------|
| 9.1 | LeaderboardSnapshot 저장 | 정산 연동 |
| 9.2 | Redis 리더보드 캐시 | `lib/leaderboard/cache.ts` |
| 9.3 | 리더보드 API | `GET /api/leaderboard/*` |
| 9.4 | 리더보드 UI | `app/(game)/leaderboard/` |
| 9.5 | 부문별 랭킹 (경제/기술/외교) | 탭 UI |
| 9.6 | 내 순위 하이라이트 | UI 표시 |

### UI 개선

| Task | 설명 | 산출물 |
|------|------|--------|
| 9.7 | 대시보드 UI 개선 | 반응형 |
| 9.8 | 모바일 대응 | Tailwind responsive |
| 9.9 | 로딩 상태 (Skeleton) | UI 개선 |
| 9.10 | 에러 핸들링 (Toast) | 에러 표시 |
| 9.11 | 시즌 정보 표시 | 대시보드 |

**체크포인트**:
- 리더보드 Top 100 표시
- 내 순위 표시
- 모바일에서 사용 가능

---

## Week 10: 테스트 + 버그 수정 + MVP 출시

| Task | 설명 | 산출물 |
|------|------|--------|
| 10.1 | E2E 테스트 시나리오 | 테스트 케이스 |
| 10.2 | 통합 테스트 | 주요 플로우 |
| 10.3 | 정산 락/재시도 테스트 | 시나리오 테스트 |
| 10.4 | UGC 신고/제재 테스트 | 플로우 테스트 |
| 10.5 | 밸런스 파라미터 조정 | 이벤트/스탯 |
| 10.6 | 버그 수정 | 이슈 해결 |
| 10.7 | 프로덕션 배포 | Vercel |
| 10.8 | 환경 변수 설정 | 프로덕션 |
| 10.9 | Cron 동작 확인 | 실제 정산 |
| 10.10 | MVP 출시 | 🎉 |

**체크포인트**:
- 전체 플로우 E2E 통과
- 프로덕션 환경 정상 동작
- 자정 정산 동작 확인

---

## 우선순위 매트릭스

| 우선순위 | 항목 | 주차 |
|---------|------|------|
| **P0 (필수)** | 게임 루프, 정산 엔진, 리더보드 | W3-6, W9 |
| **P1 (중요)** | UGC 챌린지, 모더레이션 | W7-8 |
| **P2 (선택)** | UGC 정책 덱 | W8 |
| **P3 (제외)** | 실시간 전쟁, 맵 시드, 길드 | - |

---

## 리스크 & 대응

| 리스크 | 확률 | 영향 | 대응 |
|--------|------|------|------|
| 정산 엔진 복잡성 | 중 | 높음 | 단순 공식으로 시작, 점진적 개선 |
| Vercel Cron 시간 제한 | 중 | 중 | 배치 분할, Pro 플랜 고려 |
| UGC 남용 | 중 | 중 | 기본 필터 + 신고 시스템 |
| 밸런스 문제 | 높음 | 중 | 파라미터화, 시즌 후 조정 |
| 일정 지연 | 중 | 중 | P2 항목 스코프 아웃 |

---

## 주간 체크인 포맷

```markdown
## Week N 체크인

### 완료 항목
- [x] Task N.1
- [x] Task N.2

### 미완료/블로커
- 이슈 설명

### 다음 주 계획
- Task N+1.1
- Task N+1.2

### 스코프 변경
- (있으면 기록)
```

---

## 산출물 검수 기준

### 문서 정합성 체크리스트

| 체크 | 항목 |
|------|------|
| [ ] | GDD의 스탯 9개 → ERD의 `currentStats` JSON 구조 |
| [ ] | GDD의 TurnDecision → ERD의 TurnDecision 테이블 |
| [ ] | GDD의 TurnSnapshot → ERD의 TurnSnapshot 테이블 |
| [ ] | GDD의 EventDefinition → ERD의 EventDefinition 테이블 |
| [ ] | GDD의 UGC 생명주기 → ERD의 `status` enum |
| [ ] | GDD의 Score 산식 → ARCHITECTURE의 `scoreCalculator.ts` |
| [ ] | ERD의 모든 엔티티 → ARCHITECTURE의 API 엔드포인트 |
| [ ] | ARCHITECTURE의 정산 엔진 → WBS의 Week 5 태스크 |
| [ ] | ARCHITECTURE의 모더레이션 → WBS의 Week 8 태스크 |

---

## 버전 로드맵

| 버전 | 기간 | 주요 기능 |
|------|------|----------|
| **v0.1 MVP** | Week 1-10 | 게임 루프, 챌린지, 리더보드 |
| v0.2 | +2주 | 맵 시드, 외교 개선 |
| v0.3 | +2주 | 길드/클랜, 시즌 패스 |
| v1.0 | +4주 | 모바일 최적화, 국제화 |

---

*v0.2 - 2024-01-19 작성*
*변경: TurnDecision/Snapshot 분리 반영, 이벤트 데이터 드리븐, 모더레이션 태스크, 문서 정합성 체크리스트*
