// docc: auth#^pjds@fz63, auth#^ayqz@uasp ~6dqc

import { Link, Navigate, useNavigate } from "@tanstack/react-router";
import { MessagesSquare } from "lucide-react";
import { type FC, type FormEvent, useState } from "react";
import { useMutation } from "urql";
import { SignInDocument } from "@/generated/graphql";
import { errorText, Req, useSession } from "@/kit";
import { Button } from "@/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/ui/card";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/ui/field";
import { Input } from "@/ui/input";
import { Spinner } from "@/ui/spinner";

export const SignIn: FC = () => {
  const token = useSession((s) => s.token);
  const setToken = useSession((s) => s.setToken);
  const navigate = useNavigate();
  const [{ fetching }, signIn] = useMutation(SignInDocument);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  if (token) return <Navigate to="/" replace />;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    const result = await signIn({ email, password });
    if (result.error || !result.data) {
      // The e-mail stays in its field; only the password is asked again.
      setPassword("");
      setError(result.error ? errorText(result.error) : "Couldn't sign in.");
      return;
    }
    setToken(result.data.signIn);
    void navigate({ to: "/" });
  };

  return (
    <div className="flex min-h-dvh flex-col items-center gap-6 bg-muted p-6 pt-[12vh] md:p-10 md:pt-[14vh]">
      <div className="flex items-center gap-2 font-semibold">
        <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <MessagesSquare className="size-4" />
        </span>
        Family chat
      </div>
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Welcome back</CardTitle>
          <CardDescription>
            Sign in with your email and password
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Req to="auth#^pjds">
            <form onSubmit={submit} noValidate>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="email">Email</FieldLabel>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </Field>
                <Field data-invalid={Boolean(error) || undefined}>
                  <FieldLabel htmlFor="password">Password</FieldLabel>
                  <Input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    aria-invalid={Boolean(error) || undefined}
                    aria-describedby={error ? "password-error" : undefined}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  {error && (
                    <Req to="auth#^ayqz">
                      <FieldError id="password-error">{error}</FieldError>
                    </Req>
                  )}
                </Field>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={fetching || !email || !password}
                >
                  {fetching && <Spinner />} Sign in
                </Button>
              </FieldGroup>
            </form>
          </Req>
        </CardContent>
      </Card>
      <p className="text-center text-sm text-muted-foreground">
        No account yet?{" "}
        <Link
          to="/sign-up"
          className="font-medium text-foreground underline underline-offset-4"
        >
          Sign up
        </Link>
      </p>
    </div>
  );
};
