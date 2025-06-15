"use client";

import React from 'react';
import Image from 'next/image';
import { signIn } from 'next-auth/react';
import type { User, UserInfoCardProps, LoadingSpinnerProps, ErrorMessageProps, MonthSelectorProps } from '@/lib/types';

export const UserInfoCard: React.FC<UserInfoCardProps> = ({ user }) => (
  <div className="mb-6 bg-blue-50 p-4 rounded-lg">
    <h3 className="text-sm font-medium text-blue-600 mb-2">ข้อมูลผู้ใช้</h3>
    <div className="flex items-center gap-3">
      {user.image && (
        <Image 
          src={user.image} 
          alt="Profile" 
          width={40}
          height={40}
          className="w-10 h-10 rounded-full"
        />
      )}
      <div>
        <p className="text-sm font-medium text-gray-900">{user.name}</p>
        <p className="text-xs text-gray-500">ID: {user.id}</p>
      </div>
    </div>
  </div>
);

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  message = "กำลังโหลดข้อมูล..." 
}) => (
  <div className="text-center py-8">
    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    <p className="mt-2 text-gray-600">{message}</p>
  </div>
);

export const AuthLoadingScreen: React.FC = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="text-center">
      <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      <p className="mt-4 text-gray-600">กำลังตรวจสอบการเข้าสู่ระบบ...</p>
    </div>
  </div>
);

export const LoginPrompt: React.FC = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="bg-white rounded-lg shadow-md p-8 max-w-md mx-4">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">รายงานการเข้างานรายเดือน</h1>
        <p className="text-gray-600 mb-6">กรุณาเข้าสู่ระบบเพื่อดูรายงานการเข้างาน</p>
        <button
          onClick={() => signIn()}
          className="flex w-full items-center justify-center gap-4 rounded-md bg-[#06C755] px-4 py-3 text-center text-white transition duration-300 ease-in-out hover:bg-[#06C755] hover:bg-opacity-90"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            x="0px"
            y="0px"
            width="24"
            height="24"
            viewBox="0 0 48 48"
          >
            <path
              fill="#fff"
              d="M37.113,22.417c0-5.865-5.88-10.637-13.107-10.637s-13.108,4.772-13.108,10.637c0,5.258,4.663,9.662,10.962,10.495c0.427,0.092,1.008,0.282,1.155,0.646c0.132,0.331,0.086,0.85,0.042,1.185c0,0-0.153,0.925-0.187,1.122c-0.057,0.331-0.263,1.296,1.135,0.707c1.399-0.589,7.548-4.445,10.298-7.611h-0.001C36.203,26.879,37.113,24.764,37.113,22.417z M18.875,25.907h-2.604c-0.379,0-0.687-0.308-0.687-0.688V20.01c0-0.379,0.308-0.687,0.687-0.687c0.379,0,0.687,0.308,0.687,0.687v4.521h1.917c0.379,0,0.687,0.308,0.687,0.687C19.562,25.598,19.254,25.907,18.875,25.907z M21.568,25.219c0,0.379-0.308,0.688-0.687,0.688s-0.687-0.308-0.687-0.688V20.01c0-0.379,0.308-0.687,0.687-0.687s0.687,0.308,0.687,0.687V25.219z M27.838,25.219c0,0.297-0.188,0.559-0.47,0.652c-0.071,0.024-0.145,0.036-0.218,0.036c-0.215,0-0.42-0.103-0.549-0.275l-2.669-3.635v3.222c0,0.379-0.308,0.688-0.688,0.688c-0.379,0-0.688-0.308-0.688-0.688V20.01c0-0.296,0.189-0.558,0.47-0.652c0.071-0.024,0.144-0.035,0.218-0.035c0.214,0,0.42,0.103,0.549,0.275l2.67,3.635V20.01c0-0.379,0.309-0.687,0.688-0.687c0.379,0,0.687,0.308,0.687,0.687V25.219z M32.052,21.927c0.379,0,0.688,0.308,0.688,0.688c0,0.379-0.308,0.687-0.688,0.687h-1.917v1.23h1.917c0.379,0,0.688,0.308,0.688,0.687c0,0.379-0.309,0.688-0.688,0.688h-2.604c-0.378,0-0.687-0.308-0.687-0.688v-2.603c0-0.001,0-0.001,0-0.001c0,0,0-0.001,0-0.001v-2.601c0-0.001,0-0.001,0-0.002c0-0.379,0.308-0.687,0.687-0.687h2.604c0.379,0,0.688,0.308,0.688,0.687s-0.308,0.687-0.688,0.687h-1.917v1.23H32.052z"
            ></path>
          </svg>
          <span className="font-bold">เข้าสู่ระบบด้วย LINE</span>
        </button>
      </div>
    </div>
  </div>
);

export const ErrorMessage: React.FC<ErrorMessageProps> = ({ message }) => (
  <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
    {message}
  </div>
);

export const MonthSelector: React.FC<MonthSelectorProps> = ({ selectedMonth, onMonthChange }) => (
  <div className="mb-6">
    <label htmlFor="month-select" className="block text-sm font-medium text-gray-700 mb-2">
      เลือกเดือน
    </label>
    <input
      id="month-select"
      type="month"
      value={selectedMonth}
      onChange={(e) => onMonthChange(e.target.value)}
      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
    />
  </div>
);
