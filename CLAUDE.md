# World Sim 프로젝트 규칙 (Claude Code)

> 이 프로젝트를 빠르게 이해하기 위한 메모리 파일

## 프로젝트 개요
- **World Sim**: 국가 대항 시뮬레이션 게임 (비동기 시즌제)
- **타입**: 웹 기반 게임 (모바일 대응)
- **언어**: 한국어 (Korean)
- **상세 컨텍스트**: `docs/PROJECT_CONTEXT.md` 참조

## 기본 작업 흐름
- 항상 **plan → execute → verify → summarize** 순서
- 기능 1개/버그 1개 단위로 작업
- 변경 전: git status/diff 확인
- 변경 후: 최소 1개 검증 (테스트 또는 재현)
- 결과물: **파일목록 + diff + 테스트 + 리스크** 포맷

## 기술 스택
- **Framework**: Next.js 16 (App Router)
- **State**: Zustand
- **Styling**: Tailwind CSS
- **Database**: Prisma 7 + PostgreSQL
- **Cache/Realtime**: Redis (선택)

## 주요 명령어
```bash
# 개발
npm run dev              # 개발 서버
npm run build            # 프로덕션 빌드
npm run test -- --watchAll=false   # 테스트
npm run lint             # 린트 검사
npm run lint:fix         # 린트 자동 수정

# DB
npx prisma migrate dev   # 마이그레이션 실행
npx prisma studio        # DB GUI
npx prisma generate      # 클라이언트 생성
```

## 폴더 구조 (예정)
```
src/
├── app/                # Next.js App Router 페이지
├── components/         # React 컴포넌트
├── lib/               # 유틸리티, 헬퍼
├── services/          # API 서비스
├── stores/            # Zustand 스토어
├── types/             # TypeScript 타입
└── game/              # 게임 로직
    ├── engine/        # 정산 엔진
    ├── nations/       # 국가 데이터/로직
    ├── challenges/    # UGC 챌린지
    └── policies/      # 정책 시스템
prisma/
├── schema.prisma      # DB 스키마
└── seed.ts            # 초기 데이터
docs/
├── PROJECT_CONTEXT.md # 프로젝트 배경/기획
├── GDD.md             # 게임 디자인 문서
├── ERD.md             # 데이터 모델
├── ARCHITECTURE.md    # 기술 아키텍처
└── WBS.md             # 개발 일정
```

## 코드 스타일/품질
- TypeScript strict mode
- async/await 사용 (.then() 지양)
- 절대 경로 import (@/)
- try-catch + 에러 처리
- 함수형 컴포넌트 + 명시적 반환 타입
- 최소 변경 원칙 (불필요한 리팩토링 금지)

## 테스트/검증
- TDD: 실패하는 테스트 먼저 작성
- 테스트 명령어: `npm run test -- --watchAll=false`

## Git 규칙
- 브랜치: feature/..., fix/..., refactor/...
- 커밋: Conventional Commits (feat:, fix:, refactor:, docs:, test:)
- PR: 변경 요약 + 테스트 결과 + 리스크

## 보안/비밀정보
- .env, secrets, credentials 파일 접근 금지
- API 키/토큰/개인정보 출력 금지

## 현재 단계
- [x] 아이디어 검토 완료
- [x] Plan: GDD v0.2 → `docs/GDD.md`
- [x] Plan: 데이터 모델 (ERD) v0.2 → `docs/ERD.md`
- [x] Plan: 기술 아키텍처 v0.2 → `docs/ARCHITECTURE.md`
- [x] Plan: WBS v0.2 (10주) → `docs/WBS.md`
- [x] Execute: Week 2 - 프로젝트 셋업
  - [x] Next.js 14 프로젝트 생성
  - [x] Prisma 스키마 작성 (마이그레이션은 DB 설정 후)
  - [x] NextAuth + Redis 설정
  - [x] 시드 데이터 작성 (5 NationTemplates, 19 PolicyCards, 20 EventDefinitions)
- [x] Execute: Week 3 - GameSession API + 대시보드 UI
  - [x] GameSession CRUD API
  - [x] 대시보드 페이지
  - [x] 새 게임 모달
- [x] Execute: Week 4 - TurnDecision API + 턴 입력 UI
  - [x] TurnDecision API
  - [x] 예산 배분 슬라이더
  - [x] 정책 선택 UI
  - [x] 게임 플레이 페이지
- [x] Execute: Week 5 - 정산 엔진
  - [x] statsCalculator (예산/정책/자연변화 효과)
  - [x] scoreCalculator (점수 계산)
  - [x] settlementProcessor (정산 프로세서)
- [x] Execute: Week 6 - 이벤트 시스템 + TurnSnapshot API
  - [x] eventProcessor (이벤트 트리거/적용)
  - [x] TurnSnapshot API (턴 히스토리)
  - [x] Settlement API (정산 트리거)
- [ ] Execute: Week 7-8 - UGC (챌린지, 정책덱)
- [ ] Execute: Week 9-10 - 리더보드 + 최종 테스트

## 빌드 상태
- `npm run build`: 성공
- `npm run lint`: 통과 (warnings만)
- 데이터베이스 마이그레이션: PostgreSQL 설정 후 실행 필요

## 다음 단계
1. PostgreSQL 설정 (README.md 참조)
2. `npx prisma migrate dev --name init`
3. `npx prisma db seed`
4. `npm run dev`

## Decision Log (핵심 결정)
- 1일 1턴 (비동기) 고정
- Nation은 세션 단위 (1유저 = 1국가 인스턴스)
- TurnDecision / TurnSnapshot 분리
- Leaderboard는 집계/스냅샷 (Redis + LeaderboardSnapshot)
- UGC 모더레이션 상태 필수 (DRAFT → PUBLISHED → HIDDEN/BANNED)
- 이벤트는 데이터 드리븐 (EventDefinition/Instance)
- MVP 실시간 없음 (폴링 + 캐시)

## 주의사항
- 이 프로젝트는 **개발 초보자**가 진행함
- 복잡한 것보다 **단순하고 동작하는 것** 우선
- 범위 확장 금지 - MVP 스코프 엄수
