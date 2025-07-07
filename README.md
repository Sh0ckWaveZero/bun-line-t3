# 🚀 Bun LINE T3 App

Modern LINE Bot application built with T3 Stack, featuring comprehensive attendance management, cryptocurrency tracking, and air quality monitoring.

> **🛡️ Security-First Architecture** | **🔧 Docker-optimized** | **📱 LINE Integration** | **⚡ Production Ready**

## 📋 Table of Contents

- [🌟 Features](#-features)
- [🏗️ Architecture](#️-architecture)
- [🚀 Quick Start](#-quick-start)
- [⚙️ Configuration](#️-configuration)
- [📚 Documentation](#-documentation)
- [🛠️ Development](#️-development)
- [🔧 Tech Stack](#-tech-stack)
- [📦 Scripts](#-scripts)
- [🤝 Contributing](#-contributing)

## 🌟 Features

### 🏢 Attendance Management

- **Smart Check-in/Check-out** - Automatic 9-hour work calculation
- **Real-time Notifications** - Push notifications for attendance events
- **🔔 Automated Checkout Reminders** - ✅ **Production Ready** - Docker Cron Jobs with security-first design
- **Monthly Reports** - Comprehensive attendance analytics
- **Holiday Support** - Thai national holidays integration
- **Early Check-in** - Flexible early arrival handling

### 💰 Cryptocurrency Tracking

- **Real-time Prices** - Live cryptocurrency market data
- **Multiple Exchanges** - Support for various trading platforms
- **Price Alerts** - Customizable notification system

### 🌍 Air Quality Monitoring

- **Real-time AQI** - Air quality index tracking
- **Location-based** - Area-specific air quality data
- **Health Recommendations** - Personalized suggestions based on AQI

### 🔐 Authentication & Security

- **LINE OAuth** - Seamless LINE account integration
- **NextAuth.js** - Secure session management
- **Type Safety** - Full TypeScript implementation

## 🏗️ Architecture

This project follows a **Feature-Based Architecture** pattern for scalability and maintainability.

```
src/
├── features/              # Domain-driven feature modules
│   ├── attendance/        # 🏢 Work attendance management
│   ├── auth/             # 🔐 Authentication & user management
│   ├── crypto/           # 💰 Cryptocurrency tracking
│   ├── line/             # 📱 LINE Bot integration
│   └── air-quality/      # 🌍 Air quality monitoring
├── lib/                  # 🔧 Shared utilities & configurations
│   ├── auth/            # Authentication utilities
│   ├── database/        # Database connection & queries
│   ├── constants/       # Application constants
│   └── validation/      # Input validation schemas
├── app/                 # 🌐 Next.js App Router
│   ├── api/            # API routes
│   └── (pages)/        # Application pages
└── components/          # 🎨 Reusable UI components
```

### 🔄 Key Architecture Principles

- **Domain Separation** - Each feature is self-contained
- **Barrel Exports** - Clean import paths with index files
- **Type Safety** - Strict TypeScript throughout
- **Server Components** - Next.js 15 RSC optimization
- **Path Aliases** - Clean imports with `@/` prefix

For detailed architecture documentation, see [`BACKEND_ARCHITECTURE.md`](./docs/BACKEND_ARCHITECTURE.md)

## 🛡️ Recent Security Optimization

> **June 8, 2025** - Major security and documentation cleanup completed

### Key Improvements

- ✅ **Cron Service Security**: Reduced environment variables from 15+ to 3 (-80%)
- ✅ **Attack Surface Reduction**: Minimalist approach following Principle of Least Privilege
- ✅ **Documentation Cleanup**: Organized from 28 to 22 files (-21.4%)
- ✅ **Security Architecture**: Clear separation of concerns between services

See [`SECURITY_OPTIMIZATION_COMPLETE.md`](./docs/SECURITY_OPTIMIZATION_COMPLETE.md) for details.

## 🚀 Quick Start

### Prerequisites

- **Bun** >= 1.0.0
- **Node.js** >= 18.0.0
- **MySQL** database
- **LINE Developer Account**

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd bun-line-t3
   ```

2. **Install dependencies**

   ```bash
   bun install
   ```

3. **Environment setup**

   ```bash
   cp .env.example .env
   # Configure your environment variables (see Configuration section)
   ```

4. **Database setup**

   ```bash
   bun run db:push
   ```

5. **Start development server**
   ```bash
   bun run dev
   ```

The application will be available at `https://localhost:4325`

## ⚙️ Configuration

### Environment Variables

Create a `.env` file with the following variables:

```env
# Database
DATABASE_URL="mysql://user:password@localhost:3306/bun_line_t3"

# NextAuth.js
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="https://localhost:4325"

# LINE Integration
LINE_CLIENT_ID="your-line-client-id"
LINE_CLIENT_SECRET="your-line-client-secret"
LINE_CHANNEL_SECRET="your-line-channel-secret"
LINE_CHANNEL_ACCESS="your-line-channel-access-token"
LINE_MESSAGING_API="https://api.line.me/v2/bot"

# Application
APP_ENV="development"
FRONTEND_URL="https://localhost:4325"
JWT_EXPIRES_IN="1d"

# External APIs
CMC_URL="https://pro-api.coinmarketcap.com"
CMC_API_KEY="your-coinmarketcap-api-key"
AIRVISUAL_API_KEY="your-airvisual-api-key"
```

### LINE Bot Setup

1. Create a LINE Channel in [LINE Developers Console](https://developers.line.biz/)
2. Enable Messaging API
3. Set webhook URL to `https://your-domain.com/api/line`
4. Configure OAuth settings for login functionality

## 📚 Documentation

Comprehensive documentation is available in the `/docs` directory:

### 📖 Core Documentation

- **[� Documentation Overview](./docs/README.md)** - Complete documentation index
- **[🚀 Setup Guide](./docs/SETUP.md)** - Installation and configuration guide
- **[🏗️ System Architecture](./docs/ARCHITECTURE.md)** - System design and architecture
- **[🔌 API Documentation](./docs/API.md)** - Complete API reference
- **[🔐 Security Guide](./docs/SECURITY.md)** - Security best practices and implementation

### 🎯 Feature Documentation

- **[🏢 Attendance System](./docs/ATTENDANCE_SYSTEM.md)** - Work time tracking features
- **[💬 LINE Commands (Thai)](./docs/LINE_COMMANDS_THAI.md)** - คำสั่ง LINE Bot (ภาษาไทย)
- **[💬 LINE Commands (English)](./docs/LINE_COMMANDS.md)** - LINE Bot commands reference
- **[⏰ Cron Jobs System](./docs/CRON-JOBS.md)** - ✅ **Production Ready** - Automated reminder system
- **[🔧 Shared Utilities](./docs/SHARED-UTILITIES.md)** - Reusable utility functions reference
- **[💰 Crypto Tracking](./docs/CRYPTO_TRACKING.md)** - Cryptocurrency monitoring
- **[🌍 Air Quality](./docs/AIR_QUALITY.md)** - Environmental data monitoring

### 🛠️ Development & Deployment

- **[🛠️ Development Guide](./docs/DEVELOPMENT.md)** - Development workflow and standards
- **[� Deployment Guide](./docs/DEPLOYMENT.md)** - Production deployment instructions
- **[🧪 Testing Guide](./docs/TESTING.md)** - Testing strategies and implementation
- **[📊 Performance Guide](./docs/PERFORMANCE.md)** - Optimization and monitoring

## 🛠️ Development

### Code Style & Standards

- **TypeScript Strict Mode** - Full type safety
- **ESLint + Prettier** - Code formatting and linting
- **Functional Programming** - Declarative code patterns
- **React 19** - Latest React features with RSC
- **Next.js 15** - App Router with async components

### Development Commands

```bash
# Development server
bun run dev

# Type checking
bun run type-check

# Linting
bun run lint

# Database operations
bun run db:push          # Push schema changes
bun run db:studio        # Open Prisma Studio
bun run seed:holidays    # Seed holiday data
```

### Testing

```bash
# Run test script
bun run scripts/test-attendance.ts
```

## 🔧 Tech Stack

### Core Framework

- **[Next.js 15](https://nextjs.org)** - React framework with App Router
- **[React 19](https://react.dev)** - Latest React with Server Components
- **[TypeScript](https://typescriptlang.org)** - Type-safe JavaScript
- **[Bun](https://bun.sh)** - Fast JavaScript runtime and package manager

### Database & ORM

- **[Prisma](https://prisma.io)** - Type-safe database toolkit
- **[MySQL](https://mysql.com)** - Relational database

### Authentication

- **[NextAuth.js](https://next-auth.js.org)** - Authentication library
- **[LINE Login](https://developers.line.biz/en/docs/line-login/)** - LINE OAuth provider

### Styling & UI

- **[Tailwind CSS](https://tailwindcss.com)** - Utility-first CSS framework
- **[PostCSS](https://postcss.org)** - CSS transformation tool

### Development Tools

- **[ESLint](https://eslint.org)** - Code linting
- **[Prettier](https://prettier.io)** - Code formatting
- **[Zod](https://zod.dev)** - Schema validation

### External APIs

- **[LINE Messaging API](https://developers.line.biz/en/services/messaging-api/)** - Bot messaging
- **[CoinMarketCap API](https://coinmarketcap.com/api/)** - Cryptocurrency data
- **[AirVisual API](https://www.iqair.com/air-pollution-data-api)** - Air quality data

## 📦 Scripts

| Script                  | Description                           |
| ----------------------- | ------------------------------------- |
| `bun run dev`           | Start development server on port 4325 |
| `bun run build`         | Build production application          |
| `bun run start`         | Start production server               |
| `bun run lint`          | Run ESLint code analysis              |
| `bun run db:push`       | Push Prisma schema to database        |
| `bun run seed:holidays` | Seed Thai holiday data for 2025       |

## 🤝 Contributing

We welcome contributions! Please see our contributing guidelines:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Development Workflow

1. Follow the existing code style and architecture patterns
2. Add TypeScript types for all new features
3. Update documentation for significant changes
4. Test your changes thoroughly
5. Ensure all linting passes

## 📄 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

**Built with ❤️ using T3 Stack and modern web technologies**

For more information, visit our [documentation](./docs/) or contact the development team.
