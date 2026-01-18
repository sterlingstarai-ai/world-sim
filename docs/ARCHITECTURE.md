# 기술 아키텍처 v0.2

> World Sim - 시스템 구조 및 API 설계

---

## 0. 문서 메타 및 기술 선택 이유

| 항목 | 내용 |
|------|------|
| 버전 | v0.2 |
| 작성일 | 2024-01-19 |
| 변경 이력 | v0.1 → v0.2: 정산 엔진 상세화, 중복 방지 락, 모더레이션 도구, TurnDecision/Snapshot API 분리 |

### 기술 선택 이유

| 기술 | 선택 이유 |
|------|----------|
| Next.js 14 App Router | 풀스택 (프론트+API), 서버 컴포넌트, Vercel 최적화 |
| PostgreSQL | 관계형 데이터, JSON 지원, 트랜잭션 |
| Redis | 리더보드 캐시, 분산 락, 간단한 PubSub |
| Prisma | 타입 안전 ORM, 마이그레이션 |
| Vercel Cron | 서버리스 배치 Job, 관리 비용 최소 |

---

## 1. 시스템 개요

### 1.1 아키텍처 다이어그램

```mermaid
flowchart TB
    subgraph Client
        Web[Next.js Web App]
        Mobile[Mobile PWA]
    end

    subgraph Server["Next.js 14 Server"]
        API[API Routes]
        SSR[Server Components]
    end

    subgraph Jobs["Batch Jobs"]
        Cron[Vercel Cron]
        Settlement[Settlement Engine]
    end

    subgraph Database
        PG[(PostgreSQL)]
        Redis[(Redis)]
    end

    Web --> API
    Mobile --> API
    Web --> SSR
    Mobile --> SSR

    API --> PG
    API --> Redis
    SSR --> PG

    Cron --> Settlement
    Settlement --> PG
    Settlement --> Redis

    Redis --> |캐시| API
    Redis --> |분산 락| Settlement
```

### 1.2 컴포넌트 역할

| 컴포넌트 | 역할 |
|---------|------|
| Web UI | 대시보드, 턴 입력, UGC 관리 |
| API Routes | REST API (인증, 게임, UGC, 리더보드) |
| Settlement Engine | 일일 정산 배치 Job |
| PostgreSQL | 영속 데이터 (ERD 엔티티) |
| Redis | 리더보드 캐시, 분산 락, 세션 캐시 |

---

## 2. 폴더 구조 (확정)

```
world-sim/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── (auth)/                   # 인증 라우트 그룹
│   │   │   ├── login/page.tsx
│   │   │   └── register/page.tsx
│   │   │
│   │   ├── (game)/                   # 게임 라우트 그룹
│   │   │   ├── dashboard/page.tsx    # 메인 대시보드
│   │   │   ├── play/page.tsx         # 턴 입력 화면
│   │   │   ├── history/page.tsx      # 턴 히스토리
│   │   │   ├── challenges/           # 챌린지
│   │   │   │   ├── page.tsx          # 목록
│   │   │   │   ├── [id]/page.tsx     # 상세
│   │   │   │   └── create/page.tsx   # 생성
│   │   │   ├── decks/                # 정책 덱
│   │   │   │   ├── page.tsx
│   │   │   │   ├── [id]/page.tsx
│   │   │   │   └── create/page.tsx
│   │   │   └── leaderboard/page.tsx  # 리더보드
│   │   │
│   │   ├── admin/                    # 어드민 (최소)
│   │   │   ├── moderation/page.tsx   # 신고 관리
│   │   │   └── events/page.tsx       # 이벤트 관리
│   │   │
│   │   ├── api/                      # API Routes
│   │   │   ├── auth/[...nextauth]/route.ts
│   │   │   ├── game/
│   │   │   │   ├── session/route.ts
│   │   │   │   ├── turn/
│   │   │   │   │   ├── decision/route.ts
│   │   │   │   │   └── snapshot/route.ts
│   │   │   │   ├── nations/route.ts
│   │   │   │   └── policies/route.ts
│   │   │   ├── ugc/
│   │   │   │   ├── challenges/route.ts
│   │   │   │   ├── decks/route.ts
│   │   │   │   └── report/route.ts
│   │   │   ├── leaderboard/route.ts
│   │   │   └── jobs/
│   │   │       └── daily-settlement/route.ts
│   │   │
│   │   ├── layout.tsx
│   │   └── page.tsx                  # 랜딩
│   │
│   ├── components/
│   │   ├── ui/                       # 공통 UI (버튼, 모달 등)
│   │   ├── game/                     # 게임 컴포넌트
│   │   │   ├── StatsDisplay.tsx
│   │   │   ├── BudgetSlider.tsx
│   │   │   ├── PolicyCardSlot.tsx
│   │   │   ├── EventNotification.tsx
│   │   │   └── TurnResultReport.tsx
│   │   ├── challenge/
│   │   ├── leaderboard/
│   │   └── moderation/
│   │
│   ├── lib/
│   │   ├── db/
│   │   │   └── prisma.ts             # Prisma 클라이언트
│   │   ├── cache/
│   │   │   └── redis.ts              # Redis 클라이언트
│   │   ├── auth/
│   │   │   └── config.ts             # NextAuth 설정
│   │   ├── game/                     # 게임 로직
│   │   │   ├── engine/
│   │   │   │   ├── settlement.ts     # 정산 메인 로직
│   │   │   │   ├── statsCalculator.ts
│   │   │   │   ├── eventProcessor.ts
│   │   │   │   └── scoreCalculator.ts
│   │   │   ├── constants/
│   │   │   │   ├── stats.ts
│   │   │   │   └── budgetCategories.ts
│   │   │   └── validation/
│   │   │       ├── turnDecision.ts
│   │   │       └── challenge.ts
│   │   ├── ugc/
│   │   │   ├── templateValidator.ts
│   │   │   └── contentFilter.ts      # 금지어 필터
│   │   ├── leaderboard/
│   │   │   ├── snapshot.ts
│   │   │   └── cache.ts
│   │   └── moderation/
│   │       └── actions.ts
│   │
│   ├── stores/                       # Zustand
│   │   ├── useGameStore.ts
│   │   ├── useUserStore.ts
│   │   └── useUIStore.ts
│   │
│   └── types/
│       ├── game.ts
│       ├── ugc.ts
│       ├── leaderboard.ts
│       └── api.ts
│
├── prisma/
│   ├── schema.prisma
│   ├── seed.ts                       # 초기 데이터
│   └── migrations/
│
├── jobs/
│   └── daily-settlement.ts           # 정산 배치 스크립트
│
├── docs/
│   ├── PROJECT_CONTEXT.md
│   ├── GDD.md
│   ├── ERD.md
│   ├── ARCHITECTURE.md
│   └── WBS.md
│
├── tests/
│   ├── unit/
│   │   ├── statsCalculator.test.ts
│   │   ├── eventProcessor.test.ts
│   │   └── scoreCalculator.test.ts
│   └── integration/
│       └── settlement.test.ts
│
├── vercel.json                       # Cron 설정
├── .env.example
├── package.json
└── CLAUDE.md
```

---

## 3. API 설계

### 3.1 인증 API (`/api/auth/*`)

| Method | Endpoint | 설명 | 인증 |
|--------|----------|------|------|
| POST | `/api/auth/signin` | 소셜 로그인 | - |
| POST | `/api/auth/signout` | 로그아웃 | 필요 |
| GET | `/api/auth/session` | 세션 확인 | - |
| GET | `/api/auth/me` | 현재 유저 정보 | 필요 |

### 3.2 게임 API (`/api/game/*`)

| Method | Endpoint | 설명 | 인증 |
|--------|----------|------|------|
| POST | `/api/game/session` | 새 GameSession 생성 | 필요 |
| GET | `/api/game/session/current` | 현재 활성 세션 | 필요 |
| GET | `/api/game/session/:id` | 세션 상세 | 필요 |
| POST | `/api/game/turn/decision` | TurnDecision 제출 | 필요 |
| GET | `/api/game/turn/decision/latest` | 현재 턴 입력 조회 | 필요 |
| GET | `/api/game/turn/snapshot/latest` | 최근 TurnSnapshot | 필요 |
| GET | `/api/game/turn/snapshot/:turnNumber` | 특정 턴 결과 | 필요 |
| GET | `/api/game/nations` | 국가 템플릿 목록 | - |
| GET | `/api/game/policies` | 정책 카드 목록 | - |
| GET | `/api/game/seasons` | 시즌 목록 | - |
| GET | `/api/game/seasons/current` | 현재 시즌 | - |

**TurnDecision 제출 (POST /api/game/turn/decision)**
```typescript
// Request
{
  "sessionId": "uuid",
  "budget": {
    "economy": 30,
    "welfare": 20,
    "research": 20,
    "military": 15,
    "diplomacy": 15
  },
  "activePolicies": ["policy-id-1", "policy-id-2", "policy-id-3"],
  "diplomacyActions": [
    { "type": "TRADE", "targetSessionId": "uuid" }
  ]
}

// Response
{
  "success": true,
  "turnDecision": { ... },
  "message": "턴 입력이 저장되었습니다. 자정에 정산됩니다."
}
```

**TurnSnapshot 응답 (GET /api/game/turn/snapshot/latest)**
```typescript
{
  "turnNumber": 5,
  "statsSnapshot": {
    "gdp": 350,
    "industry": 35,
    "resource": 48,
    "techLevel": 2,
    "research": 32,
    "military": 55,
    "population": 5100,
    "happiness": 58,
    "diplomacy": 52,
    "internationalTrust": 55
  },
  "events": [
    {
      "id": "uuid",
      "definitionId": "economic-boom",
      "name": "경제 호황",
      "effects": { "gdp": 20, "happiness": 5 }
    }
  ],
  "scoreChange": 120,
  "totalScore": 1540,
  "processedAt": "2024-01-19T00:00:00Z"
}
```

### 3.3 UGC API (`/api/ugc/*`)

| Method | Endpoint | 설명 | 인증 |
|--------|----------|------|------|
| GET | `/api/ugc/challenges` | 챌린지 목록 | - |
| GET | `/api/ugc/challenges/:id` | 챌린지 상세 | - |
| POST | `/api/ugc/challenges` | 챌린지 생성 | 필요 |
| PATCH | `/api/ugc/challenges/:id` | 챌린지 수정 | 필요 |
| POST | `/api/ugc/challenges/:id/publish` | 챌린지 공개 | 필요 |
| POST | `/api/ugc/challenges/:id/play` | 챌린지 플레이 시작 | 필요 |
| POST | `/api/ugc/challenges/:id/like` | 좋아요 | 필요 |
| GET | `/api/ugc/decks` | 정책 덱 목록 | - |
| GET | `/api/ugc/decks/:id` | 덱 상세 | - |
| POST | `/api/ugc/decks` | 덱 생성 | 필요 |
| POST | `/api/ugc/decks/:id/publish` | 덱 공개 | 필요 |
| POST | `/api/ugc/decks/:id/copy` | 덱 복사 | 필요 |
| POST | `/api/ugc/report` | UGC 신고 | 필요 |

**챌린지 생성 (POST /api/ugc/challenges)**
```typescript
// Request
{
  "title": "자원 빈국의 역전",
  "description": "자원 없이 30턴 내 GDP 1위",
  "startNationTemplate": "balanced",
  "seed": 12345,
  "constraints": [
    { "type": "STAT_LOCK", "stat": "resource", "value": 0 }
  ],
  "winConditions": [
    { "type": "STAT_REACH", "stat": "gdp", "value": 1000 }
  ],
  "turnLimit": 30,
  "difficulty": "HARD"
}

// Response
{
  "success": true,
  "challenge": { "id": "uuid", "status": "DRAFT", ... }
}
```

### 3.4 리더보드 API (`/api/leaderboard/*`)

| Method | Endpoint | 설명 | 인증 |
|--------|----------|------|------|
| GET | `/api/leaderboard/season/current` | 현재 시즌 리더보드 | - |
| GET | `/api/leaderboard/season/:id` | 특정 시즌 리더보드 | - |
| GET | `/api/leaderboard/category/:category` | 부문별 리더보드 | - |
| GET | `/api/leaderboard/me` | 내 순위 | 필요 |

**리더보드 응답**
```typescript
{
  "seasonId": "uuid",
  "type": "SEASON",
  "category": "ALL",
  "snapshotDate": "2024-01-19",
  "rankings": [
    {
      "rank": 1,
      "userId": "uuid",
      "nickname": "Player1",
      "nationTemplate": "industrial",
      "score": 1540
    },
    // ...
  ],
  "totalPlayers": 1500,
  "myRank": 42  // 로그인 시
}
```

### 3.5 정산 배치 API (`/api/jobs/*`)

| Method | Endpoint | 설명 | 인증 |
|--------|----------|------|------|
| POST | `/api/jobs/daily-settlement` | 일일 정산 트리거 | Cron Secret |
| GET | `/api/jobs/status` | 정산 상태 확인 | Admin |

---

## 4. 일일 정산 엔진 (핵심)

### 4.1 실행 방식

**선택: Vercel Cron → API 호출**

```json
// vercel.json
{
  "crons": [
    {
      "path": "/api/jobs/daily-settlement",
      "schedule": "0 15 * * *"  // UTC 15:00 = KST 00:00
    }
  ]
}
```

**제한사항 및 대응**:
| 제한 | 대응 |
|------|------|
| 실행 시간 10초 (Hobby) / 60초 (Pro) | 배치 분할, 비동기 처리 |
| 중복 실행 가능 | Redis 분산 락 |
| 실패 시 자동 재시도 없음 | 수동 재실행 API |

### 4.2 정산 로직 흐름

```mermaid
sequenceDiagram
    participant Cron as Vercel Cron
    participant API as Settlement API
    participant Lock as Redis Lock
    participant DB as PostgreSQL
    participant Cache as Redis Cache

    Cron->>API: POST /api/jobs/daily-settlement
    API->>Lock: 락 획득 시도 (season:date)

    alt 락 획득 실패
        Lock-->>API: 이미 실행 중
        API-->>Cron: 409 Conflict
    end

    Lock-->>API: 락 획득 성공

    API->>DB: 활성 세션 조회 (ACTIVE)

    loop 각 세션
        API->>DB: TurnDecision 조회 (미제출 시 기본값)
        API->>API: 예산 효과 계산
        API->>API: 정책 효과 적용
        API->>DB: EventDefinition 조회
        API->>API: 이벤트 롤 (확률 계산)
        API->>API: EventInstance 생성
        API->>API: 스탯 업데이트
        API->>API: Score 계산
        API->>DB: TurnSnapshot 저장
        API->>DB: GameSession.currentStats 업데이트
    end

    API->>DB: LeaderboardSnapshot 생성
    API->>Cache: 리더보드 캐시 갱신
    API->>Lock: 락 해제
    API-->>Cron: 200 OK
```

### 4.3 중복 실행 방지 (필수)

```typescript
// lib/cache/lock.ts
import { redis } from './redis';

const LOCK_TTL = 300; // 5분

export async function acquireLock(key: string): Promise<boolean> {
  const result = await redis.set(key, 'locked', {
    nx: true,  // 없을 때만 설정
    ex: LOCK_TTL
  });
  return result === 'OK';
}

export async function releaseLock(key: string): Promise<void> {
  await redis.del(key);
}

// 사용
const lockKey = `settlement:${seasonId}:${date}`;
const acquired = await acquireLock(lockKey);

if (!acquired) {
  return { error: '이미 정산 진행 중', status: 409 };
}

try {
  await processSettlement();
} finally {
  await releaseLock(lockKey);
}
```

### 4.4 Idempotency (멱등성)

```typescript
// 이미 정산된 턴인지 확인
const existingSnapshot = await prisma.turnSnapshot.findUnique({
  where: {
    sessionId_turnNumber: {
      sessionId: session.id,
      turnNumber: currentTurn
    }
  }
});

if (existingSnapshot) {
  console.log(`Skip: Session ${session.id} Turn ${currentTurn} already processed`);
  continue;
}
```

### 4.5 정산 계산 로직

```typescript
// lib/game/engine/settlement.ts

interface SettlementResult {
  statsSnapshot: Stats;
  events: EventInstance[];
  scoreChange: number;
  totalScore: number;
}

export async function processSession(
  session: GameSession,
  decision: TurnDecision | null
): Promise<SettlementResult> {
  // 1. 미제출 시 기본값
  const budget = decision?.budget ?? DEFAULT_BUDGET;
  const policies = decision?.activePolicies ?? [];

  // 2. 예산 효과 계산
  let stats = { ...session.currentStats };
  stats = applyBudgetEffects(stats, budget);

  // 3. 정책 효과 적용
  stats = applyPolicyEffects(stats, policies);

  // 4. 이벤트 롤
  const events = await rollEvents(stats, session);
  for (const event of events) {
    stats = applyEventEffects(stats, event);
  }

  // 5. Score 계산
  const scoreChange = calculateScore(stats) - session.totalScore;
  const totalScore = session.totalScore + scoreChange;

  return {
    statsSnapshot: stats,
    events,
    scoreChange,
    totalScore
  };
}
```

---

## 5. 캐시 & 리더보드 전략

### 5.1 캐시 구조

| 키 패턴 | 데이터 | TTL |
|---------|--------|-----|
| `leaderboard:season:{id}:all` | Sorted Set (userId → score) | 5분 |
| `leaderboard:season:{id}:economy` | Sorted Set | 5분 |
| `leaderboard:season:{id}:tech` | Sorted Set | 5분 |
| `session:{id}:stats` | Hash (현재 스탯) | 30분 |
| `season:current` | String (seasonId) | 1시간 |

### 5.2 리더보드 갱신

```typescript
// 정산 후 리더보드 업데이트
async function updateLeaderboard(seasonId: string) {
  // 1. DB에서 모든 세션 점수 조회
  const sessions = await prisma.gameSession.findMany({
    where: { seasonId, status: 'ACTIVE' },
    select: { userId: true, totalScore: true }
  });

  // 2. Redis Sorted Set 갱신
  const pipeline = redis.pipeline();
  for (const s of sessions) {
    pipeline.zadd(`leaderboard:season:${seasonId}:all`, {
      score: s.totalScore,
      member: s.userId
    });
  }
  await pipeline.exec();

  // 3. LeaderboardSnapshot 저장 (영속화)
  const rankings = await redis.zrevrange(
    `leaderboard:season:${seasonId}:all`,
    0, 99,
    'WITHSCORES'
  );

  await prisma.leaderboardSnapshot.create({
    data: {
      seasonId,
      snapshotDate: new Date(),
      type: 'DAILY',
      category: 'ALL',
      rankings: formatRankings(rankings),
      totalPlayers: sessions.length
    }
  });
}
```

---

## 6. 실시간 기능

### 6.1 MVP 전략

**MVP: 폴링 + Redis 캐시**
- 리더보드: 5분 캐시 + 폴링
- 실시간 소켓 없음

### 6.2 후속 확장 (v2)

```
Redis Pub/Sub → SSE (Server-Sent Events)
```

---

## 7. 보안 & 운영

### 7.1 인증/인가

```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  const session = await getToken({ req: request });

  // 보호된 라우트
  if (request.nextUrl.pathname.startsWith('/api/game')) {
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  // 어드민 라우트
  if (request.nextUrl.pathname.startsWith('/admin')) {
    if (!session?.isAdmin) {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return NextResponse.next();
}
```

### 7.2 입력 검증 (Zod)

```typescript
// lib/game/validation/turnDecision.ts
import { z } from 'zod';

export const TurnDecisionSchema = z.object({
  sessionId: z.string().uuid(),
  budget: z.object({
    economy: z.number().min(5).max(50),
    welfare: z.number().min(5).max(50),
    research: z.number().min(5).max(50),
    military: z.number().min(5).max(50),
    diplomacy: z.number().min(5).max(50),
  }).refine(data => {
    const sum = Object.values(data).reduce((a, b) => a + b, 0);
    return sum === 100;
  }, { message: '예산 합계는 100이어야 합니다' }),
  activePolicies: z.array(z.string()).max(3),
  diplomacyActions: z.array(z.object({
    type: z.enum(['TRADE', 'ALLIANCE', 'SANCTION']),
    targetSessionId: z.string().uuid()
  })).optional()
});
```

### 7.3 Rate Limiting

```typescript
// Vercel Edge Middleware or Redis-based
const RATE_LIMITS = {
  'POST /api/ugc/challenges': { limit: 10, window: 3600 },  // 1시간 10개
  'POST /api/ugc/report': { limit: 20, window: 3600 },      // 1시간 20개
  'POST /api/game/turn/decision': { limit: 100, window: 86400 }  // 1일 100개
};
```

### 7.4 모더레이션 도구

**최소 어드민 UI**:
- 신고 목록 조회 (PENDING 필터)
- UGC 상태 변경 (HIDE/BAN)
- 제재 로그 기록

```typescript
// /api/admin/moderation/action
export async function POST(req: Request) {
  const { reportId, action, reason } = await req.json();

  // 1. UGC 상태 변경
  await prisma.challenge.update({
    where: { id: report.targetId },
    data: { status: action === 'BAN' ? 'BANNED' : 'HIDDEN' }
  });

  // 2. ModerationAction 기록
  await prisma.moderationAction.create({
    data: {
      reportId,
      adminId: session.userId,
      targetType: report.targetType,
      targetId: report.targetId,
      action,
      reason
    }
  });

  // 3. Report 상태 업데이트
  await prisma.ugcReport.update({
    where: { id: reportId },
    data: { status: 'ACTIONED' }
  });
}
```

---

## 8. 환경 변수

```env
# .env.example

# Database
DATABASE_URL=postgresql://user:pass@host:5432/worldsim

# Redis
REDIS_URL=redis://host:6379

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key

# OAuth Providers
GOOGLE_CLIENT_ID=xxx
GOOGLE_CLIENT_SECRET=xxx
KAKAO_CLIENT_ID=xxx
KAKAO_CLIENT_SECRET=xxx

# Cron Job
CRON_SECRET=your-cron-secret

# Admin
ADMIN_EMAILS=admin@example.com
```

---

## 9. 배포 체크리스트

### MVP 배포 전 필수

- [ ] 환경 변수 설정 (Vercel)
- [ ] DB 마이그레이션 실행
- [ ] 시드 데이터 투입 (국가 템플릿, 정책 카드, 이벤트)
- [ ] Vercel Cron 설정
- [ ] Redis 연결 확인
- [ ] 정산 락 테스트
- [ ] 에러 로깅 설정

---

*v0.2 - 2024-01-19 작성*
*변경: 정산 엔진 락/멱등성, TurnDecision/Snapshot API 분리, 모더레이션 도구*
