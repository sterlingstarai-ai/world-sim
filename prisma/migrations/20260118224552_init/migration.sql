-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'ABANDONED');

-- CreateEnum
CREATE TYPE "SeasonStatus" AS ENUM ('UPCOMING', 'ACTIVE', 'ENDED');

-- CreateEnum
CREATE TYPE "Direction" AS ENUM ('INDUSTRY', 'FINANCE', 'MILITARY', 'TECH');

-- CreateEnum
CREATE TYPE "Difficulty" AS ENUM ('EASY', 'NORMAL', 'HARD', 'EXTREME');

-- CreateEnum
CREATE TYPE "UGCStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'UNDER_REVIEW', 'HIDDEN', 'BANNED');

-- CreateEnum
CREATE TYPE "PolicyCategory" AS ENUM ('ECONOMY', 'WELFARE', 'TECH', 'MILITARY', 'DIPLOMACY', 'RISK');

-- CreateEnum
CREATE TYPE "EventCategory" AS ENUM ('ECONOMY', 'MILITARY', 'TECH', 'SOCIAL', 'DIPLOMACY');

-- CreateEnum
CREATE TYPE "LeaderboardType" AS ENUM ('DAILY', 'WEEKLY', 'SEASON', 'CATEGORY');

-- CreateEnum
CREATE TYPE "ReportReason" AS ENUM ('HATE', 'POLITICS', 'VIOLENCE', 'SPAM', 'OTHER');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('PENDING', 'REVIEWED', 'DISMISSED', 'ACTIONED');

-- CreateEnum
CREATE TYPE "ModerationActionType" AS ENUM ('WARN', 'HIDE', 'BAN', 'RESTORE');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "nickname" TEXT,
    "avatarUrl" TEXT,
    "provider" TEXT,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "Season" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "status" "SeasonStatus" NOT NULL DEFAULT 'UPCOMING',
    "scoreWeights" JSONB,
    "specialRules" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Season_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NationTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "flagUrl" TEXT,
    "initialStats" JSONB NOT NULL,

    CONSTRAINT "NationTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GameSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "seasonId" TEXT NOT NULL,
    "nationTemplateId" TEXT NOT NULL,
    "challengeId" TEXT,
    "mapSeedId" TEXT,
    "direction" "Direction" NOT NULL,
    "currentStats" JSONB NOT NULL,
    "currentTurn" INTEGER NOT NULL DEFAULT 1,
    "totalScore" INTEGER NOT NULL DEFAULT 0,
    "status" "SessionStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GameSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TurnDecision" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "turnNumber" INTEGER NOT NULL,
    "budget" JSONB NOT NULL,
    "activePolicies" JSONB NOT NULL,
    "diplomacyActions" JSONB,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TurnDecision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TurnSnapshot" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "turnNumber" INTEGER NOT NULL,
    "statsSnapshot" JSONB NOT NULL,
    "scoreChange" INTEGER NOT NULL DEFAULT 0,
    "totalScore" INTEGER NOT NULL DEFAULT 0,
    "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TurnSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventDefinition" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "EventCategory" NOT NULL,
    "triggers" JSONB NOT NULL,
    "effects" JSONB NOT NULL,
    "duration" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "EventDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventInstance" (
    "id" TEXT NOT NULL,
    "definitionId" TEXT NOT NULL,
    "snapshotId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "turnNumber" INTEGER NOT NULL,
    "appliedEffects" JSONB NOT NULL,
    "remainingDuration" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "EventInstance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Challenge" (
    "id" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "seasonScope" TEXT,
    "seed" INTEGER NOT NULL DEFAULT 0,
    "startNationTemplate" TEXT NOT NULL DEFAULT 'balanced',
    "constraints" JSONB NOT NULL,
    "winConditions" JSONB NOT NULL,
    "turnLimit" INTEGER NOT NULL DEFAULT 30,
    "difficulty" "Difficulty" NOT NULL DEFAULT 'NORMAL',
    "status" "UGCStatus" NOT NULL DEFAULT 'DRAFT',
    "playCount" INTEGER NOT NULL DEFAULT 0,
    "completionCount" INTEGER NOT NULL DEFAULT 0,
    "likeCount" INTEGER NOT NULL DEFAULT 0,
    "reportCount" INTEGER NOT NULL DEFAULT 0,
    "isOfficial" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Challenge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PolicyCard" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "PolicyCategory" NOT NULL,
    "description" TEXT NOT NULL,
    "effects" JSONB NOT NULL,
    "conditions" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "PolicyCard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PolicyDeck" (
    "id" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "playstyle" TEXT,
    "status" "UGCStatus" NOT NULL DEFAULT 'DRAFT',
    "copyCount" INTEGER NOT NULL DEFAULT 0,
    "likeCount" INTEGER NOT NULL DEFAULT 0,
    "reportCount" INTEGER NOT NULL DEFAULT 0,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PolicyDeck_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PolicyDeckCard" (
    "id" TEXT NOT NULL,
    "deckId" TEXT NOT NULL,
    "cardId" TEXT NOT NULL,
    "priority" INTEGER NOT NULL,

    CONSTRAINT "PolicyDeckCard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MapSeed" (
    "id" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "seed" INTEGER NOT NULL,
    "resourceRichness" TEXT NOT NULL DEFAULT 'NORMAL',
    "oilBias" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "mineralBias" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "tradeAccess" TEXT NOT NULL DEFAULT 'NORMAL',
    "disasterRate" TEXT NOT NULL DEFAULT 'NORMAL',
    "status" "UGCStatus" NOT NULL DEFAULT 'DRAFT',
    "playCount" INTEGER NOT NULL DEFAULT 0,
    "reportCount" INTEGER NOT NULL DEFAULT 0,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MapSeed_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeaderboardSnapshot" (
    "id" TEXT NOT NULL,
    "seasonId" TEXT NOT NULL,
    "snapshotDate" TIMESTAMP(3) NOT NULL,
    "type" "LeaderboardType" NOT NULL DEFAULT 'DAILY',
    "category" TEXT,
    "rankings" JSONB NOT NULL,
    "totalPlayers" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeaderboardSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UGCReport" (
    "id" TEXT NOT NULL,
    "reporterId" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "reason" "ReportReason" NOT NULL,
    "description" TEXT,
    "status" "ReportStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UGCReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ModerationAction" (
    "id" TEXT NOT NULL,
    "reportId" TEXT,
    "adminId" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "action" "ModerationActionType" NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ModerationAction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "Season_number_key" ON "Season"("number");

-- CreateIndex
CREATE INDEX "GameSession_userId_idx" ON "GameSession"("userId");

-- CreateIndex
CREATE INDEX "GameSession_seasonId_idx" ON "GameSession"("seasonId");

-- CreateIndex
CREATE INDEX "GameSession_status_idx" ON "GameSession"("status");

-- CreateIndex
CREATE INDEX "TurnDecision_sessionId_idx" ON "TurnDecision"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "TurnDecision_sessionId_turnNumber_key" ON "TurnDecision"("sessionId", "turnNumber");

-- CreateIndex
CREATE INDEX "TurnSnapshot_sessionId_idx" ON "TurnSnapshot"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "TurnSnapshot_sessionId_turnNumber_key" ON "TurnSnapshot"("sessionId", "turnNumber");

-- CreateIndex
CREATE INDEX "EventInstance_sessionId_idx" ON "EventInstance"("sessionId");

-- CreateIndex
CREATE INDEX "EventInstance_definitionId_idx" ON "EventInstance"("definitionId");

-- CreateIndex
CREATE INDEX "Challenge_status_idx" ON "Challenge"("status");

-- CreateIndex
CREATE INDEX "Challenge_creatorId_idx" ON "Challenge"("creatorId");

-- CreateIndex
CREATE INDEX "Challenge_isOfficial_idx" ON "Challenge"("isOfficial");

-- CreateIndex
CREATE INDEX "Challenge_publishedAt_idx" ON "Challenge"("publishedAt");

-- CreateIndex
CREATE INDEX "PolicyDeck_status_idx" ON "PolicyDeck"("status");

-- CreateIndex
CREATE INDEX "PolicyDeck_creatorId_idx" ON "PolicyDeck"("creatorId");

-- CreateIndex
CREATE UNIQUE INDEX "PolicyDeckCard_deckId_cardId_key" ON "PolicyDeckCard"("deckId", "cardId");

-- CreateIndex
CREATE INDEX "MapSeed_status_idx" ON "MapSeed"("status");

-- CreateIndex
CREATE INDEX "MapSeed_creatorId_idx" ON "MapSeed"("creatorId");

-- CreateIndex
CREATE INDEX "LeaderboardSnapshot_seasonId_snapshotDate_idx" ON "LeaderboardSnapshot"("seasonId", "snapshotDate");

-- CreateIndex
CREATE UNIQUE INDEX "LeaderboardSnapshot_seasonId_snapshotDate_type_category_key" ON "LeaderboardSnapshot"("seasonId", "snapshotDate", "type", "category");

-- CreateIndex
CREATE INDEX "UGCReport_status_idx" ON "UGCReport"("status");

-- CreateIndex
CREATE INDEX "UGCReport_targetType_targetId_idx" ON "UGCReport"("targetType", "targetId");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameSession" ADD CONSTRAINT "GameSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameSession" ADD CONSTRAINT "GameSession_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameSession" ADD CONSTRAINT "GameSession_nationTemplateId_fkey" FOREIGN KEY ("nationTemplateId") REFERENCES "NationTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameSession" ADD CONSTRAINT "GameSession_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "Challenge"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameSession" ADD CONSTRAINT "GameSession_mapSeedId_fkey" FOREIGN KEY ("mapSeedId") REFERENCES "MapSeed"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TurnDecision" ADD CONSTRAINT "TurnDecision_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "GameSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TurnSnapshot" ADD CONSTRAINT "TurnSnapshot_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "GameSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventInstance" ADD CONSTRAINT "EventInstance_definitionId_fkey" FOREIGN KEY ("definitionId") REFERENCES "EventDefinition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventInstance" ADD CONSTRAINT "EventInstance_snapshotId_fkey" FOREIGN KEY ("snapshotId") REFERENCES "TurnSnapshot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventInstance" ADD CONSTRAINT "EventInstance_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "GameSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Challenge" ADD CONSTRAINT "Challenge_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PolicyDeck" ADD CONSTRAINT "PolicyDeck_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PolicyDeckCard" ADD CONSTRAINT "PolicyDeckCard_deckId_fkey" FOREIGN KEY ("deckId") REFERENCES "PolicyDeck"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PolicyDeckCard" ADD CONSTRAINT "PolicyDeckCard_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "PolicyCard"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MapSeed" ADD CONSTRAINT "MapSeed_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaderboardSnapshot" ADD CONSTRAINT "LeaderboardSnapshot_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UGCReport" ADD CONSTRAINT "UGCReport_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModerationAction" ADD CONSTRAINT "ModerationAction_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "UGCReport"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModerationAction" ADD CONSTRAINT "ModerationAction_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
