# World Sim

국가 대항 시뮬레이션 게임 (비동기 시즌제)

## 기술 스택

- **Framework**: Next.js 16 (App Router)
- **Database**: PostgreSQL + Prisma 7
- **Auth**: NextAuth.js (Google OAuth)
- **Cache**: Redis (선택)
- **Styling**: Tailwind CSS
- **State**: Zustand

## 시작하기

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경 변수 설정

`.env` 파일을 생성하고 다음 변수를 설정:

```env
# Database (PostgreSQL)
DATABASE_URL="postgresql://user:password@localhost:5432/worldsim?schema=public"

# Auth
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# Google OAuth (선택)
GOOGLE_CLIENT_ID="your-client-id"
GOOGLE_CLIENT_SECRET="your-client-secret"

# Redis (선택)
REDIS_URL="redis://localhost:6379"
```

### 3. 데이터베이스 설정

**옵션 A: Homebrew PostgreSQL (macOS)**
```bash
brew install postgresql@16
brew services start postgresql@16
createdb worldsim
```

**옵션 B: Docker**
```bash
docker run -d --name worldsim-db \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=worldsim \
  -p 5432:5432 \
  postgres:16
```

**옵션 C: Neon (서버리스)**
1. https://neon.tech 에서 프로젝트 생성
2. Connection string을 `DATABASE_URL`에 설정

### 4. 마이그레이션 및 시드

```bash
# 마이그레이션 실행
npx prisma migrate dev --name init

# 시드 데이터 생성
npx prisma db seed

# Prisma Client 생성
npx prisma generate
```

### 5. 개발 서버 실행

```bash
npm run dev
```

http://localhost:3000 에서 앱 확인

## 주요 명령어

```bash
npm run dev          # 개발 서버
npm run build        # 프로덕션 빌드
npm run start        # 프로덕션 서버
npm run lint         # 린트 검사
npm run lint:fix     # 린트 자동 수정

# Database
npx prisma migrate dev    # 마이그레이션
npx prisma db seed        # 시드 데이터
npx prisma studio         # DB GUI
npx prisma generate       # 클라이언트 생성
```

## 프로젝트 구조

```
src/
├── app/                 # Next.js App Router
│   ├── (auth)/          # 인증 페이지
│   ├── (main)/          # 메인 페이지
│   └── api/             # API Routes
├── components/          # React 컴포넌트
├── game/
│   └── engine/          # 게임 엔진 (정산, 이벤트)
├── lib/                 # 유틸리티
│   ├── auth/            # NextAuth 설정
│   ├── cache/           # Redis 클라이언트
│   └── db/              # Prisma 클라이언트
├── stores/              # Zustand 스토어
└── types/               # TypeScript 타입
prisma/
├── schema.prisma        # DB 스키마
└── seed.ts              # 시드 데이터
docs/
├── GDD.md               # 게임 디자인 문서
├── ERD.md               # 데이터 모델
├── ARCHITECTURE.md      # 기술 아키텍처
└── WBS.md               # 개발 일정
```

## 문서

- [게임 디자인 문서 (GDD)](docs/GDD.md)
- [데이터 모델 (ERD)](docs/ERD.md)
- [기술 아키텍처](docs/ARCHITECTURE.md)
- [개발 일정 (WBS)](docs/WBS.md)
