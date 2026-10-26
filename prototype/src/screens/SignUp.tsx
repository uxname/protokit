// docc: auth#^sign-up

import { Link, Navigate, useNavigate } from "@tanstack/react-router";
import { MessagesSquare } from "lucide-react";
import { type FC, type FormEvent, useState } from "react";
import { useMutation } from "urql";
import {
  ConfirmSignUpDocument,
  StartSignUpDocument,
} from "@/generated/graphql";
import { errorText, now, Req, useNow, useSession } from "@/kit";
import { CODE_LENGTH, PASSWORD_MIN_LENGTH, RESEND_SECONDS } from "@/spec";
import { Button } from "@/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/ui/card";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/ui/field";
import { Input } from "@/ui/input";
import { Spinner } from "@/ui/spinner";

export const SignUp: FC = () => {
  const token = useSession((s) => s.token);
  const setToken = useSession((s) => s.setToken);
  const navigate = useNavigate();
  const [{ fetching: starting }, start] = useMutation(StartSignUpDocument);
  const [{ fetching: confirming }, confirm] = useMutation(
    ConfirmSignUpDocument,
  );
  const [step, setStep] = useState<"form" | "code">("form");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  // A new code may be asked for after RESEND_SECONDS of world time: the panel's clock ends it too.
  const [resendAt, setResendAt] = useState(0);
  const wait = Math.min(
    RESEND_SECONDS,
    Math.max(0, Math.ceil((resendAt - useNow(1000)) / 1000)),
  );

  if (token) return <Navigate to="/" replace />;

  const short = password.length > 0 && password.length < PASSWORD_MIN_LENGTH;

  const submitForm = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    const result = await start({ name, email, password });
    if (result.error) return setError(errorText(result.error));
    setStep("code");
    setResendAt(now() + RESEND_SECONDS * 1000);
  };

  const submitCode = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    const result = await confirm({ email, code });
    if (result.error || !result.data)
      return setError(
        result.error ? errorText(result.error) : "Couldn't confirm.",
      );
    setToken(result.data.confirmSignUp);
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
        {step === "form" ? (
          <>
            <CardHeader className="text-center">
              <CardTitle className="text-xl">Create an account</CardTitle>
              <CardDescription>
                We'll email you a code to confirm it
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Req to="auth#^sign-up">
                <form onSubmit={submitForm} noValidate>
                  <FieldGroup>
                    <Field>
                      <FieldLabel htmlFor="name">Name</FieldLabel>
                      <Input
                        id="name"
                        autoComplete="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                      />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="email">Email</FieldLabel>
                      <Input
                        id="email"
                        type="email"
                        autoComplete="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </Field>
                    <Field data-invalid={short || undefined}>
                      <FieldLabel htmlFor="password">Password</FieldLabel>
                      <Input
                        id="password"
                        type="password"
                        autoComplete="new-password"
                        value={password}
                        aria-invalid={short || undefined}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                      <FieldDescription>
                        At least {PASSWORD_MIN_LENGTH} characters
                      </FieldDescription>
                    </Field>
                    {error && <FieldError>{error}</FieldError>}
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={
                        starting ||
                        !name.trim() ||
                        !email ||
                        password.length < PASSWORD_MIN_LENGTH
                      }
                    >
                      {starting && <Spinner />} Get a code
                    </Button>
                  </FieldGroup>
                </form>
              </Req>
            </CardContent>
          </>
        ) : (
          <>
            <CardHeader className="text-center">
              <CardTitle className="text-xl">Check your email</CardTitle>
              <CardDescription>
                We sent a {CODE_LENGTH}-digit code to{" "}
                <span className="font-medium text-foreground">{email}</span>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={submitCode} noValidate>
                <FieldGroup>
                  <Field data-invalid={Boolean(error) || undefined}>
                    <FieldLabel htmlFor="code">Code from the email</FieldLabel>
                    <Input
                      id="code"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      maxLength={CODE_LENGTH}
                      className="text-center text-lg tracking-[0.5em] tabular-nums text-foreground"
                      value={code}
                      aria-invalid={Boolean(error) || undefined}
                      onChange={(e) =>
                        setCode(e.target.value.replace(/\D/g, ""))
                      }
                    />
                    {error && <FieldError>{error}</FieldError>}
                  </Field>
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={confirming || code.length !== CODE_LENGTH}
                  >
                    {confirming && <Spinner />} Confirm
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    disabled={wait > 0 || starting}
                    onClick={async () => {
                      setError("");
                      setCode("");
                      const result = await start({ name, email, password });
                      if (result.error)
                        return setError(errorText(result.error));
                      setResendAt(now() + RESEND_SECONDS * 1000);
                    }}
                  >
                    {wait > 0
                      ? `Send the code again in ${wait} s`
                      : "Send the code again"}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full"
                    onClick={() => setStep("form")}
                  >
                    Change the email
                  </Button>
                </FieldGroup>
              </form>
            </CardContent>
          </>
        )}
      </Card>
      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link
          to="/sign-in"
          className="font-medium text-foreground underline underline-offset-4"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
};
