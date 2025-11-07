# Security Guidelines

## Security Principles

1. **Defense in depth** - Multiple layers of security
2. **Least privilege** - Minimal access rights for users/services
3. **Secure by default** - Safe defaults, explicit opt-out for less secure options
4. **Fail securely** - Errors shouldn't expose sensitive information
5. **Trust nothing** - Validate all input, sanitize all output

## Authentication & Authorization (Future)

### Planned: Firebase Authentication

```typescript
// Future implementation
import { auth } from '@/lib/firebase'

// Protect API routes
export async function GET(request: Request) {
  const token = request.headers.get('authorization')?.split('Bearer ')[1]

  if (!token) {
    return new Response('Unauthorized', { status: 401 })
  }

  try {
    const decodedToken = await auth.verifyIdToken(token)
    const userId = decodedToken.uid

    // Proceed with authenticated request
  } catch (error) {
    return new Response('Invalid token', { status: 401 })
  }
}
```

### Role-Based Access Control

```typescript
// Future: RBAC system
enum UserRole {
  GUEST = 'guest',
  CREATOR = 'creator',
  ADMIN = 'admin',
}

function requireRole(role: UserRole) {
  return async (request: Request) => {
    const user = await getCurrentUser(request)

    if (!user || user.role !== role) {
      return new Response('Forbidden', { status: 403 })
    }

    // Continue
  }
}

// Usage
export const GET = requireRole(UserRole.CREATOR)(async (request) => {
  // Only creators can access
})
```

## Input Validation

### Validate All User Input

```typescript
// ✅ Use zod for validation
import { z } from 'zod'

const EventSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  prompt: z.string().min(10).max(1000),
  settings: z.object({
    maxSubmissions: z.number().int().positive().max(10000),
    allowSharing: z.boolean(),
  }),
})

// Validate in API route
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const validated = EventSchema.parse(body)

    // Use validated data
    const event = await createEvent(validated)
    return Response.json(event)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ errors: error.errors }, { status: 400 })
    }
    return Response.json({ error: 'Invalid request' }, { status: 400 })
  }
}
```

### Sanitize User-Generated Content

```typescript
// ✅ Sanitize HTML if displaying user content
import DOMPurify from 'isomorphic-dompurify'

function SafeUserContent({ content }: { content: string }) {
  const sanitized = DOMPurify.sanitize(content, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a'],
    ALLOWED_ATTR: ['href'],
  })

  return <div dangerouslySetInnerHTML={{ __html: sanitized }} />
}
```

### File Upload Security

```typescript
// File upload validation
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

function validateImageFile(file: File): { valid: boolean; error?: string } {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: 'File too large (max 10MB)' }
  }

  // Check MIME type
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { valid: false, error: 'Invalid file type. Only JPEG, PNG, WebP allowed.' }
  }

  // Check file extension (defense in depth)
  const ext = file.name.split('.').pop()?.toLowerCase()
  if (!['jpg', 'jpeg', 'png', 'webp'].includes(ext || '')) {
    return { valid: false, error: 'Invalid file extension' }
  }

  return { valid: true }
}

// Server-side validation (future)
async function validateImageFileServer(file: Buffer) {
  // Use file-type library to check actual file type
  const { fileTypeFromBuffer } = await import('file-type')
  const type = await fileTypeFromBuffer(file)

  if (!type || !['image/jpeg', 'image/png', 'image/webp'].includes(type.mime)) {
    throw new Error('Invalid image file')
  }
}
```

## XSS Prevention

### Avoid Dangerous Patterns

```typescript
// ❌ NEVER use dangerouslySetInnerHTML with unsanitized user input
<div dangerouslySetInnerHTML={{ __html: userInput }} />

// ✅ React escapes by default
<div>{userInput}</div>

// ✅ If HTML is needed, sanitize first
<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(userInput) }} />
```

### Content Security Policy

```typescript
// next.config.js
const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline'", // Next.js requires unsafe-inline
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self' data:",
      "connect-src 'self' https://api.clementine.app",
      "frame-ancestors 'none'",
    ].join('; '),
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()',
  },
]

module.exports = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ]
  },
}
```

## CSRF Protection

```typescript
// For API routes that modify data
import { NextRequest } from 'next/server'

function validateCSRFToken(request: NextRequest) {
  const token = request.headers.get('x-csrf-token')
  const cookie = request.cookies.get('csrf-token')

  if (!token || !cookie || token !== cookie.value) {
    throw new Error('Invalid CSRF token')
  }
}

export async function POST(request: NextRequest) {
  validateCSRFToken(request)

  // Proceed with request
}
```

## Environment Variables

### Secure Configuration

```bash
# .env.local (never commit this file!)
# Public variables (exposed to browser)
NEXT_PUBLIC_API_URL=https://api.clementine.app

# Private variables (server-only)
DATABASE_URL=postgresql://...
API_SECRET_KEY=...
FIREBASE_ADMIN_KEY=...
```

```typescript
// ✅ Access env vars safely
const apiUrl = process.env.NEXT_PUBLIC_API_URL
const secretKey = process.env.API_SECRET_KEY // Server-only

// ❌ Never expose secrets to client
// NEXT_PUBLIC_SECRET_KEY=... // DON'T DO THIS
```

### Validate Environment Variables

```typescript
// lib/env.ts
import { z } from 'zod'

const envSchema = z.object({
  NEXT_PUBLIC_API_URL: z.string().url(),
  DATABASE_URL: z.string().min(1),
  API_SECRET_KEY: z.string().min(32),
})

export const env = envSchema.parse(process.env)
```

## Rate Limiting (Future)

```typescript
// Protect API routes from abuse
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '10 s'), // 10 requests per 10 seconds
})

export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for') ?? 'anonymous'
  const { success } = await ratelimit.limit(ip)

  if (!success) {
    return new Response('Too many requests', { status: 429 })
  }

  // Process request
}
```

## SQL Injection Prevention

```typescript
// ✅ Use parameterized queries (with Prisma/Drizzle)
const user = await db.user.findUnique({
  where: { email: userEmail },
})

// ❌ NEVER concatenate user input into SQL
// const query = `SELECT * FROM users WHERE email = '${userEmail}'`
```

## Logging & Monitoring

### Secure Logging

```typescript
// ✅ Log security events
function logSecurityEvent(event: string, details: Record<string, any>) {
  console.log(JSON.stringify({
    type: 'security',
    event,
    timestamp: new Date().toISOString(),
    ...details,
  }))
}

// Usage
logSecurityEvent('failed_login', {
  email: user.email,
  ip: request.ip,
})

// ❌ Never log sensitive data
// console.log('Password:', password) // DON'T DO THIS
// console.log('API Key:', apiKey)   // DON'T DO THIS
```

### Sanitize Error Messages

```typescript
// ✅ Generic error messages to users
export async function POST(request: Request) {
  try {
    await processPayment()
    return Response.json({ success: true })
  } catch (error) {
    // Log detailed error server-side
    console.error('Payment error:', error)

    // Return generic message to client
    return Response.json(
      { error: 'Payment failed. Please try again.' },
      { status: 500 }
    )
  }
}

// ❌ Don't expose internal errors
// return Response.json({ error: error.message })
// "Database connection failed at 192.168.1.10:5432"
```

## Dependency Security

### Regular Updates

```bash
# Check for vulnerabilities
pnpm audit

# Fix vulnerabilities
pnpm audit --fix

# Update dependencies
pnpm update
```

### Dependabot Configuration

```yaml
# .github/dependabot.yml
version: 2
updates:
  - package-ecosystem: 'npm'
    directory: '/'
    schedule:
      interval: 'weekly'
    open-pull-requests-limit: 10
    versioning-strategy: increase
```

## HTTPS Only

```typescript
// Redirect HTTP to HTTPS (in production)
// next.config.js
module.exports = {
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [
          {
            type: 'header',
            key: 'x-forwarded-proto',
            value: 'http',
          },
        ],
        destination: 'https://clementine.app/:path*',
        permanent: true,
      },
    ]
  },
}
```

## Security Checklist

Before deploying:

- [ ] All user input is validated and sanitized
- [ ] Environment variables are properly configured (public vs private)
- [ ] Authentication is implemented for protected routes
- [ ] CSRF protection is enabled for state-changing operations
- [ ] Rate limiting is configured for API routes
- [ ] Security headers are set (CSP, X-Frame-Options, etc.)
- [ ] HTTPS is enforced
- [ ] File uploads are validated (type, size, content)
- [ ] Error messages don't expose sensitive information
- [ ] Dependencies are up to date and free of known vulnerabilities
- [ ] Sensitive data is never logged
- [ ] SQL queries use parameterized statements

## Security Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Next.js Security Best Practices](https://nextjs.org/docs/app/building-your-application/configuring/content-security-policy)
- [MDN Web Security](https://developer.mozilla.org/en-US/docs/Web/Security)
