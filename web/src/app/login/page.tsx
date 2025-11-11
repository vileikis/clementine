import { Suspense } from "react";
import LoginForm from "./login-form";

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginPageSkeleton />}>
      <LoginForm />
    </Suspense>
  );
}

function LoginPageSkeleton() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold md:text-3xl">Admin Login</h1>
          <p className="mt-2 text-sm text-muted-foreground md:text-base">
            Enter your admin password to continue
          </p>
        </div>
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="h-4 w-20 animate-pulse rounded bg-muted" />
            <div className="h-[44px] w-full animate-pulse rounded bg-muted" />
          </div>
          <div className="h-[44px] w-full animate-pulse rounded bg-muted" />
        </div>
      </div>
    </div>
  );
}
