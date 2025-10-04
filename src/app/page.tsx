"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Rings from "@/components/common/Rings";
import "@/styles/ring.css";

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Redirect back to original page after successful login
  useEffect(() => {
    if (session && status === "authenticated") {
      const returnUrl = sessionStorage.getItem("returnUrl");
      if (returnUrl) {
        sessionStorage.removeItem("returnUrl");
        router.push(returnUrl);
      }
    }
  }, [session, status, router]);

  return (
    <main
      id="page-home"
      className="relative flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-indigo-900 dark:to-purple-900"
    >
      <div
        id="container-main"
        className="container relative z-10 flex flex-col items-center justify-center gap-12 px-4 py-16"
      >
        <h1
          id="title-main"
          className="text-5xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-[5rem]"
        >
          Bun <span className="text-[#07b53b]">LINE</span>{" "}
          <span className="text-[hsl(280,100%,70%)] dark:text-purple-400">
            T3
          </span>{" "}
          App
        </h1>
        {!session ? (
          <button
            id="btn-login"
            onClick={() => signIn()}
            className="flex w-full max-w-[14rem] flex-row items-center justify-start gap-4 rounded-md bg-[#07b53b] px-4 py-1 text-center text-white transition duration-300 ease-in-out hover:bg-[#07b53b] hover:bg-opacity-90"
          >
            <svg
              id="icon-line-login"
              xmlns="http://www.w3.org/2000/svg"
              x="0px"
              y="0px"
              width="48"
              height="48"
              viewBox="0 0 48 48"
            >
              <path
                fill="#fff"
                d="M37.113,22.417c0-5.865-5.88-10.637-13.107-10.637s-13.108,4.772-13.108,10.637c0,5.258,4.663,9.662,10.962,10.495c0.427,0.092,1.008,0.282,1.155,0.646c0.132,0.331,0.086,0.85,0.042,1.185c0,0-0.153,0.925-0.187,1.122c-0.057,0.331-0.263,1.296,1.135,0.707c1.399-0.589,7.548-4.445,10.298-7.611h-0.001C36.203,26.879,37.113,24.764,37.113,22.417z M18.875,25.907h-2.604c-0.379,0-0.687-0.308-0.687-0.688V20.01c0-0.379,0.308-0.687,0.687-0.687c0.379,0,0.687,0.308,0.687,0.687v4.521h1.917c0.379,0,0.687,0.308,0.687,0.687C19.562,25.598,19.254,25.907,18.875,25.907z M21.568,25.219c0,0.379-0.308,0.688-0.687,0.688s-0.687-0.308-0.687-0.688V20.01c0-0.379,0.308-0.687,0.687-0.687s0.687,0.308,0.687,0.687V25.219z M27.838,25.219c0,0.297-0.188,0.559-0.47,0.652c-0.071,0.024-0.145,0.036-0.218,0.036c-0.215,0-0.42-0.103-0.549-0.275l-2.669-3.635v3.222c0,0.379-0.308,0.688-0.688,0.688c-0.379,0-0.688-0.308-0.688-0.688V20.01c0-0.296,0.189-0.558,0.47-0.652c0.071-0.024,0.144-0.035,0.218-0.035c0.214,0,0.42,0.103,0.549,0.275l2.67,3.635V20.01c0-0.379,0.309-0.687,0.688-0.687c0.379,0,0.687,0.308,0.687,0.687V25.219z M32.052,21.927c0.379,0,0.688,0.308,0.688,0.688c0,0.379-0.308,0.687-0.688,0.687h-1.917v1.23h1.917c0.379,0,0.688,0.308,0.688,0.687c0,0.379-0.309,0.688-0.688,0.688h-2.604c-0.378,0-0.687-0.308-0.687-0.688v-2.603c0-0.001,0-0.001,0-0.001c0,0,0-0.001,0-0.001v-2.601c0-0.001,0-0.001,0-0.002c0-0.379,0.308-0.687,0.687-0.687h2.604c0.379,0,0.688,0.308,0.688,0.687s-0.308,0.687-0.688,0.687h-1.917v1.23H32.052z"
              ></path>
            </svg>
            <span id="text-login" className="font-bold">
              Log in with LINE
            </span>
          </button>
        ) : (
          <>
            <div
              id="user-info-card"
              className="flex w-full max-w-md flex-col items-center gap-6 rounded-2xl bg-white/80 p-8 shadow-2xl backdrop-blur-sm dark:bg-gray-800/80"
            >
              <div id="profile-image-wrapper" className="relative">
                <div className="absolute -inset-2 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-75 blur-lg"></div>
                <Image
                  id="profile-image"
                  src={session?.user?.image || "/images/otter.svg"}
                  className="relative h-32 w-32 rounded-full border-4 border-white shadow-xl dark:border-gray-700"
                  width={128}
                  height={128}
                  alt="profile"
                />
              </div>
              <div
                id="user-details"
                className="flex flex-col items-center gap-2 text-center"
              >
                <h3
                  id="user-greeting"
                  className="text-sm font-medium text-gray-600 dark:text-gray-400"
                >
                  เข้าสู่ระบบด้วย
                </h3>
                <div
                  id="user-name"
                  className="text-2xl font-bold text-gray-900 dark:text-white"
                >
                  {session?.user?.name}
                </div>
              </div>
            </div>

            <div className="flex w-full max-w-xs flex-col gap-4">
              <Link
                id="btn-dashboard"
                href="/dashboard"
                className="group flex w-full flex-row items-center justify-center gap-3 rounded-lg bg-white px-6 py-4 text-center font-bold text-blue-600 shadow-lg transition-all duration-300 ease-in-out hover:scale-105 hover:bg-blue-50 hover:shadow-xl dark:bg-gray-800 dark:text-blue-400 dark:hover:bg-gray-700"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="transition-transform duration-300 group-hover:rotate-12"
                >
                  <rect x="3" y="3" width="7" height="7"></rect>
                  <rect x="14" y="3" width="7" height="7"></rect>
                  <rect x="14" y="14" width="7" height="7"></rect>
                  <rect x="3" y="14" width="7" height="7"></rect>
                </svg>
                <span className="text-lg">Dashboard</span>
              </Link>

              <button
                id="btn-logout"
                className="group flex w-full flex-row items-center justify-center gap-3 rounded-lg bg-white px-6 py-4 text-center font-bold text-purple-600 shadow-lg transition-all duration-300 ease-in-out hover:scale-105 hover:bg-purple-50 hover:shadow-xl dark:bg-gray-800 dark:text-purple-400 dark:hover:bg-gray-700"
                onClick={() => signOut()}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="transition-transform duration-300 group-hover:translate-x-1"
                >
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                  <polyline points="16 17 21 12 16 7"></polyline>
                  <line x1="21" y1="12" x2="9" y2="12"></line>
                </svg>
                <span className="text-lg">Sign out</span>
              </button>
            </div>
          </>
        )}
      </div>

      <div className="absolute inset-0 z-0 flex items-center justify-center">
        <Rings id="rings-animation" count={15} />
      </div>
    </main>
  );
}
