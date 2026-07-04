import { useState, type ChangeEvent, type FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { LoadingScreen } from "@/components/ui/Loading";
import { registerUser } from "@/api/auth";
import { ROUTES } from "@/constants";
import { useAuth } from "@/hooks/useAuth";

export default function Register() {
  const navigate = useNavigate();
  const { isAuthenticated, isAdmin, isLoading } = useAuth();
  const [form, setForm] = useState({
    username: "",
    email: "",
    first_name: "",
    last_name: "",
    password: "",
    password_confirm: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to={`${ROUTES.LOGIN}?reason=admin-only`} replace />;
  }

  if (!isAdmin) {
    return <Navigate to={ROUTES.HOME} replace />;
  }

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: "" }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setServerError("");

    const nextErrors: Record<string, string> = {};
    if (!form.username.trim()) nextErrors.username = "Username is required.";
    if (!form.email.trim()) nextErrors.email = "Email is required.";
    if (!form.password) nextErrors.password = "Password is required.";
    if (form.password.length < 8) nextErrors.password = "Password must be at least 8 characters.";
    if (!form.password_confirm) nextErrors.password_confirm = "Please confirm your password.";
    if (form.password && form.password_confirm && form.password !== form.password_confirm) {
      nextErrors.password_confirm = "Passwords do not match.";
    }

    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }

    try {
      setIsSubmitting(true);
      await registerUser({
        username: form.username.trim(),
        email: form.email.trim(),
        password: form.password,
        password_confirm: form.password_confirm,
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
      });
      navigate(`${ROUTES.LOGIN}?reason=account-created`, { replace: true });
    } catch {
      setServerError("We could not create the account. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h2 className="text-2xl font-semibold text-gray-900">Create admin access</h2>
        <p className="text-sm text-gray-600">Only existing administrators can create a new dashboard account.</p>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="First name"
            name="first_name"
            placeholder="Ada"
            value={form.first_name}
            onChange={handleChange}
          />
          <Input
            label="Last name"
            name="last_name"
            placeholder="Lovelace"
            value={form.last_name}
            onChange={handleChange}
          />
        </div>

        <Input
          label="Username"
          name="username"
          autoComplete="username"
          placeholder="Choose a username"
          value={form.username}
          onChange={handleChange}
          error={errors.username}
        />

        <Input
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={form.email}
          onChange={handleChange}
          error={errors.email}
        />

        <Input
          label="Password"
          name="password"
          type="password"
          autoComplete="new-password"
          placeholder="At least 8 characters"
          value={form.password}
          onChange={handleChange}
          error={errors.password}
        />

        <Input
          label="Confirm password"
          name="password_confirm"
          type="password"
          autoComplete="new-password"
          placeholder="Repeat your password"
          value={form.password_confirm}
          onChange={handleChange}
          error={errors.password_confirm}
        />

        {serverError ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
            {serverError}
          </div>
        ) : null}

        <Button type="submit" isFullWidth isLoading={isSubmitting}>
          Create account
        </Button>
      </form>

      <p className="text-center text-sm text-gray-600">
        Already have access?{' '}
        <Link to={ROUTES.LOGIN} className="font-medium text-amber-600 hover:text-amber-700">
          Sign in
        </Link>
      </p>
    </div>
  );
}