"use client";

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

export interface ChartThemeColors {
  background: string;
  text: string;
  grid: string;
  border: string;
}

export const useChartTheme = () => {
  const { theme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && (theme === 'dark' || (theme === 'system' && systemTheme === 'dark'));

  const chartColors: ChartThemeColors = {
    background: isDark ? 'rgba(31, 41, 55, 1)' : 'rgba(255, 255, 255, 1)', // gray-800 : white
    text: isDark ? 'rgba(243, 244, 246, 1)' : 'rgba(17, 24, 39, 1)', // gray-100 : gray-900
    grid: isDark ? 'rgba(75, 85, 99, 0.3)' : 'rgba(156, 163, 175, 0.3)', // gray-600 : gray-400
    border: isDark ? 'rgba(75, 85, 99, 1)' : 'rgba(229, 231, 235, 1)', // gray-600 : gray-200
  };

  const getChartOptions = (baseOptions: any = {}) => ({
    ...baseOptions,
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      ...baseOptions.plugins,
      legend: {
        ...baseOptions.plugins?.legend,
        labels: {
          ...baseOptions.plugins?.legend?.labels,
          color: chartColors.text,
          font: {
            family: 'Prompt, sans-serif',
            ...baseOptions.plugins?.legend?.labels?.font
          }
        }
      }
    },
    scales: {
      ...baseOptions.scales,
      x: {
        ...baseOptions.scales?.x,
        grid: {
          color: chartColors.grid,
          ...baseOptions.scales?.x?.grid
        },
        ticks: {
          color: chartColors.text,
          font: {
            family: 'Prompt, sans-serif'
          },
          ...baseOptions.scales?.x?.ticks
        }
      },
      y: {
        ...baseOptions.scales?.y,
        grid: {
          color: chartColors.grid,
          ...baseOptions.scales?.y?.grid
        },
        ticks: {
          color: chartColors.text,
          font: {
            family: 'Prompt, sans-serif'
          },
          ...baseOptions.scales?.y?.ticks
        }
      }
    }
  });

  const getDoughnutOptions = (baseOptions: any = {}) => ({
    ...baseOptions,
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      ...baseOptions.plugins,
      legend: {
        position: 'bottom' as const,
        labels: {
          color: chartColors.text,
          font: {
            family: 'Prompt, sans-serif'
          },
          padding: 20,
          ...baseOptions.plugins?.legend?.labels
        },
        ...baseOptions.plugins?.legend
      }
    }
  });

  return {
    isDark,
    mounted,
    chartColors,
    getChartOptions,
    getDoughnutOptions
  };
};
