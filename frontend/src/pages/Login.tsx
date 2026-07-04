import { useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/hooks/useAuth";
import { ROUTES, STORAGE_KEYS } from "@/constants";
import { fetchCurrentUser, loginUser } from "@/api/auth";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const bannerMessage = useMemo(() => {
    const reason = new URLSearchParams(location.search).get("reason");
    if (reason === "session-expired") return "Your session expired. Please sign in again.";
    if (reason === "account-created") return "Your administrator account was created. Sign in to continue.";
    if (reason === "admin-only") return "Only existing administrators can create new dashboard accounts.";
    return "";
  }, [location.search]);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: "" }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setServerError("");

    const nextErrors: Record<string, string> = {};
    if (!form.email.trim()) nextErrors.email = "Email address is required.";
    if (!form.password) nextErrors.password = "Password is required.";

    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }

    try {
      setIsSubmitting(true);
      const tokens = await loginUser({
        email: form.email.trim(),
        password: form.password,
      });

      // Store tokens before calling fetchCurrentUser so the
      // Axios interceptor can attach the Authorization header.
      localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, tokens.access);
      localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, tokens.refresh);

      const user = await fetchCurrentUser();
      const isAdmin = Boolean(user.is_staff || user.role === "admin");
      login(user, tokens.access, tokens.refresh, isAdmin);
      const redirectTo = (location.state as { from?: string } | null)?.from ?? ROUTES.DASHBOARD;
      navigate(redirectTo, { replace: true });
    } catch {
      setServerError("Unable to sign in with those credentials.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h2 className="text-2xl font-semibold text-gray-900">Welcome back</h2>
        <p className="text-sm text-gray-600">Sign in to manage the Semper Lights dashboard.</p>
      </div>

      {bannerMessage ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700" role="status">
          {bannerMessage}
        </div>
      ) : null}

      <form className="space-y-4" onSubmit={handleSubmit}>
        <Input
          label="Email Address"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="Enter your email address"
          value={form.email}
          onChange={handleChange}
          error={errors.email}
        />

        <Input
          label="Password"
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="Enter your password"
          value={form.password}
          onChange={handleChange}
          error={errors.password}
        />

        {serverError ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
            {serverError}
          </div>
        ) : null}

        <Button type="submit" isFullWidth isLoading={isSubmitting}>
          Sign in
        </Button>
      </form>

      <p className="text-center text-sm text-gray-600">
        Don&rsquo;t have an administrator account?{" "}
        <Link to={ROUTES.REGISTER} className="font-medium text-amber-600 hover:text-amber-700">
          Register
        </Link>
      </p>
    </div>
  );
}