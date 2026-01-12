export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="max-w-4xl w-full space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">
            欢迎来到 PBL Learning Platform
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            基于 Supabase + Next.js + AI 的学习平台
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="border rounded-lg p-6 hover:shadow-lg transition-shadow">
            <h2 className="text-2xl font-semibold mb-2">🔐 用户认证</h2>
            <p className="text-gray-600 dark:text-gray-400">
              使用 Supabase Auth 实现安全的用户登录和注册
            </p>
          </div>

          <div className="border rounded-lg p-6 hover:shadow-lg transition-shadow">
            <h2 className="text-2xl font-semibold mb-2">🤖 AI 对话</h2>
            <p className="text-gray-600 dark:text-gray-400">
              集成大模型 API，实现智能对话功能
            </p>
          </div>

          <div className="border rounded-lg p-6 hover:shadow-lg transition-shadow">
            <h2 className="text-2xl font-semibold mb-2">👤 用户信息</h2>
            <p className="text-gray-600 dark:text-gray-400">
              展示用户资料、学习进度和历史记录
            </p>
          </div>

          <div className="border rounded-lg p-6 hover:shadow-lg transition-shadow">
            <h2 className="text-2xl font-semibold mb-2">☁️ Serverless</h2>
            <p className="text-gray-600 dark:text-gray-400">
              部署在 Zeabur，零运维，按需扩展
            </p>
          </div>
        </div>

        <div className="text-center space-x-4">
          <a
            href="/login"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            开始使用
          </a>
          <a
            href="/dashboard"
            className="inline-block border border-gray-300 px-6 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            查看示例
          </a>
        </div>
      </div>
    </main>
  );
}
