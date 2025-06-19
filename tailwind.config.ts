import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: "class",
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/features/**/*.{js,ts,jsx,tsx,mdx}',
    './src/lib/**/*.{js,ts,jsx,tsx,mdx}',
    './src/hooks/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  prefix: "",
  theme: {
    extend: {
      // 🎨 Shadcn UI Color System
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },

        // 🌈 Modern Vibrant Color System สำหรับ Attendance Cards และ UI Components
        
        // Modern Ocean Blue - สีน้ำเงินมหาสมุทรสไตล์โมเดิร์น
        'ocean': {
          50: '#f0f9ff',   // เกือบขาว มีแง่น้ำเงินนิดๆ
          100: '#e0f2fe',  // ฟ้าอ่อนมาก
          200: '#bae6fd',  // ฟ้าสดใส
          300: '#7dd3fc',  // ฟ้าเด่น
          400: '#38bdf8',  // ฟ้าสดใส
          500: '#0ea5e9',  // น้ำเงินสดใส
          600: '#0284c7',  // น้ำเงินเข้ม
          700: '#0369a1',  // น้ำเงินเข้มมาก
          800: '#075985',  // น้ำเงินเข้มคล้ำ
          900: '#0c4a6e',  // น้ำเงินเข้มสุด
          950: '#082f49',  // น้ำเงินดำ
        },
        
        // Modern Rose - สีกุหลาบโมเดิร์น สีแดงชมพูเทรนด์
        'rose': {
          50: '#fdf2f8',   // ชมพูอ่อนมาก
          100: '#fce7f3',  // ชมพูอ่อน
          200: '#fbcfe8',  // ชมพูสดใส
          300: '#f9a8d4',  // ชมพูสดใส
          400: '#f472b6',  // ชมพูเด่น
          500: '#ec4899',  // ชมพูแดง
          600: '#db2777',  // แดงชมพู
          700: '#be185d',  // แดงเข้ม
          800: '#9d174d',  // แดงเข้มมาก
          900: '#831843',  // แดงเข้มคล้ำ
          950: '#500724',  // แดงดำ
        },
        
        // Modern Indigo - สีคราม trendy โมเดิร์น
        'indigo': {
          50: '#eef2ff',   // คราม อ่อนมาก  
          100: '#e0e7ff',  // คราม อ่อน
          200: '#c7d2fe',  // คราม สดใส
          300: '#a5b4fc',  // คราม เด่น
          400: '#818cf8',  // คราม สด
          500: '#6366f1',  // คราม หลัก
          600: '#4f46e5',  // คราม เข้ม
          700: '#4338ca',  // คราม เข้มมาก
          800: '#3730a3',  // คราม เข้มคล้ำ
          900: '#312e81',  // คราม เข้มสุด
          950: '#1e1b4b',  // คราม ดำ
        },
        
        // Modern Emerald - สีมรกตโมเดิร์น
        'emerald': {
          50: '#ecfdf5',   // เขียวอ่อนมาก
          100: '#d1fae5',  // เขียวอ่อน
          200: '#a7f3d0',  // เขียวสดใส
          300: '#6ee7b7',  // เขียวเด่น
          400: '#34d399',  // เขียวสด
          500: '#10b981',  // เขียวมรกต
          600: '#059669',  // เขียวเข้ม
          700: '#047857',  // เขียวเข้มมาก
          800: '#065f46',  // เขียวเข้มคล้ำ
          900: '#064e3b',  // เขียวเข้มสุด
          950: '#022c22',  // เขียวดำ
        },
        
        // Modern Amber - สีเหลืองทองโมเดิร์น
        'amber': {
          50: '#fffbeb',   // เหลืองอ่อนมาก
          100: '#fef3c7',  // เหลืองอ่อน
          200: '#fde68a',  // เหลืองสดใส
          300: '#fcd34d',  // เหลืองเด่น
          400: '#fbbf24',  // เหลืองทอง
          500: '#f59e0b',  // เหลืองทองเข้ม
          600: '#d97706',  // ส้มเหลือง
          700: '#b45309',  // ส้มเข้ม
          800: '#92400e',  // ส้มเข้มมาก
          900: '#78350f',  // ส้มเข้มคล้ำ
          950: '#451a03',  // ส้มดำ
        },
        
        // Modern Violet - สีม่วงโมเดิร์น เทรนด์ใหม่
        'violet': {
          50: '#f5f3ff',   // ม่วงอ่อนมาก
          100: '#ede9fe',  // ม่วงอ่อน
          200: '#ddd6fe',  // ม่วงสดใส
          300: '#c4b5fd',  // ม่วงเด่น
          400: '#a78bfa',  // ม่วงสด
          500: '#8b5cf6',  // ม่วงหลัก
          600: '#7c3aed',  // ม่วงเข้ม
          700: '#6d28d9',  // ม่วงเข้มมาก
          800: '#5b21b6',  // ม่วงเข้มคล้ำ
          900: '#4c1d95',  // ม่วงเข้มสุด
          950: '#2e1065',  // ม่วงดำ
        },
        
        // Modern Teal - สีเขียวมรกตอมฟ้า โมเดิร์น
        'teal': {
          50: '#f0fdfa',   // เขียวฟ้าอ่อนมาก
          100: '#ccfbf1',  // เขียวฟ้าอ่อน
          200: '#99f6e4',  // เขียวฟ้าสดใส
          300: '#5eead4',  // เขียวฟ้าเด่น
          400: '#2dd4bf',  // เขียวฟ้าสด
          500: '#14b8a6',  // เขียวฟ้าหลัก
          600: '#0d9488',  // เขียวฟ้าเข้ม
          700: '#0f766e',  // เขียวฟ้าเข้มมาก
          800: '#115e59',  // เขียวฟ้าเข้มคล้ำ
          900: '#134e4a',  // เขียวฟ้าเข้มสุด
          950: '#042f2e',  // เขียวฟ้าดำ
        },

        // 🎨 Modern Background & Surface Colors
        'bg-modern': {
          light: '#fefefe',         // Pure white สำหรับ light mode
          dark: '#0f0f23',          // Deep navy สำหรับ dark mode
          'light-alt': '#f8fafc',   // Light gray พื้นหลังแสดงเนื้อหา
          'dark-alt': '#1e1b4b',    // Dark indigo สำหรับ dark mode surfaces
        },
        
        // 🔲 Modern Surface Colors (Cards, Modals)
        'surface-modern': {
          light: '#ffffff',         // Pure white สำหรับ cards
          dark: '#312e81',          // Dark indigo สำหรับ dark cards
          'light-alt': '#f1f5f9',   // Very light gray
          'dark-alt': '#4338ca',    // Medium indigo
        },
        
        // 📝 Modern Text Colors (Enhanced Ultra High Contrast)
        'text-modern': {
          'light-primary': '#080814',    // Ultra dark navy (เข้มสุด 40% มากกว่าเดิม)
          'light-secondary': '#0f172a',  // Ultra dark slate (เข้มสุด 35% มากกว่าเดิม)
          'light-muted': '#1e293b',      // Dark slate (เข้มสุด 30% มากกว่าเดิม)
          'light-extra': '#000000',      // Pure black สำหรับหัวข้อสำคัญ
          'dark-primary': '#ffffff',     // Pure white text สำหรับ dark mode
          'dark-secondary': '#f1f5f9',   // Ultra light gray text
          'dark-muted': '#e2e8f0',       // Light gray text
          'dark-extra': '#f8fafc',       // Ultra light text สำหรับเน้น
        },
        
        // 🔳 Modern Border Colors
        'border-modern': {
          'light-primary': '#e2e8f0',    // Light border
          'light-secondary': '#cbd5e1',  // Medium light border
          'dark-primary': '#475569',     // Dark border
          'dark-secondary': '#64748b',   // Lighter dark border
        },
        
        // 📖 Book Theme Colors - สีสำหรับ Reading Experience
        
        // Book Background Colors
        'bg-book': {
          'paper': '#fefcf7',           // สีกระดาษหนังสือ
          'cream': '#fef9f0',           // สีครีมอบอุ่น
          'vintage': '#fdf4e7',         // สีวินเทจ
          'sepia': '#fbf7f0',           // สีซีเปีย
          'aged': '#f5f0e8',            // สีกระดาษเก่า
        },
        
        // Book Surface Colors
        'surface-book': {
          'light': '#fefcf7',           // กระดาษขาว
          'warm': '#fef9f0',            // กระดาษอบอุ่น
          'vintage': '#fae6ca',         // กระดาษวินเทจ
          'aged': '#ede1d1',            // กระดาษเก่า
        },
        
        // Book Text Colors (Ultra Enhanced Contrast)
        'text-book': {
          'primary': '#000000',         // Pure black หมึกดำสนิท (เข้มสุด)
          'secondary': '#0a0a0a',       // Near black หมึกเข้มมาก (เข้มสุด 60% มากกว่าเดิม)
          'muted': '#1a1a1a',           // Very dark gray (เข้มสุด 40% มากกว่าเดิม)
          'extra': '#050505',           // Ultra black สำหรับหัวข้อสำคัญ
          'vintage': '#2c1810',         // Dark brown vintage
          'sepia': '#3d2914',           // Dark sepia tone
          'leather': '#2d1f15',         // หมึกน้ำตาลเข้ม
        },
        
        // 🔤 Extra Dark Text Colors สำหรับ High Contrast
        'text-dark': {
          'primary': '#000000',         // ดำสนิท สำหรับข้อความสำคัญ
          'secondary': '#0a0a0a',       // ดำเกือบสนิท
          'strong': '#1a1a1a',          // เทาดำเข้ม
          'medium': '#262626',          // เทาดำปานกลาง
          'soft': '#404040',            // เทาดำอ่อน
        },
        
        // 📊 Card Text Colors - สำหรับข้อความในการ์ด
        'text-card': {
          'primary': '#000000',         // ดำสนิทสำหรับตัวเลขใหญ่
          'secondary': '#1a1a1a',       // ดำเข้มสำหรับหัวข้อ
          'muted': '#2d2d2d',           // เทาเข้มสำหรับรายละเอียด
          'on-light': '#000000',        // ข้อความบนพื้นหลังสว่าง
          'on-gradient': '#ffffff',     // ข้อความบน gradient (ขาว)
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      // 🎨 Font Families - Prompt Font สำหรับทั้ง Project
      fontFamily: {
        prompt: ['Prompt', 'sans-serif'],
        sans: ['Prompt', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      // 🔤 Font Weights - รองรับทุก weight ของ Prompt
      fontWeight: {
        thin: '100',
        extralight: '200',
        light: '300',
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
        extrabold: '800',
        black: '900',
      },
      // 🎯 Custom utilities และ theme extensions ที่มีอยู่แล้ว
      animation: {
        'ring-rotate': 'ring-rotate 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite',
        'gradient-x': 'gradient-x 3s ease infinite',
        'gradient-y': 'gradient-y 3s ease infinite',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        'ring-rotate': {
          '0%': {
            transform: 'rotate(0deg)',
          },
          '100%': {
            transform: 'rotate(360deg)',
          },
        },
        'gradient-x': {
          '0%, 100%': {
            'background-size': '200% 200%',
            'background-position': 'left center'
          },
          '50%': {
            'background-size': '200% 200%',
            'background-position': 'right center'
          },
        },
        'gradient-y': {
          '0%, 100%': {
            'background-size': '200% 200%',
            'background-position': 'center top'
          },
          '50%': {
            'background-size': '200% 200%',
            'background-position': 'center bottom'
          },
        },
        'pulse-glow': {
          '0%, 100%': {
            opacity: '1',
            transform: 'scale(1)'
          },
          '50%': {
            opacity: '0.8',
            transform: 'scale(1.05)'
          },
        },
        'float': {
          '0%, 100%': {
            transform: 'translateY(0px)',
          },
          '50%': {
            transform: 'translateY(-10px)',
          },
        },
      },
      
      // 🌈 Modern Gradient Collection
      backgroundImage: {
        // Primary gradients - สำหรับ main cards
        'gradient-ocean': 'linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)', // Ocean to Indigo
        'gradient-rose': 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)', // Rose to Violet
        'gradient-emerald': 'linear-gradient(135deg, #10b981 0%, #14b8a6 100%)', // Emerald to Teal
        'gradient-amber': 'linear-gradient(135deg, #f59e0b 0%, #ec4899 100%)', // Amber to Rose
        'gradient-indigo': 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', // Indigo to Violet
        
        // Secondary gradients - สำหรับ accent elements
        'gradient-sky': 'linear-gradient(135deg, #38bdf8 0%, #7dd3fc 100%)', // Light Ocean
        'gradient-mint': 'linear-gradient(135deg, #2dd4bf 0%, #5eead4 100%)', // Light Teal
        'gradient-sunset': 'linear-gradient(135deg, #fbbf24 0%, #f472b6 100%)', // Amber to Rose
        'gradient-dawn': 'linear-gradient(135deg, #a78bfa 0%, #c4b5fd 100%)', // Light Violet
        
        // Background gradients - สำหรับ page backgrounds
        'gradient-bg-light': 'linear-gradient(135deg, #f8fafc 0%, #f0f9ff 100%)', // Very subtle light
        'gradient-bg-dark': 'linear-gradient(135deg, #0f0f23 0%, #1e1b4b 100%)', // Dark navy to indigo
        
        // Hover effects
        'gradient-hover-ocean': 'linear-gradient(135deg, #0284c7 0%, #4f46e5 100%)', // Darker ocean
        'gradient-hover-rose': 'linear-gradient(135deg, #db2777 0%, #7c3aed 100%)', // Darker rose
        'gradient-hover-emerald': 'linear-gradient(135deg, #059669 0%, #0d9488 100%)', // Darker emerald
        
        // Card gradients for specific stats
        'gradient-attendance': 'linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)', // Ocean gradient
        'gradient-hours': 'linear-gradient(135deg, #10b981 0%, #14b8a6 100%)', // Emerald gradient  
        'gradient-overtime': 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)', // Rose gradient
        'gradient-efficiency': 'linear-gradient(135deg, #f59e0b 0%, #ec4899 100%)', // Amber gradient
        'gradient-late': 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', // Indigo gradient
        
        // 📚 Book Theme Gradients - สำหรับ Reading Experience
        'gradient-book-paper': 'linear-gradient(135deg, #fefcf7 0%, #fef9f0 100%)', // กระดาษขาวอบอุ่น
        'gradient-book-cream': 'linear-gradient(135deg, #fef9f0 0%, #fdf4e7 100%)', // ครีมอบอุ่น
        'gradient-book-vintage': 'linear-gradient(135deg, #fdf4e7 0%, #fae6ca 100%)', // วินเทจ
        'gradient-book-sepia': 'linear-gradient(135deg, #fbf7f0 0%, #f6ede0 100%)', // ซีเปีย
        'gradient-book-aged': 'linear-gradient(135deg, #f5f0e8 0%, #ede1d1 100%)', // กระดาษเก่า
        'gradient-book-leather': 'linear-gradient(135deg, #e3cfb7 0%, #d6b896 100%)', // หนังปก
        
        // Book Card Gradients
        'gradient-book-warm': 'linear-gradient(135deg, #f7c094 0%, #e2a857 100%)', // อบอุ่น
        'gradient-book-classic': 'linear-gradient(135deg, #c59d6f 0%, #b08654 100%)', // คลาสสิก
        'gradient-book-antique': 'linear-gradient(135deg, #d8b596 0%, #c79b76 100%)', // โบราณ
      },

      // 📐 Modern Box Shadow System
      boxShadow: {
        // Subtle shadows
        'modern-xs': '0 1px 2px 0 rgba(99, 102, 241, 0.05)',
        'modern-sm': '0 1px 3px 0 rgba(99, 102, 241, 0.1), 0 1px 2px 0 rgba(99, 102, 241, 0.06)',
        'modern': '0 4px 6px -1px rgba(99, 102, 241, 0.1), 0 2px 4px -1px rgba(99, 102, 241, 0.06)',
        'modern-md': '0 10px 15px -3px rgba(99, 102, 241, 0.1), 0 4px 6px -2px rgba(99, 102, 241, 0.05)',
        'modern-lg': '0 20px 25px -5px rgba(99, 102, 241, 0.1), 0 10px 10px -5px rgba(99, 102, 241, 0.04)',
        'modern-xl': '0 25px 50px -12px rgba(99, 102, 241, 0.25)',
        
        // Colored shadows for specific elements
        'ocean-glow': '0 4px 14px 0 rgba(14, 165, 233, 0.15), 0 2px 4px 0 rgba(99, 102, 241, 0.1)',
        'rose-glow': '0 4px 14px 0 rgba(236, 72, 153, 0.15), 0 2px 4px 0 rgba(139, 92, 246, 0.1)',
        'emerald-glow': '0 4px 14px 0 rgba(16, 185, 129, 0.15), 0 2px 4px 0 rgba(20, 184, 166, 0.1)',
        'amber-glow': '0 4px 14px 0 rgba(245, 158, 11, 0.15), 0 2px 4px 0 rgba(236, 72, 153, 0.1)',
        'violet-glow': '0 4px 14px 0 rgba(139, 92, 246, 0.15), 0 2px 4px 0 rgba(99, 102, 241, 0.1)',
        
        // Interactive shadows - hover states
        'ocean-hover': '0 8px 20px 0 rgba(14, 165, 233, 0.2), 0 4px 8px 0 rgba(99, 102, 241, 0.15)',
        'rose-hover': '0 8px 20px 0 rgba(236, 72, 153, 0.2), 0 4px 8px 0 rgba(139, 92, 246, 0.15)',
        'emerald-hover': '0 8px 20px 0 rgba(16, 185, 129, 0.2), 0 4px 8px 0 rgba(20, 184, 166, 0.15)',
        
        // Card-specific shadows
        'card-modern': '0 4px 6px -1px rgba(30, 27, 75, 0.08), 0 2px 4px -1px rgba(30, 27, 75, 0.04)',
        'card-hover': '0 10px 15px -3px rgba(30, 27, 75, 0.1), 0 4px 6px -2px rgba(30, 27, 75, 0.06)',
        
        // 📚 Book Theme Shadows - เงาสำหรับ Reading Experience
        'book-sm': '0 1px 3px 0 rgba(84, 64, 47, 0.1), 0 1px 2px 0 rgba(84, 64, 47, 0.06)',
        'book': '0 4px 6px -1px rgba(84, 64, 47, 0.1), 0 2px 4px -1px rgba(84, 64, 47, 0.06)',
        'book-md': '0 10px 15px -3px rgba(84, 64, 47, 0.1), 0 4px 6px -2px rgba(84, 64, 47, 0.05)',
        'book-lg': '0 20px 25px -5px rgba(84, 64, 47, 0.15), 0 10px 10px -5px rgba(84, 64, 47, 0.04)',
        
        // Book colored shadows
        'paper-glow': '0 4px 14px 0 rgba(247, 192, 148, 0.15), 0 2px 4px 0 rgba(226, 168, 87, 0.1)',
        'leather-glow': '0 4px 14px 0 rgba(197, 157, 111, 0.15), 0 2px 4px 0 rgba(176, 134, 84, 0.1)',
        'vintage-glow': '0 4px 14px 0 rgba(216, 181, 150, 0.15), 0 2px 4px 0 rgba(199, 155, 118, 0.1)',
        'sepia-glow': '0 4px 14px 0 rgba(239, 223, 204, 0.15), 0 2px 4px 0 rgba(229, 204, 179, 0.1)',
        
        // Book hover shadows
        'book-hover': '0 8px 20px 0 rgba(84, 64, 47, 0.2), 0 4px 8px 0 rgba(74, 51, 34, 0.15)',
        'paper-hover': '0 8px 20px 0 rgba(247, 192, 148, 0.2), 0 4px 8px 0 rgba(226, 168, 87, 0.15)',
        'leather-hover': '0 8px 20px 0 rgba(197, 157, 111, 0.2), 0 4px 8px 0 rgba(176, 134, 84, 0.15)',
      },
      
      // 🎯 Modern Transition Utilities
      transitionProperty: {
        'colors-shadow': 'color, background-color, border-color, text-decoration-color, fill, stroke, box-shadow',
        'transform-colors': 'transform, color, background-color, border-color, text-decoration-color, fill, stroke',
        'all-smooth': 'all'
      },
      
      transitionDuration: {
        '400': '400ms',
        '600': '600ms',
      },
      
      transitionTimingFunction: {
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'bounce-in': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      },
    },
  },
  plugins: [],
}

export default config
