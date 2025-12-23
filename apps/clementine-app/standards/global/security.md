# Security Standards

Security guidelines for the Clementine application.

## Overview

Security is enforced at the Firebase level (Firestore rules, Storage rules, Authentication) rather than in application code.

## Firebase Security Model

### Firestore Security Rules

**Primary security mechanism** - all data access is controlled by Firestore rules:

```javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }

    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }

    // Company access control
    match /companies/{companyId} {
      allow read: if isAuthenticated() &&
                    isCompanyMember(request.auth.uid, companyId);
      allow write: if isAuthenticated() &&
                     isCompanyAdmin(request.auth.uid, companyId);
    }

    // Public project reads, authenticated writes
    match /projects/{projectId} {
      allow read: if true;
      allow write: if isAuthenticated() &&
                     canEditProject(request.auth.uid, projectId);
    }

    // Nested events - inherit project permissions
    match /projects/{projectId}/events/{eventId} {
      allow read: if true;
      allow write: if isAuthenticated() &&
                     canEditProject(request.auth.uid, projectId);
    }
  }
}
```

### Storage Security Rules

Control file upload/download access:

```javascript
// storage.rules
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Public reads, authenticated writes
    match /media/{companyId}/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null &&
                     userOwnsCompany(request.auth.uid, companyId) &&
                     request.resource.size < 10 * 1024 * 1024 && // 10MB limit
                     request.resource.contentType.matches('image/.*');
    }
  }
}
```

## Authentication

### Firebase Auth Client SDK

```tsx
import { auth } from '@/integrations/firebase/client'
import { signInWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth'

// Client-side authentication
async function signIn(email: string, password: string) {
  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password,
    )
    return { success: true, user: userCredential.user }
  } catch (error) {
    return { success: false, error }
  }
}

// Listen to auth state
useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, (user) => {
    if (user) {
      setCurrentUser(user)
    } else {
      setCurrentUser(null)
    }
  })
  return unsubscribe
}, [])
```

### Never Trust Client-Side Auth Checks

```tsx
// ❌ BAD: Client-side auth check for security
function deleteEvent(eventId: string) {
  if (currentUser?.uid === event.createdBy) {
    // Anyone can manipulate this in DevTools!
    await deleteDoc(doc(firestore, 'events', eventId))
  }
}

// ✅ GOOD: Security enforced by Firestore rules
function deleteEvent(eventId: string) {
  // Firestore rules will reject if user doesn't have permission
  await deleteDoc(doc(firestore, 'events', eventId))
}
```

## Input Validation

### Validate on Client (UX) and Database (Security)

```tsx
// Client-side validation (UX only, not security)
function EventForm() {
  const form = useForm({
    validationSchema: eventSchema,
  })

  return <form onSubmit={form.handleSubmit(createEvent)}>...</form>
}

// Firestore rules validation (actual security)
// firestore.rules
match /events/{eventId} {
  allow create: if request.resource.data.name is string &&
                  request.resource.data.name.size() > 0 &&
                  request.resource.data.name.size() <= 100;
}
```

### Sanitize User Input

```tsx
import DOMPurify from 'dompurify'

// Sanitize HTML content from users
function DisplayUserContent({ content }: { content: string }) {
  const sanitized = DOMPurify.sanitize(content)
  return <div dangerouslySetInnerHTML={{ __html: sanitized }} />
}
```

## XSS Prevention

### Avoid dangerouslySetInnerHTML

```tsx
// ❌ BAD: XSS vulnerability
function UserComment({ comment }: { comment: string }) {
  return <div dangerouslySetInnerHTML={{ __html: comment }} />
}

// ✅ GOOD: React escapes by default
function UserComment({ comment }: { comment: string }) {
  return <div>{comment}</div>
}

// ✅ GOOD: If you must use HTML, sanitize first
import DOMPurify from 'dompurify'
function UserComment({ comment }: { comment: string }) {
  const sanitized = DOMPurify.sanitize(comment)
  return <div dangerouslySetInnerHTML={{ __html: sanitized }} />
}
```

### URL Validation

```tsx
// Validate URLs before using them
function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

// Use validated URLs
function ExternalLink({
  href,
  children,
}: {
  href: string
  children: React.ReactNode
}) {
  if (!isValidUrl(href)) {
    console.error('Invalid URL:', href)
    return <span>{children}</span>
  }
  return (
    <a href={href} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  )
}
```

## Environment Variables

### Never Commit Secrets

```bash
# ✅ GOOD: .env.local (gitignored)
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_PROJECT_ID=your-project-id

# ❌ BAD: Committed to git
```

### Public vs Private Variables

```tsx
// Vite exposes VITE_* variables to the client
// This is OK - Firebase API keys are designed to be public
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY, // Public - OK
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID, // Public - OK
}

// Never put actual secrets in client code
// const adminKey = import.meta.env.VITE_ADMIN_SECRET // ❌ BAD!
```

## Rate Limiting

### Firestore Rules with Rate Limits

```javascript
// firestore.rules
match /events/{eventId} {
  allow write: if request.auth != null &&
                 request.time > resource.data.lastModified + duration.value(1, 's'); // 1 second between writes
}
```

### Client-Side Debouncing

```tsx
import { useDebounce } from '@/shared/hooks/use-debounce'

// Prevent excessive API calls
function SearchBar() {
  const [searchTerm, setSearchTerm] = useState('')
  const debouncedSearch = useDebounce(searchTerm, 300)

  useEffect(() => {
    if (debouncedSearch) {
      performSearch(debouncedSearch)
    }
  }, [debouncedSearch])

  return (
    <Input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
  )
}
```

## File Uploads

### Validate File Types and Sizes

```tsx
// Client-side validation (UX)
function ImageUpload() {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Check file type
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file')
      return
    }

    // Check file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB')
      return
    }

    uploadImage(file)
  }

  return <input type="file" accept="image/*" onChange={handleFileChange} />
}
```

**Storage rules validation (security):**

```javascript
// storage.rules
match /media/{companyId}/{fileName} {
  allow write: if request.resource.size < 10 * 1024 * 1024 &&
                 request.resource.contentType.matches('image/.*');
}
```

## CORS

### Firebase handles CORS automatically

No manual CORS configuration needed for Firebase services.

For custom APIs, ensure proper CORS headers:

```tsx
// If you have custom API endpoints
const response = await fetch('/api/endpoint', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(data),
})
```

## Security Headers

### Implemented at hosting level

Configure in `firebase.json`:

```json
{
  "hosting": {
    "headers": [
      {
        "source": "**",
        "headers": [
          {
            "key": "X-Content-Type-Options",
            "value": "nosniff"
          },
          {
            "key": "X-Frame-Options",
            "value": "DENY"
          },
          {
            "key": "X-XSS-Protection",
            "value": "1; mode=block"
          }
        ]
      }
    ]
  }
}
```

## Common Vulnerabilities to Avoid

### 1. SQL Injection

✅ Not applicable - using Firestore (NoSQL)

### 2. XSS (Cross-Site Scripting)

✅ Prevented by React's automatic escaping
⚠️ Sanitize if using `dangerouslySetInnerHTML`

### 3. CSRF (Cross-Site Request Forgery)

✅ Firebase handles CSRF protection

### 4. Insecure Direct Object References

✅ Prevented by Firestore security rules

### 5. Sensitive Data Exposure

⚠️ Never log sensitive data
⚠️ Never commit secrets to git

## Security Checklist

Before deploying:

- [ ] All Firestore rules tested and restrictive
- [ ] Storage rules validate file types and sizes
- [ ] No console.log of sensitive data
- [ ] Environment variables properly configured
- [ ] User input sanitized if rendering as HTML
- [ ] External links use `rel="noopener noreferrer"`
- [ ] File uploads validated on client and server
- [ ] No secrets committed to git

## Resources

- **Firebase Security Rules**: https://firebase.google.com/docs/rules
- **OWASP Top 10**: https://owasp.org/www-project-top-ten/
- **DOMPurify**: https://github.com/cure53/DOMPurify
