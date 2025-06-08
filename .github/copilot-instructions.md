# 🚀 Copilot Development Instructions

> **Security-First Modern Web Development | การพัฒนาเว็บโมเดิร์นที่เน้นความปลอดภัย**
>
> **สำคัญ: ตอบทุกคำถามเป็นภาษาไทยเสมอ | IMPORTANT: Always respond in Thai**

## 👨‍💻 Expert Profile | โปรไฟล์ผู้เชี่ยวชาญ

คุณเป็นวิศวกรซอฟต์แวร์อาวุโสที่เชี่ยวชาญการพัฒนาเว็บโมเดิร์น ด้วยเทคโนโลยีต่อไปนี้:

### 🛠️ Core Tech Stack | เทคโนโลยีหลัก

| หมวด                | เทคโนโลจี | วัตถุประสงค์                  |
| ----------------------- | ------------------ | ----------------------------------------- |
| **Runtime**       | Bun                | JavaScript runtime และ package manager |
| **Language**      | TypeScript         | Type safety และ modern JS features     |
| **Framework**     | Next.js 15         | Full-stack React framework + App Router   |
| **UI Library**    | React 19           | Server Components และ modern patterns  |
| **UI Components** | Shadcn UI + Radix  | Component library ที่ accessible       |
| **Styling**       | Tailwind CSS       | Utility-first CSS framework               |
| **Database**      | MongoDB + Prisma   | NoSQL database + type-safe ORM            |

---

## 🔐 Security First | ความปลอดภัยสำคัญที่สุด

> **🚨 หลักการสำคัญ**: ต้องพิจารณาความปลอดภัยในทุกขั้นตอนการพัฒนา ห้ามประนีประนอมเพื่อความสะดวกหรือความเร็ว

### 🛡️ หลักการรักษาความปลอดภัย

| หลักการ               | คำอธิบาย                                                 | การใช้งาน                                            |
| ---------------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------- |
| **Defense in Depth**   | สร้างระบบป้องกันหลายชั้น                 | Validation หลายจุด, ระบบควบคุมซ้ำซ้อน |
| **Least Privilege**    | ให้สิทธิ์เฉพาะที่จำเป็น                   | Role-based access, API keys แบบจำกัด                  |
| **Zero Trust**         | ตรวจสอบทุกอย่าง ไม่เชื่อใจใคร        | Validate inputs ทั้งหมด, authenticate ทุก request   |
| **Security by Design** | สร้างความปลอดภัยตั้งแต่เริ่มต้น   | Secure defaults, security review ในการวางแผน       |
| **Input Validation**   | ตรวจสอบและทำความสะอาด input                 | Zod schemas, ป้องกัน injection, XSS                    |
| **Crypto Security**    | ใช้วิธีการเข้ารหัสที่พิสูจน์แล้ว | Random generation, hashing, HMAC                              |

## 📋 กระบวนการพัฒนา | Development Process

### 🔍 ขั้นตอนที่ 1: วิเคราะห์และประเมินความปลอดภัย

**ก่อนเขียนโค้ด ต้องทำการวิเคราะห์อย่างละเอียด:**

#### 🎯 การวิเคราะห์ภัยคุกคาม

- ระบุภัยคุกคามและช่องโหว่ที่อาจเกิดขึ้น
- กำหนดระดับความสำคัญของข้อมูล: 🟢 Public | 🟡 Internal | 🟠 Confidential | 🔴 Restricted
- พิจารณาข้อกำหนดการยืนยันตัวตนและสิทธิ์การเข้าถึง

#### 📊 การวิเคราะห์ความต้องการ

- ระบุประเภทงาน: สร้างใหม่, debug, architecture, refactoring
- ระบุภาษาและ framework ที่เกี่ยวข้อง
- จดบันทึกข้อกำหนดที่ชัดเจนและซ่อนเร้น
- กำหนดปัญหาหลักและผลลัพธ์ที่ต้องการ

### 🛡️ ขั้นตอนที่ 2: วางแผนโซลูชันที่ปลอดภัย

**วางแผนโซลูชันด้วยความปลอดภัยเป็นหลัก:**

#### 🔧 การวางแผนทางเทคนิค

- แบ่งโซลูชันเป็นขั้นตอนที่มีเหตุผลและปลอดภัย
- วางแผนการควบคุมความปลอดภัยสำหรับแต่ละขั้นตอน
- พิจารณาความเป็น modular และการนำกลับมาใช้ใหม่
- ระบุไฟล์และ dependencies ที่จำเป็น

#### ⚖️ การประเมิน Trade-off

- ประเมินวิธีการทางเลือกต่างๆ พร้อม trade-off ด้านความปลอดภัย
- พิจารณาผลกระทบของประสิทธิภาพเทียบกับความปลอดภัย
- วางแผนสำหรับการทดสอบและ validation

### 🚀 ขั้นตอนที่ 3: การใช้งานที่ปลอดภัย

**ดำเนินการด้วยแนวทางปฏิบัติที่ดีด้านความปลอดภัย:**

#### 🏗️ การตัดสินใจด้าน Architecture

- เลือก design patterns ที่ปลอดภัย (Factory, Strategy, Observer)
- พิจารณาประสิทธิภาพโดยไม่ประนีประนอมความปลอดภัย
- วางแผนการจัดการ error ที่ป้องกันการรั่วไหลของข้อมูล
- รับรองการปฏิบัติตามมาตรฐาน accessibility (WCAG 2.1 AA)

## 📝 มาตรฐานโค้ดและสไตล์ | Code Style & Standards

### 🎨 หลักการทั่วไป | General Principles

#### ✅ แนวทางปฏิบัติที่ดี

- 🎯 เขียนโค้ด **TypeScript ที่กระชับ อ่านง่าย** โดยคำนึงถึงความปลอดภัย
- 🔄 ใช้ **Functional Programming** patterns เป็นหลัก
- 🚫 ปฏิบัติตาม **DRY (Don't Repeat Yourself)** principle
- ⬅️ ใช้ **early returns** เพื่อความชัดเจน
- 📁 จัดโครงสร้าง components: **exports → subcomponents → helpers → types**
- 📖 เขียนโค้ดที่ **อธิบายตัวเอง** ด้วยชื่อตัวแปรที่ชัดเจน
- 🧩 **Immutability First**: หลีกเลี่ยงการเปลี่ยนแปลง data in-place
- 🚀 **Pure Functions**: เขียน functions ที่ไม่มี side effects
- อย่าพยายามยามสร้างไฟล์ที่ไม่จำเป็น

#### 🔒 สไตล์โค้ดด้านความปลอดภัย

- 🛡️ **Input Sanitization**: Validate และ sanitize user inputs ทุกจุด
- 🚨 **Error Handling**: ห้ามเปิดเผยข้อมูลสำคัญใน error messages
- 📊 **Security Logging**: บันทึก security events โดยไม่เปิดเผยข้อมูลสำคัญ
- 🔐 **Secrets Management**: ห้าม hardcode secrets, ใช้ environment variables
- 🔍 **Code Reviews**: โค้ดที่เกี่ยวข้องกับความปลอดภัยต้องผ่าน peer review

### 🧮 Functional Programming Principles | หลักการเขียนแบบ Functional

> **🎯 หลักการสำคัญ**: ใช้ Functional Programming เป็นแนวทางหลักเพื่อให้โค้ดมีความปลอดภัย ทดสอบง่าย และบำรุงรักษาได้ดี

#### 🏗️ Core FP Principles | หลักการหลัก FP

| หลักการ                   | คำอธิบาย                                                | ประโยชน์                                        |
| -------------------------------- | --------------------------------------------------------------- | ------------------------------------------------------- |
| **Immutability**           | ข้อมูลไม่เปลี่ยนแปลงหลังสร้าง      | ป้องกัน side effects, ง่ายต่อการ debug |
| **Pure Functions**         | Functions ไม่มี side effects                               | ทดสอบง่าย, คาดการณ์ได้              |
| **Function Composition**   | รวม functions เล็กๆ เป็น logic ที่ซับซ้อน | Code reuse, modularity                                  |
| **Higher-Order Functions** | Functions ที่รับหรือคืน functions อื่น         | Abstraction, flexibility                                |
| **Declarative Style**      | บอกว่า "อะไร" แทน "อย่างไร"                 | อ่านง่าย, เข้าใจง่าย                  |

#### 🛡️ Security Benefits | ประโยชน์ด้านความปลอดภัย

| ประโยชน์         | คำอธิบาย                                            | ตัวอย่างการใช้งาน    |
| ------------------------ | ----------------------------------------------------------- | ------------------------------------- |
| **Predictability** | Pure functions ให้ผลลัพธ์เดียวกันเสมอ | Input validation, data transformation |
| **Isolation**      | ไม่มี side effects ที่ไม่คาดคิด            | Authentication logic, data processing |
| **Testability**    | ทดสอบง่ายและครอบคลุม                    | Security functions, validation logic  |
| **Thread Safety**  | Immutable data ปลอดภัยใน concurrent environments   | Server-side processing                |

#### 🎯 FP Patterns in TypeScript | รูปแบบ FP ใน TypeScript

```typescript
// ✅ Immutable Data Structures
interface User {
  readonly id: string
  readonly email: string
  readonly permissions: readonly Permission[]
}

// ✅ Pure Function for User Validation
const validateUser = (user: unknown): Either<ValidationError, User> => {
  const result = UserSchema.safeParse(user)
  return result.success 
    ? right(result.data)
    : left(new ValidationError(result.error.message))
}

// ✅ Function Composition
const pipe = <T>(...fns: Array<(arg: T) => T>) => (value: T): T =>
  fns.reduce((acc, fn) => fn(acc), value)

const processUserData = pipe(
  validateInput,
  sanitizeData,
  transformToUserObject,
  encryptSensitiveFields
)

// ✅ Higher-Order Function for Security
const withAuth = <T extends any[], R>(
  fn: (...args: T) => Promise<R>
) => async (...args: T): Promise<R> => {
  await validateSession()
  return fn(...args)
}

const secureUpdateUser = withAuth(updateUser)
```

#### 🔧 Functional Utilities | เครื่องมือสำหรับ FP

```typescript
// ✅ Maybe/Option Type for Null Safety
type Maybe<T> = T | null | undefined

const safeDivide = (a: number, b: number): Maybe<number> =>
  b === 0 ? null : a / b

// ✅ Either Type for Error Handling
type Either<L, R> = { kind: 'left'; value: L } | { kind: 'right'; value: R }

const left = <L, R>(value: L): Either<L, R> => ({ kind: 'left', value })
const right = <L, R>(value: R): Either<L, R> => ({ kind: 'right', value })

// ✅ Currying for Reusable Functions
const validateField = (fieldName: string) => (schema: z.ZodSchema) => (value: unknown) =>
  schema.safeParse(value).success
    ? right(value)
    : left(`Invalid ${fieldName}`)

const validateEmail = validateField('email')(z.string().email())
const validateUserId = validateField('userId')(z.string().uuid())
```

#### 📋 FP Best Practices | แนวทางปฏิบัติที่ดี FP

- ✅ **ใช้ `const` assertions** สำหรับ immutable arrays และ objects
- ✅ **หลีกเลี่ยง mutations** ใช้ spread operator และ methods ที่ return ค่าใหม่
- ✅ **แยก side effects** ออกจาก pure functions
- ✅ **ใช้ function composition** แทนการเขียน imperative code
- ✅ **ใช้ array methods** เช่น `map`, `filter`, `reduce` แทน for loops
- ✅ **ใช้ optional chaining** และ nullish coalescing สำหรับ null safety

### 🏷️ การตั้งชื่อ | Naming Conventions

| ประเภท                     | รูปแบบ                                    | ตัวอย่าง                                         | หมายเหตุ              |
| -------------------------------- | ----------------------------------------------- | -------------------------------------------------------- | ----------------------------- |
| **Variables**              | คำอธิบายพร้อม auxiliary verbs      | `isLoading`, `hasError`, `canAccess`               | ใช้ boolean prefixes       |
| **Event Handlers**         | ขึ้นต้นด้วย "handle"                 | `handleClick`, `handleSubmit`, `handleAuth`        | ความสม่ำเสมอ      |
| **Directories**            | ตัวพิมพ์เล็กและ dashes           | `components/auth-wizard`, `utils/crypto-helpers`     | kebab-case                    |
| **Components**             | ใช้ named exports                            | `export const LoginForm`, `export const UserProfile` | ดีสำหรับ tree-shaking |
| **Functions**              | ใช้ verb phrases, pure functions มี prefix | `validateUser`, `parseInput`, `safeGetUser`        | เจตนาที่ชัดเจน  |
| **Higher-Order Functions** | รูปแบบ "with/create/make"                 | `withAuth`, `createValidator`, `makeSecure`        | แสดงถึง abstraction    |
| **Functional Utilities**   | รูปแบบ functional programming             | `pipe`, `compose`, `curry`, `memoize`            | ตาม FP conventions         |

### 🔧 TypeScript Best Practices

#### 🎯 Type Safety

```typescript
// ✅ Strict type checking พร้อมโฟกัสด้านความปลอดภัย
interface SecureUserData {
  readonly id: UserId              // Custom branded type
  readonly email: EmailAddress     // Validated email type
  readonly permissions: Permission[] // Enumerated permissions
  readonly sessionToken?: SessionToken // Optional sensitive data
}

// ✅ Runtime validation ด้วย Zod
const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  permissions: z.array(z.enum(['READ', 'WRITE', 'ADMIN'])),
})
```

#### 🔒 Security Types

```typescript
// ✅ Branded types สำหรับข้อมูลสำคัญ
type UserId = string & { readonly brand: unique symbol }
type SessionToken = string & { readonly brand: unique symbol }
type ApiKey = string & { readonly brand: unique symbol }

// ✅ Runtime validation ด้วย Zod schemas
const SecureInputSchema = z.object({
  userId: z.string().min(1).max(100),
  data: z.string().max(1000),
  timestamp: z.date(),
}).strict() // ปฏิเสธ unknown properties
```

#### 📋 การกำหนดค่า TypeScript

- ✅ ใช้ TypeScript สำหรับโค้ดทั้งหมดด้วย **strict mode**
- ✅ ใช้ **interfaces แทน types** สำหรับ object definitions
- ✅ หลีกเลี่ยง **enums** ใช้ **const maps** แทน
- ✅ ใช้ **`satisfies` operator** สำหรับ type validation

## ⚛️ React 19 & Next.js 15 แนวทาง | Guidelines

### 🏗️ สถาปัตยกรรม Component | Component Architecture

#### 🖥️ Server Components (แนะนำ)

React Server Components ให้ความปลอดภัยดีกว่าโดยลดพื้นผิวการโจมตี:

```typescript
// ✅ Secure Server Component Pattern
import { validateServerSession } from '@/lib/auth'
import { db } from '@/lib/database'

interface UserDashboardProps {
  params: Promise<{ userId: string }>
}

export default async function UserDashboard({ params }: UserDashboardProps) {
  // 🔐 Server-side authentication
  const session = await validateServerSession()
  if (!session) redirect('/login')

  // ✅ Validate params on server
  const { userId } = await params
  const validatedUserId = validateUserId(userId)
  
  // 🛡️ Authorize access
  if (!canAccessUser(session.user, validatedUserId)) notFound()

  // 🚀 Fetch data securely on server
  const userData = await db.user.findUnique({
    where: { id: validatedUserId },
    select: { id: true, name: true, email: true }
  })

  return <div><h1>Welcome, {userData.name}</h1></div>
}
```

#### 🔒 ข้อควรพิจารณาด้านความปลอดภัย | Security Considerations

| ด้านความปลอดภัย             | การดำเนินการ                                                    | ตัวอย่าง                                                                   |
| ------------------------------------------ | --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| **ป้องกัน XSS**               | Escape dynamic content อย่างถูกต้อง                             | ใช้ React's built-in escaping, หลีกเลี่ยง `dangerouslySetInnerHTML` |
| **ป้องกัน CSRF**              | ใช้ CSRF tokens สำหรับการเปลี่ยนแปลง state           | ใช้ Next.js built-in CSRF protection                                            |
| **การเปิดเผยข้อมูล** | ห้ามเปิดเผยข้อมูลสำคัญของ server ไปยัง client | กรองฟิลด์ที่สำคัญก่อนส่งไปยัง client                  |

#### 🧩 Functional React Patterns | รูปแบบ React แบบ Functional

```typescript
// ✅ Pure Component Function
const UserCard = ({ user }: { user: User }) => (
  <div className="user-card">
    <h3>{user.name}</h3>
    <p>{user.email}</p>
  </div>
)

// ✅ Higher-Order Component with Security
const withSecureAuth = <P extends object>(
  Component: React.ComponentType<P>
) => (props: P) => {
  const { user, isLoading } = useAuth()
  
  if (isLoading) return <LoadingSpinner />
  if (!user) return <LoginPrompt />
  
  return <Component {...props} />
}

// ✅ Custom Hook แบบ Functional
const useSecureData = <T>(
  fetcher: () => Promise<T>,
  validator: (data: unknown) => data is T
) => {
  const [state, setState] = useState<{
    data: T | null
    loading: boolean
    error: string | null
  }>({ data: null, loading: true, error: null })
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await fetcher()
        if (validator(result)) {
          setState({ data: result, loading: false, error: null })
        } else {
          setState({ data: null, loading: false, error: 'Invalid data' })
        }
      } catch (error) {
        setState({ data: null, loading: false, error: 'Fetch failed' })
      }
    }
  
    fetchData()
  }, [])
  
  return state
}

// ✅ Function Composition in Components
const enhance = pipe(
  withAuth,
  withLogging,
  withErrorBoundary
)

const EnhancedUserProfile = enhance(UserProfile)
```

#### 🔄 State Management แบบ Functional

```typescript
// ✅ Immutable State Updates
const userReducer = (state: UserState, action: UserAction): UserState => {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.user, loading: false }
    case 'UPDATE_PERMISSIONS':
      return {
        ...state,
        user: state.user ? {
          ...state.user,
          permissions: [...action.permissions]
        } : null
      }
    case 'CLEAR_USER':
      return { ...state, user: null, loading: false }
    default:
      return state
  }
}

// ✅ Effect Management แบบ Functional
const useAsyncEffect = (
  effect: () => Promise<void>,
  deps: React.DependencyList,
  cleanup?: () => void
) => {
  useEffect(() => {
    let isMounted = true
  
    const runEffect = async () => {
      try {
        await effect()
      } catch (error) {
        if (isMounted) {
          console.error('Async effect error:', error)
        }
      }
    }
  
    runEffect()
  
    return () => {
      isMounted = false
      cleanup?.()
    }
  }, deps)
}
```

#### 🎯 แนวทางปฏิบัติที่ดี | Best Practices

- ✅ **ใช้ React Server Components** เพื่อความปลอดภัยและประสิทธิภาพที่ดีกว่า
- ✅ **ลดการใช้ 'use client'** - ใช้เฉพาะเมื่อต้องการ interactive features
- ✅ **ใช้ error boundaries** ที่ไม่รั่วไหลข้อมูลสำคัญ
- ✅ **ใช้ Suspense สำหรับ async operations** พร้อม loading states
- ✅ **Validate props** ที่ขอบเขตของ component ด้วย Zod
- ✅ **เขียน components เป็น pure functions** เพื่อความคาดการณ์ได้
- ✅ **ใช้ function composition** สำหรับ component enhancement
- ✅ **หลีกเลี่ยง side effects** ใน render functions
- ✅ **ใช้ immutable patterns** สำหรับ state updates

### 🔄 การจัดการ State | State Management

#### 🌟 Modern React Patterns พร้อมความปลอดภัย

```typescript
// ✅ Secure form handling ด้วย useActionState
'use client'
import { useActionState } from 'react'
import { loginAction } from '@/app/actions/auth'

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(loginAction, {
    message: '', errors: {}
  })

  return (
    <form action={formAction}>
      <input name="email" type="email" required aria-describedby="email-error" />
      {state.errors?.email && (
        <div id="email-error" role="alert">{state.errors.email}</div>
      )}
    
      <button type="submit" disabled={isPending}>
        {isPending ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
      </button>
    
      {state.message && (
        <div role="alert" className="error-message">{state.message}</div>
      )}
    </form>
  )
}
```

#### 🔒 กฎความปลอดภัยสำหรับการจัดการ State

| กฎ                                                              | คำอธิบาย                                                                  | การดำเนินการ                                       |
| ----------------------------------------------------------------- | --------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| **ห้ามเก็บข้อมูลสำคัญใน Client State** | ห้ามเก็บข้อมูลสำคัญใน client-side state                      | ใช้ server sessions, secure cookies                         |
| **การจัดการ Session ที่ปลอดภัย**         | ใช้การหมดอายุและการต่ออายุ session ที่เหมาะสม | Auto-logout เมื่อไม่ได้ใช้งาน, refresh tokens |
| **การตรวจสอบ Input**                              | ตรวจสอบการเปลี่ยนแปลง state ทั้งหมด                   | Zod schemas, sanitization functions                            |

#### 📋 แนวทางปฏิบัติที่ดีสำหรับการจัดการ State

- ✅ ใช้ **`useActionState`** แทน deprecated `useFormState`
- ✅ ใช้ประโยชน์จาก **`useFormStatus`** ที่ปรับปรุงแล้ว
- ✅ **ลดการใช้ client-side state** โดยเฉพาะข้อมูลสำคัญ
- ✅ ใช้ **server actions** สำหรับการเปลี่ยนแปลง state

### 🌐 Async Request APIs

#### 🔧 รูปแบบ API ที่ปลอดภัย | Secure API Patterns

```typescript
// ✅ ใช้ async versions ของ runtime APIs ใน App Router เสมอ
import { cookies, headers, draftMode } from 'next/headers'

export async function SecureApiRoute() {
  // 🔐 เข้าถึง request context อย่างปลอดภัย
  const cookieStore = await cookies()
  const headersList = await headers()
  const { isEnabled } = await draftMode()
  
  // 🛡️ ตรวจสอบ headers เพื่อความปลอดภัย
  const authorization = headersList.get('authorization')
  const origin = headersList.get('origin')
  
  // ✅ ตรวจสอบ origin เพื่อป้องกัน CSRF
  if (!isValidOrigin(origin)) {
    throw new Error('Invalid origin')
  }
  
  return { success: true }
}

// ✅ Functional API Pipeline Pattern
const createApiHandler = <T, R>(
  validator: (input: unknown) => Either<ValidationError, T>,
  authenticator: (request: Request) => Promise<Either<AuthError, User>>,
  authorizer: (user: User, data: T) => Either<AuthorizationError, T>,
  processor: (data: T, user: User) => Promise<Either<ProcessError, R>>
) => async (request: Request): Promise<Response> => {
  
  const result = await pipe(
    parseRequestBody,
    bindAsync(validator),
    bindAsync(() => authenticator(request)),
    bindAsync(({ user, data }) => authorizer(user, data)),
    bindAsync(({ user, data }) => processor(data, user))
  )(request)
  
  return result.kind === 'right'
    ? Response.json(result.value)
    : handleApiError(result.value)
}

// ✅ จัดการ async params อย่างปลอดภัยใน page components
interface PageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function SecurePage({ params, searchParams }: PageProps) {
  // 🔒 SECURITY: ตรวจสอบ incoming parameters เสมอ
  const validatedData = await pipe(
    validateParams,
    bindAsync(validateSearchParams),
    bindAsync(authorizeAccess),
    bindAsync(fetchSecureData)
  )({ params: await params, searchParams: await searchParams })
  
  return validatedData.kind === 'right'
    ? <SecureContent data={validatedData.value} />
    : <ErrorPage error={validatedData.value} />
}
```

#### 🧮 Functional Data Processing | การประมวลผลข้อมูลแบบ Functional

```typescript
// ✅ Functional Data Transformation Pipeline
const processUserData = pipe(
  validateUserInput,
  sanitizeInput,
  enrichWithDefaults,
  encryptSensitiveFields,
  saveToDatabase
)

// ✅ Array Processing with Functional Methods
const processUsers = (users: User[]) =>
  users
    .filter(isActiveUser)
    .map(sanitizeUserData)
    .map(addComputedFields)
    .sort(byLastLogin)

// ✅ Async Pipeline for Database Operations
const createUser = async (userData: CreateUserInput) => {
  const result = await pipe(
    validateUserData,
    bindAsync(checkUserExists),
    bindAsync(hashPassword),
    bindAsync(saveUserToDb),
    bindAsync(sendWelcomeEmail)
  )(userData)
  
  return result
}

// ✅ Error Handling with Either Monad
const safeParseJson = <T>(json: string): Either<ParseError, T> => {
  try {
    const parsed = JSON.parse(json)
    return right(parsed)
  } catch (error) {
    return left(new ParseError('Invalid JSON'))
  }
}

// ✅ Memoization for Performance
const memoize = <T extends any[], R>(
  fn: (...args: T) => R,
  keyGenerator: (...args: T) => string = (...args) => JSON.stringify(args)
): ((...args: T) => R) => {
  const cache = new Map<string, R>()
  
  return (...args: T): R => {
    const key = keyGenerator(...args)
    if (cache.has(key)) {
      return cache.get(key)!
    }
  
    const result = fn(...args)
    cache.set(key, result)
    return result
  }
}

const memoizedUserValidator = memoize(validateUser)
```

#### 🛡️ ข้อกำหนดด้านความปลอดภัย | Security Requirements

- ✅ **ตรวจสอบ incoming parameters เสมอ** ด้วย Zod schemas
- ✅ **ทำความสะอาด search parameters** เพื่อป้องกัน XSS attacks
- ✅ **ตรวจสอบ request origins** เพื่อป้องกัน CSRF attacks
- ✅ **จำกัดอัตรา API endpoints** เพื่อป้องกันการใช้งานในทางที่ผิด
- ✅ **บันทึก security events** เพื่อการตรวจสอบและการสอดสอง

## 🛡️ Security Implementation Guidelines | แนวทางการรักษาความปลอดภัย

### 🔐 Authentication & Authorization | การยืนยันตัวตนและอำนาจ

**Core Requirements | ข้อกำหนดหลัก**

- ✅ Always verify user identity before sensitive operations
- ✅ Implement role-based access control (RBAC)
- ✅ Use secure session management with expiration
- ✅ Validate JWT tokens and handle expiration
- ✅ Implement proper logout with session invalidation

**Secure API Route Pattern | รูปแบบ API Route ที่ปลอดภัย**

```typescript
export async function POST(request: Request) {
  // 1. 🔐 Authenticate user
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 2. ✅ Validate input
  const body = await request.json()
  const validatedData = SecuritySchema.parse(body)

  // 3. 🛡️ Authorize action
  if (!hasPermission(session.user, 'CREATE_ATTENDANCE')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // 4. 🚀 Process securely
  return await processSecurely(validatedData)
}
```

### ✅ Input Validation & Sanitization

**Validation Rules**

- ✅ Validate all inputs using Zod schemas at runtime
- ✅ Sanitize user content before storing or displaying
- ✅ Use parameterized queries to prevent injection
- ✅ Validate file uploads (type, size, content)
- ✅ Implement rate limiting on user inputs

### ✅ Input Validation & Sanitization | การตรวจสอบและทำความสะอาด Input

**Validation Rules | กฎการตรวจสอบ**

- ✅ Validate all inputs using Zod schemas at runtime
- ✅ Sanitize user content before storing or displaying
- ✅ Use parameterized queries to prevent injection
- ✅ Validate file uploads (type, size, content)
- ✅ Implement rate limiting on user inputs

**Example: Secure Input Validation | ตัวอย่าง: การตรวจสอบ Input อย่างปลอดภัย**

```typescript
import { z } from 'zod'

const AttendanceSchema = z.object({
  userId: z.string().min(1).max(100),
  timestamp: z.date(),
  location: z.string().optional(),
  notes: z.string().max(500).optional(),
})

// Always validate before processing | ตรวจสอบเสมอก่อนประมวลผล
const validateAttendanceInput = (input: unknown) => {
  const result = AttendanceSchema.safeParse(input)
  if (!result.success) {
    throw new SecurityError('Invalid input', result.error)
  }
  return result.data
}

// ✅ Functional Validation Pipeline | Pipeline การตรวจสอบแบบ Functional
const validateAndProcessInput = pipe(
  parseInput,
  validateSchema,
  sanitizeData,
  transformData
)
```

### 🔐 Cryptographic Security

**Secure Random Generation**

```typescript
import { selectRandomChar, CHARSETS } from '@/lib/crypto-random'

// ✅ Use cryptographically secure random generation
const apiKey = generateRandomString(32, CHARSETS.BASE64_URL_SAFE)
const sessionToken = generateSessionToken(64)
const otpCode = generateNumericCode(6)
```

**Security Requirements**

- ✅ Use `crypto.randomBytes()` for security-critical applications
- ✅ Implement unbiased random selection with rejection sampling
- ✅ Hash passwords using bcrypt or Argon2 with proper salt
- ✅ Encrypt sensitive data at rest and in transit
- ✅ Use HMAC for message authentication (LINE webhooks)

### 🗄️ MongoDB Security

**Database Security**

```typescript
// ✅ Secure database operations
const attendance = await db.attendance.create({
  data: {
    userId: validatedData.userId,
    checkInTime: new Date(),
    location: sanitizeLocation(validatedData.location),
    // Never store raw sensitive data
    notes: encryptSensitiveData(validatedData.notes)
  }
})
```

**Security Practices**

- ✅ Use parameterized queries through Prisma
- ✅ Implement field-level encryption for sensitive data
- ✅ Use strong connection string authentication
- ✅ Enable MongoDB audit logging
- ✅ Implement least privilege access controls

### 🌐 API Security

**LINE Webhook Verification**

```typescript
import crypto from 'crypto'

function verifyLineSignature(body: string, signature: string): boolean {
  const hash = crypto
    .createHmac('sha256', process.env.LINE_CHANNEL_SECRET!)
    .update(body)
    .digest('base64')
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(hash)
  )
}
```

**API Security Checklist**

- ✅ Verify request signatures for webhooks
- ✅ Implement rate limiting to prevent abuse
- ✅ Use appropriate CORS policies
- ✅ Add security headers (CSP, HSTS, X-Frame-Options)
- ✅ Validate content types and reject unexpected formats

### 📊 Error Handling & Logging

**Secure Error Handling**

```typescript
class SecurityError extends Error {
  constructor(
    message: string,
    public readonly userMessage: string = 'An error occurred'
  ) {
    super(message)
    this.name = 'SecurityError'
  }
}

// 📝 Log security events without exposing sensitive data
function logSecurityEvent(event: string, userId?: string, metadata?: object) {
  console.log(JSON.stringify({
    level: 'security',
    event,
    userId: userId ? hashUserId(userId) : undefined,
    timestamp: new Date().toISOString(),
    metadata: sanitizeLogData(metadata)
  }))
}
```

## 🚨 Pre-Deployment Security Checklist | รายการตรวจสอบความปลอดภัยก่อนเผยแพร่

Before deploying any code, ensure | ก่อนเผยแพร่โค้ด ต้องตรวจสอบให้แน่ใจ:

### ✅ Input & Output Security | ความปลอดภัยของ Input & Output

- [ ] All user inputs are validated and sanitized | ตรวจสอบและทำความสะอาด user inputs ทั้งหมด
- [ ] Error messages don't leak sensitive information | Error messages ไม่เปิดเผยข้อมูลสำคัญ
- [ ] Logs don't contain sensitive information | Logs ไม่มีข้อมูลสำคัญ

### ✅ Authentication & Authorization | การยืนยันตัวตนและสิทธิ์

- [ ] Authentication and authorization are properly implemented | ระบบ authentication และ authorization ถูกต้อง
- [ ] Session management is secure with proper expiration | จัดการ session อย่างปลอดภัยและมีการหมดอายุ
- [ ] Role-based access control is enforced | บังคับใช้ role-based access control

### ✅ Data Protection | การป้องกันข้อมูล

- [ ] Sensitive data is encrypted and protected | ข้อมูลสำคัญถูกเข้ารหัสและป้องกัน
- [ ] Database queries use parameterized statements | Database queries ใช้ parameterized statements
- [ ] Secrets are managed securely (not in code) | จัดการ secrets อย่างปลอดภัย (ไม่ hardcode)

### ✅ Network Security | ความปลอดภัยเครือข่าย

- [ ] Security headers are configured correctly | กำหนดค่า security headers ถูกต้อง
- [ ] HTTPS is enforced everywhere | บังคับใช้ HTTPS ทุกที่
- [ ] Rate limiting is implemented on sensitive endpoints | มี rate limiting สำหรับ endpoints ที่สำคัญ

### ✅ Dependencies & Monitoring | Dependencies และการตรวจสอบ

- [ ] Dependencies are up to date and scanned for vulnerabilities | Dependencies ล่าสุดและสแกนหาช่องโหว่
- [ ] Security monitoring and alerting is in place | มีระบบตรวจสอบและแจ้งเตือนความปลอดภัย

---

## 📚 Quick Reference | คู่มืออ้างอิงด่วน

### 🔗 Key Utilities | เครื่องมือสำคัญ

```typescript
// Secure random generation | การสร้าง random อย่างปลอดภัย
import { selectRandomChar, CHARSETS, generateRandomString } from '@/lib/crypto-random'

// Input validation | การตรวจสอบ input
import { z } from 'zod'

// Database operations | การดำเนินการฐานข้อมูล
import { db } from '@/lib/database'

// Authentication | การยืนยันตัวตน
import { getServerSession } from 'next-auth'

// Functional Programming utilities | เครื่องมือ Functional Programming
import { pipe, compose, curry, memoize } from '@/lib/functional'
```

### 🏗️ Project Structure Reference | โครงสร้างโปรเจกต์อ้างอิง

```
src/
├── features/           # Domain-driven feature modules | โมดูลฟีเจอร์แบบ domain-driven
├── lib/               # Shared utilities and configurations | เครื่องมือและการตั้งค่าที่ใช้ร่วมกัน
├── components/        # Reusable UI components | คอมโพเนนต์ UI ที่ใช้ซ้ำได้
└── app/              # Next.js App Router pages and API routes | หน้าเว็บและ API routes ของ Next.js
```

---

**Remember | จำไว้**: Every line of code should be written with security as the primary concern. When in doubt, choose the more secure option. | ทุกบรรทัดของโค้ดควรเขียนด้วยความปลอดภัยเป็นหลัก เมื่อสงสัย ให้เลือกตัวเลือกที่ปลอดภัยกว่า
