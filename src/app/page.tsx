import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import Link from 'next/link';

export default async function Home() {
  const session = await getServerSession(authOptions);

  // Redirect logged in users to dashboard
  if (session) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Hero Section */}
      <div className="max-w-6xl mx-auto px-4 py-20">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            🌍 World Sim
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            국가를 운영하고, 전략을 세우고, 세계 최고의 리더가 되세요.
            <br />
            비동기 시즌제 국가 대항 시뮬레이션 게임
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/login"
              className="bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              게임 시작하기
            </Link>
            <a
              href="#features"
              className="border border-gray-300 px-8 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              더 알아보기
            </a>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div id="features" className="max-w-6xl mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">게임 특징</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <div className="text-3xl mb-4">🏭</div>
            <h3 className="text-xl font-semibold mb-2">국가 운영</h3>
            <p className="text-gray-600">
              경제, 군사, 기술, 외교 등 다양한 분야를 관리하며 국가를 성장시키세요.
            </p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <div className="text-3xl mb-4">📊</div>
            <h3 className="text-xl font-semibold mb-2">전략적 의사결정</h3>
            <p className="text-gray-600">
              예산 배분과 정책 선택으로 국가의 미래를 결정하세요.
            </p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <div className="text-3xl mb-4">🏆</div>
            <h3 className="text-xl font-semibold mb-2">시즌 경쟁</h3>
            <p className="text-gray-600">
              시즌마다 다른 플레이어들과 경쟁하고 리더보드 상위권에 도전하세요.
            </p>
          </div>
        </div>
      </div>

      {/* How to Play Section */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">게임 방법</h2>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="font-semibold mb-2">국가 선택</h3>
              <p className="text-sm text-gray-600">
                시작 국가와 발전 노선을 선택합니다.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="font-semibold mb-2">매일 결정</h3>
              <p className="text-sm text-gray-600">
                예산을 배분하고 정책을 선택합니다.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="font-semibold mb-2">정산</h3>
              <p className="text-sm text-gray-600">
                매일 자정에 결정이 반영되고 점수가 계산됩니다.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                4
              </div>
              <h3 className="font-semibold mb-2">경쟁</h3>
              <p className="text-sm text-gray-600">
                시즌 종료 시 랭킹에 따라 순위가 결정됩니다.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="max-w-6xl mx-auto px-4 py-20 text-center">
        <h2 className="text-3xl font-bold mb-6">지금 바로 시작하세요</h2>
        <p className="text-gray-600 mb-8">무료로 플레이하고 최고의 리더가 되어보세요!</p>
        <Link
          href="/login"
          className="bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors inline-block"
        >
          무료로 시작하기
        </Link>
      </div>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="max-w-6xl mx-auto px-4 text-center text-gray-500 text-sm">
          © 2025 World Sim. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
