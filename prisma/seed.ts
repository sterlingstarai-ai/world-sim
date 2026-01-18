import { PrismaClient, PolicyCategory, EventCategory, Difficulty, SeasonStatus, Prisma } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

// Create PostgreSQL connection pool for Prisma 7
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set');
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// ==================== NATION TEMPLATES ====================

const nationTemplates = [
  {
    id: 'balanced',
    name: 'balanced',
    displayName: '균형 국가',
    flagUrl: null,
    initialStats: {
      gdp: 100,
      industry: 50,
      resources: 50,
      techLevel: 30,
      research: 30,
      military: 30,
      population: 50,
      happiness: 50,
      diplomacy: 50,
    },
  },
  {
    id: 'industrial',
    name: 'industrial',
    displayName: '산업 강국',
    flagUrl: null,
    initialStats: {
      gdp: 120,
      industry: 70,
      resources: 60,
      techLevel: 25,
      research: 25,
      military: 25,
      population: 55,
      happiness: 45,
      diplomacy: 40,
    },
  },
  {
    id: 'financial',
    name: 'financial',
    displayName: '금융 허브',
    flagUrl: null,
    initialStats: {
      gdp: 150,
      industry: 40,
      resources: 30,
      techLevel: 35,
      research: 30,
      military: 20,
      population: 45,
      happiness: 55,
      diplomacy: 60,
    },
  },
  {
    id: 'military',
    name: 'military',
    displayName: '군사 대국',
    flagUrl: null,
    initialStats: {
      gdp: 90,
      industry: 55,
      resources: 45,
      techLevel: 30,
      research: 25,
      military: 60,
      population: 55,
      happiness: 40,
      diplomacy: 35,
    },
  },
  {
    id: 'tech',
    name: 'tech',
    displayName: '기술 선진국',
    flagUrl: null,
    initialStats: {
      gdp: 110,
      industry: 45,
      resources: 35,
      techLevel: 50,
      research: 55,
      military: 25,
      population: 45,
      happiness: 55,
      diplomacy: 50,
    },
  },
];

// ==================== POLICY CARDS ====================

const policyCards = [
  // ECONOMY
  {
    id: 'export-boost',
    name: '수출 촉진 정책',
    category: PolicyCategory.ECONOMY,
    description: '수출 장려금을 통해 GDP를 증가시킵니다.',
    effects: [{ stat: 'gdp', type: 'ADD', value: 10 }],
    conditions: Prisma.DbNull,
  },
  {
    id: 'industrial-subsidy',
    name: '산업 보조금',
    category: PolicyCategory.ECONOMY,
    description: '제조업체에 보조금을 지급하여 산업력을 높입니다.',
    effects: [{ stat: 'industry', type: 'ADD', value: 5 }],
    conditions: Prisma.DbNull,
  },
  {
    id: 'resource-extraction',
    name: '자원 개발 확대',
    category: PolicyCategory.ECONOMY,
    description: '자원 채굴을 확대하여 자원량을 늘립니다.',
    effects: [
      { stat: 'resources', type: 'ADD', value: 8 },
      { stat: 'happiness', type: 'ADD', value: -3 },
    ],
    conditions: Prisma.DbNull,
  },
  {
    id: 'free-trade',
    name: '자유무역협정',
    category: PolicyCategory.ECONOMY,
    description: '무역장벽을 낮춰 GDP와 외교력을 높입니다.',
    effects: [
      { stat: 'gdp', type: 'ADD', value: 8 },
      { stat: 'diplomacy', type: 'ADD', value: 5 },
    ],
    conditions: Prisma.DbNull,
  },
  // WELFARE
  {
    id: 'universal-healthcare',
    name: '국민건강보험 확대',
    category: PolicyCategory.WELFARE,
    description: '의료 보장을 확대하여 행복도와 인구를 늘립니다.',
    effects: [
      { stat: 'happiness', type: 'ADD', value: 8 },
      { stat: 'population', type: 'ADD', value: 2 },
    ],
    conditions: Prisma.DbNull,
  },
  {
    id: 'education-investment',
    name: '교육 투자',
    category: PolicyCategory.WELFARE,
    description: '교육에 투자하여 연구력을 높이고 행복도를 올립니다.',
    effects: [
      { stat: 'research', type: 'ADD', value: 5 },
      { stat: 'happiness', type: 'ADD', value: 3 },
    ],
    conditions: Prisma.DbNull,
  },
  {
    id: 'housing-program',
    name: '주택 공급 확대',
    category: PolicyCategory.WELFARE,
    description: '주택 공급을 늘려 행복도와 인구를 증가시킵니다.',
    effects: [
      { stat: 'happiness', type: 'ADD', value: 5 },
      { stat: 'population', type: 'ADD', value: 3 },
    ],
    conditions: Prisma.DbNull,
  },
  // TECH
  {
    id: 'research-grant',
    name: '연구 지원금',
    category: PolicyCategory.TECH,
    description: '연구개발 지원금을 지급하여 연구력을 높입니다.',
    effects: [{ stat: 'research', type: 'ADD', value: 8 }],
    conditions: Prisma.DbNull,
  },
  {
    id: 'tech-park',
    name: '기술 클러스터 조성',
    category: PolicyCategory.TECH,
    description: '기술 단지를 조성하여 기술 레벨을 높입니다.',
    effects: [
      { stat: 'techLevel', type: 'ADD', value: 5 },
      { stat: 'industry', type: 'ADD', value: 3 },
    ],
    conditions: [{ stat: 'research', operator: 'GTE', value: 30 }],
  },
  {
    id: 'digital-infrastructure',
    name: '디지털 인프라 구축',
    category: PolicyCategory.TECH,
    description: '디지털 인프라를 구축하여 기술 레벨과 GDP를 올립니다.',
    effects: [
      { stat: 'techLevel', type: 'ADD', value: 3 },
      { stat: 'gdp', type: 'ADD', value: 5 },
    ],
    conditions: Prisma.DbNull,
  },
  // MILITARY
  {
    id: 'defense-budget',
    name: '국방비 증액',
    category: PolicyCategory.MILITARY,
    description: '국방 예산을 늘려 군사력을 높입니다.',
    effects: [
      { stat: 'military', type: 'ADD', value: 8 },
      { stat: 'happiness', type: 'ADD', value: -2 },
    ],
    conditions: Prisma.DbNull,
  },
  {
    id: 'military-modernization',
    name: '군 현대화',
    category: PolicyCategory.MILITARY,
    description: '최신 무기 체계를 도입하여 군사력과 기술력을 높입니다.',
    effects: [
      { stat: 'military', type: 'ADD', value: 5 },
      { stat: 'techLevel', type: 'ADD', value: 2 },
    ],
    conditions: [{ stat: 'techLevel', operator: 'GTE', value: 25 }],
  },
  {
    id: 'conscription',
    name: '징병제 강화',
    category: PolicyCategory.MILITARY,
    description: '징병 규모를 늘려 군사력을 크게 높이지만 행복도가 떨어집니다.',
    effects: [
      { stat: 'military', type: 'ADD', value: 12 },
      { stat: 'happiness', type: 'ADD', value: -8 },
    ],
    conditions: Prisma.DbNull,
  },
  // DIPLOMACY
  {
    id: 'diplomatic-mission',
    name: '외교 사절단 파견',
    category: PolicyCategory.DIPLOMACY,
    description: '외교 사절단을 파견하여 외교력을 높입니다.',
    effects: [{ stat: 'diplomacy', type: 'ADD', value: 8 }],
    conditions: Prisma.DbNull,
  },
  {
    id: 'cultural-exchange',
    name: '문화 교류 확대',
    category: PolicyCategory.DIPLOMACY,
    description: '문화 교류를 통해 외교력과 행복도를 높입니다.',
    effects: [
      { stat: 'diplomacy', type: 'ADD', value: 5 },
      { stat: 'happiness', type: 'ADD', value: 3 },
    ],
    conditions: Prisma.DbNull,
  },
  {
    id: 'foreign-aid',
    name: '해외 원조',
    category: PolicyCategory.DIPLOMACY,
    description: 'GDP의 일부를 원조하여 외교력을 크게 높입니다.',
    effects: [
      { stat: 'diplomacy', type: 'ADD', value: 10 },
      { stat: 'gdp', type: 'ADD', value: -5 },
    ],
    conditions: [{ stat: 'gdp', operator: 'GTE', value: 80 }],
  },
  // RISK
  {
    id: 'austerity-measures',
    name: '긴축 정책',
    category: PolicyCategory.RISK,
    description: '재정 긴축을 통해 GDP를 높이지만 행복도가 크게 떨어집니다.',
    effects: [
      { stat: 'gdp', type: 'ADD', value: 15 },
      { stat: 'happiness', type: 'ADD', value: -10 },
    ],
    conditions: Prisma.DbNull,
  },
  {
    id: 'aggressive-expansion',
    name: '적극적 팽창 정책',
    category: PolicyCategory.RISK,
    description: '영토를 확장하여 자원을 얻지만 외교력이 떨어집니다.',
    effects: [
      { stat: 'resources', type: 'ADD', value: 15 },
      { stat: 'diplomacy', type: 'ADD', value: -12 },
    ],
    conditions: [{ stat: 'military', operator: 'GTE', value: 40 }],
  },
  {
    id: 'deregulation',
    name: '규제 완화',
    category: PolicyCategory.RISK,
    description: '규제를 완화하여 산업력을 높이지만 행복도가 떨어집니다.',
    effects: [
      { stat: 'industry', type: 'ADD', value: 10 },
      { stat: 'gdp', type: 'ADD', value: 8 },
      { stat: 'happiness', type: 'ADD', value: -5 },
    ],
    conditions: Prisma.DbNull,
  },
];

// ==================== EVENT DEFINITIONS (20개) ====================

const eventDefinitions = [
  // ECONOMY EVENTS
  {
    id: 'financial-crisis',
    name: '금융 위기',
    category: EventCategory.ECONOMY,
    triggers: [{ type: 'STAT_THRESHOLD', stat: 'gdp', operator: 'LT', value: 50 }],
    effects: [
      { stat: 'gdp', type: 'ADD', value: -20 },
      { stat: 'happiness', type: 'ADD', value: -10 },
    ],
    duration: 2,
  },
  {
    id: 'economic-boom',
    name: '경제 호황',
    category: EventCategory.ECONOMY,
    triggers: [
      { type: 'STAT_THRESHOLD', stat: 'gdp', operator: 'GTE', value: 150 },
      { type: 'RANDOM', probability: 0.3 },
    ],
    effects: [
      { stat: 'gdp', type: 'ADD', value: 25 },
      { stat: 'happiness', type: 'ADD', value: 5 },
    ],
    duration: 0,
  },
  {
    id: 'trade-war',
    name: '무역 전쟁',
    category: EventCategory.ECONOMY,
    triggers: [{ type: 'STAT_THRESHOLD', stat: 'diplomacy', operator: 'LT', value: 30 }],
    effects: [
      { stat: 'gdp', type: 'ADD', value: -15 },
      { stat: 'industry', type: 'ADD', value: -5 },
    ],
    duration: 3,
  },
  {
    id: 'resource-discovery',
    name: '자원 발견',
    category: EventCategory.ECONOMY,
    triggers: [{ type: 'RANDOM', probability: 0.1 }],
    effects: [
      { stat: 'resources', type: 'ADD', value: 20 },
      { stat: 'gdp', type: 'ADD', value: 10 },
    ],
    duration: 0,
  },
  // MILITARY EVENTS
  {
    id: 'border-conflict',
    name: '국경 분쟁',
    category: EventCategory.MILITARY,
    triggers: [{ type: 'STAT_THRESHOLD', stat: 'military', operator: 'LT', value: 25 }],
    effects: [
      { stat: 'military', type: 'ADD', value: -5 },
      { stat: 'diplomacy', type: 'ADD', value: -10 },
      { stat: 'happiness', type: 'ADD', value: -5 },
    ],
    duration: 2,
  },
  {
    id: 'military-coup-attempt',
    name: '쿠데타 시도',
    category: EventCategory.MILITARY,
    triggers: [
      { type: 'STAT_THRESHOLD', stat: 'happiness', operator: 'LT', value: 20 },
      { type: 'STAT_THRESHOLD', stat: 'military', operator: 'GTE', value: 50 },
    ],
    effects: [
      { stat: 'happiness', type: 'ADD', value: -15 },
      { stat: 'diplomacy', type: 'ADD', value: -10 },
    ],
    duration: 1,
  },
  {
    id: 'arms-deal',
    name: '무기 거래 성사',
    category: EventCategory.MILITARY,
    triggers: [
      { type: 'STAT_THRESHOLD', stat: 'military', operator: 'GTE', value: 40 },
      { type: 'STAT_THRESHOLD', stat: 'diplomacy', operator: 'GTE', value: 40 },
    ],
    effects: [
      { stat: 'gdp', type: 'ADD', value: 15 },
      { stat: 'military', type: 'ADD', value: 5 },
    ],
    duration: 0,
  },
  {
    id: 'terrorist-attack',
    name: '테러 공격',
    category: EventCategory.MILITARY,
    triggers: [{ type: 'RANDOM', probability: 0.05 }],
    effects: [
      { stat: 'happiness', type: 'ADD', value: -20 },
      { stat: 'gdp', type: 'ADD', value: -10 },
    ],
    duration: 1,
  },
  // TECH EVENTS
  {
    id: 'tech-breakthrough',
    name: '기술 혁신',
    category: EventCategory.TECH,
    triggers: [{ type: 'STAT_THRESHOLD', stat: 'research', operator: 'GTE', value: 60 }],
    effects: [
      { stat: 'techLevel', type: 'ADD', value: 10 },
      { stat: 'gdp', type: 'ADD', value: 10 },
    ],
    duration: 0,
  },
  {
    id: 'brain-drain',
    name: '인재 유출',
    category: EventCategory.TECH,
    triggers: [
      { type: 'STAT_THRESHOLD', stat: 'happiness', operator: 'LT', value: 30 },
      { type: 'STAT_THRESHOLD', stat: 'research', operator: 'GTE', value: 40 },
    ],
    effects: [
      { stat: 'research', type: 'ADD', value: -10 },
      { stat: 'techLevel', type: 'ADD', value: -5 },
    ],
    duration: 2,
  },
  {
    id: 'startup-boom',
    name: '스타트업 붐',
    category: EventCategory.TECH,
    triggers: [
      { type: 'STAT_THRESHOLD', stat: 'techLevel', operator: 'GTE', value: 45 },
      { type: 'RANDOM', probability: 0.2 },
    ],
    effects: [
      { stat: 'gdp', type: 'ADD', value: 15 },
      { stat: 'industry', type: 'ADD', value: 5 },
    ],
    duration: 0,
  },
  {
    id: 'cyber-attack',
    name: '사이버 공격',
    category: EventCategory.TECH,
    triggers: [
      { type: 'STAT_THRESHOLD', stat: 'techLevel', operator: 'GTE', value: 30 },
      { type: 'RANDOM', probability: 0.1 },
    ],
    effects: [
      { stat: 'gdp', type: 'ADD', value: -10 },
      { stat: 'techLevel', type: 'ADD', value: -3 },
    ],
    duration: 1,
  },
  // SOCIAL EVENTS
  {
    id: 'pandemic',
    name: '전염병 발생',
    category: EventCategory.SOCIAL,
    triggers: [{ type: 'RANDOM', probability: 0.05 }],
    effects: [
      { stat: 'population', type: 'ADD', value: -5 },
      { stat: 'happiness', type: 'ADD', value: -15 },
      { stat: 'gdp', type: 'ADD', value: -20 },
    ],
    duration: 3,
  },
  {
    id: 'baby-boom',
    name: '베이비붐',
    category: EventCategory.SOCIAL,
    triggers: [{ type: 'STAT_THRESHOLD', stat: 'happiness', operator: 'GTE', value: 70 }],
    effects: [
      { stat: 'population', type: 'ADD', value: 8 },
      { stat: 'happiness', type: 'ADD', value: 3 },
    ],
    duration: 0,
  },
  {
    id: 'civil-unrest',
    name: '시민 불안',
    category: EventCategory.SOCIAL,
    triggers: [{ type: 'STAT_THRESHOLD', stat: 'happiness', operator: 'LT', value: 25 }],
    effects: [
      { stat: 'happiness', type: 'ADD', value: -10 },
      { stat: 'gdp', type: 'ADD', value: -5 },
      { stat: 'diplomacy', type: 'ADD', value: -5 },
    ],
    duration: 2,
  },
  {
    id: 'cultural-renaissance',
    name: '문화 르네상스',
    category: EventCategory.SOCIAL,
    triggers: [
      { type: 'STAT_THRESHOLD', stat: 'happiness', operator: 'GTE', value: 60 },
      { type: 'STAT_THRESHOLD', stat: 'techLevel', operator: 'GTE', value: 40 },
    ],
    effects: [
      { stat: 'happiness', type: 'ADD', value: 10 },
      { stat: 'diplomacy', type: 'ADD', value: 8 },
    ],
    duration: 0,
  },
  // DIPLOMACY EVENTS
  {
    id: 'international-sanctions',
    name: '국제 제재',
    category: EventCategory.DIPLOMACY,
    triggers: [{ type: 'STAT_THRESHOLD', stat: 'diplomacy', operator: 'LT', value: 20 }],
    effects: [
      { stat: 'gdp', type: 'ADD', value: -25 },
      { stat: 'diplomacy', type: 'ADD', value: -5 },
    ],
    duration: 3,
  },
  {
    id: 'alliance-formed',
    name: '동맹 체결',
    category: EventCategory.DIPLOMACY,
    triggers: [{ type: 'STAT_THRESHOLD', stat: 'diplomacy', operator: 'GTE', value: 60 }],
    effects: [
      { stat: 'military', type: 'ADD', value: 10 },
      { stat: 'diplomacy', type: 'ADD', value: 5 },
      { stat: 'gdp', type: 'ADD', value: 10 },
    ],
    duration: 0,
  },
  {
    id: 'diplomatic-incident',
    name: '외교 마찰',
    category: EventCategory.DIPLOMACY,
    triggers: [{ type: 'RANDOM', probability: 0.1 }],
    effects: [
      { stat: 'diplomacy', type: 'ADD', value: -8 },
      { stat: 'gdp', type: 'ADD', value: -5 },
    ],
    duration: 1,
  },
  {
    id: 'summit-success',
    name: '정상 회담 성공',
    category: EventCategory.DIPLOMACY,
    triggers: [
      { type: 'STAT_THRESHOLD', stat: 'diplomacy', operator: 'GTE', value: 50 },
      { type: 'RANDOM', probability: 0.15 },
    ],
    effects: [
      { stat: 'diplomacy', type: 'ADD', value: 12 },
      { stat: 'happiness', type: 'ADD', value: 5 },
      { stat: 'gdp', type: 'ADD', value: 5 },
    ],
    duration: 0,
  },
];

// ==================== INITIAL SEASON ====================

const initialSeason = {
  id: 'season-1',
  name: 'S1',
  number: 1,
  startDate: new Date(),
  endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
  status: SeasonStatus.ACTIVE,
  scoreWeights: {
    gdp: 0.25,
    happiness: 0.20,
    techLevel: 0.20,
    military: 0.15,
    diplomacy: 0.10,
    survival: 0.10,
  },
  specialRules: Prisma.DbNull,
};

// ==================== SEED FUNCTION ====================

async function main() {
  console.log('🌱 Starting seed...');

  // Seed Nation Templates
  console.log('📍 Seeding NationTemplates...');
  for (const template of nationTemplates) {
    await prisma.nationTemplate.upsert({
      where: { id: template.id },
      update: template,
      create: template,
    });
  }
  console.log(`✅ Created ${nationTemplates.length} NationTemplates`);

  // Seed Policy Cards
  console.log('📍 Seeding PolicyCards...');
  for (const card of policyCards) {
    await prisma.policyCard.upsert({
      where: { id: card.id },
      update: card,
      create: card,
    });
  }
  console.log(`✅ Created ${policyCards.length} PolicyCards`);

  // Seed Event Definitions
  console.log('📍 Seeding EventDefinitions...');
  for (const event of eventDefinitions) {
    await prisma.eventDefinition.upsert({
      where: { id: event.id },
      update: event,
      create: event,
    });
  }
  console.log(`✅ Created ${eventDefinitions.length} EventDefinitions`);

  // Seed Initial Season
  console.log('📍 Seeding Season...');
  await prisma.season.upsert({
    where: { id: initialSeason.id },
    update: initialSeason,
    create: initialSeason,
  });
  console.log('✅ Created Season 1');

  console.log('🎉 Seed completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
