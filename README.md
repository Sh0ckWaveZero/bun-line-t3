# Bun LINE T3 App

This is a [T3 Stack](https://create.t3.gg/) project bootstrapped with `create-t3-app`, featuring a modern **Feature-Based Architecture**.

## 🚀 Recent Updates

- ✅ **Feature-Based Backend Architecture** - Organized by domain/feature
- ✅ **App Router** with Server Components (Next.js 15)
- ✅ **LINE Bot Integration** for attendance tracking
- ✅ **NextAuth.js** authentication with LINE provider
- ✅ **Monthly Attendance Reports**
- ✅ **Real-time Push Notifications**
- ✅ **TypeScript Path Aliases** for clean imports

## 🏗️ Architecture

### Backend Structure
```
src/
├── features/           # Feature-based modules
│   ├── attendance/     # Attendance management
│   ├── auth/          # Authentication
│   ├── crypto/        # Cryptocurrency features
│   ├── line/          # LINE Bot integration
│   └── air-quality/   # Air quality monitoring
├── lib/               # Shared utilities
│   ├── auth/         # Authentication utilities
│   ├── database/     # Database connection
│   ├── constants/    # Application constants
│   └── validation/   # Validation utilities
└── app/api/          # Next.js API routes
```

For detailed architecture documentation, see [`BACKEND_ARCHITECTURE.md`](./docs/BACKEND_ARCHITECTURE.md)

### Key Features:
- 🔄 **Scalable Structure** - Easy to add new features
- 🧩 **Modular Design** - Clear separation of concerns
- 📦 **Barrel Exports** - Clean import paths
- 🎯 **TypeScript Strict Mode** - Type safety
- 🔀 **Path Aliases** - `@/features/*`, `@/lib/*`, `@/components/*`

## What's next? How do I make an app with this?

We try to keep this project as simple as possible, so you can start with just the scaffolding we set up for you, and add additional things later when they become necessary.

If you are not familiar with the different technologies used in this project, please refer to the respective docs. If you still are in the wind, please join our [Discord](https://t3.gg/discord) and ask for help.

- [Next.js](https://nextjs.org)
- [NextAuth.js](https://next-auth.js.org)
- [Prisma](https://prisma.io)
- [Tailwind CSS](https://tailwindcss.com)
- [tRPC](https://trpc.io)

## Learn More

To learn more about the [T3 Stack](https://create.t3.gg/), take a look at the following resources:

- [Documentation](https://create.t3.gg/)
- [Learn the T3 Stack](https://create.t3.gg/en/faq#what-learning-resources-are-currently-available) — Check out these awesome tutorials

You can check out the [create-t3-app GitHub repository](https://github.com/t3-oss/create-t3-app) — your feedback and contributions are welcome!

## How do I deploy this?

Follow our deployment guides for [Vercel](https://create.t3.gg/en/deployment/vercel), [Netlify](https://create.t3.gg/en/deployment/netlify) and [Docker](https://create.t3.gg/en/deployment/docker) for more information.
