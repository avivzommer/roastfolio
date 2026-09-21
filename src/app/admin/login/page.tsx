import { redirect } from "next/navigation";
import { Input } from "@/components/ui/input";
import { loginAdmin } from "@/lib/actions";
import { isAdmin } from "@/lib/auth";
import { Shield } from "lucide-react";

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  if (await isAdmin()) {
    redirect("/admin/history");
  }
  const { error } = await searchParams;

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-6 py-16">
      <div className="text-center">
        <div
          className="mx-auto flex size-14 items-center justify-center rounded-full"
          style={{
            background: "var(--m3-secondary-container)",
            color: "var(--m3-on-secondary-container)",
          }}
        >
          <Shield className="size-5" />
        </div>
        <h1
          className="mt-5 text-[28px] font-bold tracking-tight"
          style={{ color: "var(--on-surface)" }}
        >
          Admin
        </h1>
        <p
          className="mt-2.5 text-sm"
          style={{ color: "var(--on-surface-variant)" }}
        >
          Enter the admin password to view review history.
        </p>
      </div>

      <form action={loginAdmin} className="mt-8 space-y-4">
        <div className="space-y-1.5">
          <label
            htmlFor="password"
            className="block text-[11px] font-bold tracking-wide uppercase"
            style={{ color: "var(--on-surface-variant)" }}
          >
            Password
          </label>
          <Input
            id="password"
            name="password"
            type="password"
            placeholder="••••"
            autoComplete="current-password"
            required
            autoFocus
            style={{
              background: "var(--s-lowest)",
              borderColor: "var(--outline-variant)",
              height: 52,
              borderRadius: "var(--r-full)",
              paddingLeft: 22,
              paddingRight: 22,
              fontSize: 15,
            }}
          />
        </div>
        {error && (
          <div
            className="rounded-[var(--r-md)] px-4 py-3 text-sm"
            style={{
              background: "var(--rt-needswork-bg)",
              color: "var(--rt-needswork)",
            }}
          >
            {error}
          </div>
        )}
        <button type="submit" className="m3-btn m3-btn--primary m3-btn--lg w-full" style={{ width: "100%" }}>
          Sign in
        </button>
      </form>
    </main>
  );
}
