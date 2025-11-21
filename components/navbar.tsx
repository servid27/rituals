"use client";

import { usePathname, useRouter } from "next/navigation";
import { Home, TrendingUp, Flame, User } from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();

  const isActive = (href: string) => pathname === href;

  return (
    <>
      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-nav-bg-light border-t border-gray-200 z-50">
        <div className="flex justify-around items-center h-24 px-4">
          <button
            onClick={() => router.push("/dashboard")}
            className="flex flex-col items-center justify-center flex-1 gap-1 transition-all duration-200"
          >
            <div
              className={`p-2 px-5 rounded-xl transition-all duration-200 ${
                isActive("/dashboard")
                  ? "bg-nav-icon-bg-home scale-110"
                  : "bg-transparent"
              }`}
            >
              <span
                className={`w-5 h-5  text-xl  transition-colors duration-200 ${
                  isActive("/dashboard")
                    ? "text-nav-icon-home"
                    : "text-gray-400"
                }`}
              >
              🫴
              </span>
            </div>
            <span
              className={`text-sm ${
                isActive("/dashboard") ? "text-nav-icon-home" : "text-gray-400"
              }`}
            >
              Home
            </span>
          </button>

          <button
            onClick={() => router.push("/rituals")}
            className="flex flex-col items-center justify-center flex-1 gap-1 transition-all duration-200"
          >
            <div
              className={`p-2 px-5 text-xl rounded-xl transition-all duration-200 ${
                isActive("/rituals")
                  ? "bg-nav-icon-bg-progress scale-110"
                  : "bg-transparent"
              }`}
            >
              <span
                className={`w-5 h-5 text-xl  transition-colors duration-200 ${
                  isActive("/rituals")
                    ? "text-nav-icon-progress"
                    : "text-gray-400"
                }`}
              >
                 🧘
              </span>
            </div>

            <span
              className={`text-sm ${
                isActive("/rituals")
                  ? "text-nav-icon-progress"
                  : "text-gray-400"
              }`}
            >
              Progress
            </span>
          </button>

          <button
            onClick={() => router.push("/streaks")}
            className="flex flex-col items-center justify-center flex-1 gap-1 transition-all duration-200"
          >
            <div
              className={`p-2 px-5 rounded-xl transition-all duration-200 ${
                isActive("/streaks")
                  ? "bg-nav-icon-bg-streaks scale-110"
                  : "bg-transparent"
              }`}
            >
              <span
                className={`w-5 h-5 text-xl transition-colors duration-200 ${
                  isActive("/streaks")
                    ? "text-nav-icon-progress"
                    : "text-gray-400"
                }`}
              >
                🔥
              </span>
            </div>
            <span
              className={`text-sm ${
                isActive("/streaks") ? "text-nav-icon-streaks" : "text-gray-400"
              }`}
            >
              Streaks
            </span>
          </button>

          <button
            onClick={() => router.push("/account")}
            className="flex flex-col items-center justify-center flex-1 gap-1 transition-all duration-200"
          >
            <div
              className={`p-2 px-5 rounded-xl transition-all duration-200 ${
                isActive("/account")
                  ? "bg-nav-icon-bg-profile scale-110"
                  : "bg-transparent"
              }`}
            >
              <span
                className={`w-5 h-5  text-xl transition-colors duration-200 ${
                  isActive("/account")
                    ? "text-nav-icon-profile"
                    : "text-gray-400"
                }`}
              >📇
              </span>
            </div>
            <span
              className={`text-sm ${
                isActive("/account") ? "text-nav-icon-profile" : "text-gray-400"
              }`}
            >
              Profile
            </span>
          </button>
        </div>
      </nav>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex fixed left-0 top-0 h-screen w-20 lg:w-64 bg-nav-bg-light border-r border-gray-200 flex-col py-6 z-50">
        <div className="px-4 mb-8">
          <h1 className="text-xl lg:text-2xl font-bold text-text-light lg:block hidden">
         RitualsQuest 
          </h1>
          <div className="lg:hidden flex justify-center">
            <span className="text-2xl">🚀</span>
          </div>
        </div>

        <nav className="flex-1 px-3 space-y-2">
          <button
            onClick={() => router.push("/dashboard")}
            className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 ${
              isActive("/dashboard")
                ? "bg-nav-icon-bg-home text-nav-icon-home"
                : "text-gray-600 hover:bg-blue-100"
            }`}
          >
            <Home className="w-5 h-5 flex-shrink-0" />
            <span className="font-medium lg:block hidden">Home</span>
          </button>

         <button
            onClick={() => router.push("/streaks")}
            className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 ${
              isActive("/streaks")
                ? "bg-red-200 text-red-900"
                : "text-gray-600 hover:bg-red-100"
            }`}
          >
            <Flame className="w-5 h-5 flex-shrink-0" />
            <span className="font-medium lg:block hidden">Streaks</span>
          </button>

          <button
            onClick={() => router.push("/rituals")}
            className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 ${
              isActive("/rituals")
                ? "bg-violet-200 color-main"
                : "text-gray-600 hover:bg-violet-100"
            }`}
          >
            <TrendingUp className="w-5 h-5 flex-shrink-0" />
            <span className="font-medium lg:block hidden">Rituals</span>
          </button>

        

          <button
            onClick={() => router.push("/account")}
            className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 ${
              isActive("/account")
                ? "bg-gray-200 text-gray-900"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <User className="w-5 h-5 flex-shrink-0" />
            <span className="font-medium lg:block hidden">Profile</span>
          </button>
        </nav>

        <div className="px-3 mt-auto">
          <div className="p-4 bg-gradient-to-br bg-main rounded-xl text-white font-medium hidden items-center gap-3 sm:flex">
            <div className="text-2xl font-bold border rounded-full  h-12 p-1 flex items-center justify-center leading-[100%] aspect-square">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                className="lucide lucide-plus-icon lucide-plus"
              >
                <path d="M5 12h14" />
                <path d="M12 5v14" />
              </svg>
            </div>
            <div>
              <p
                className="text-sm font-semibold text-white mb-1"
                onClick={() => router.push("/rituals?mode=new")}
              >
                New Ritual
              </p>
              <p className="text-xs text-white">Build a new habit</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
