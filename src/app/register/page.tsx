import { AuthForm } from "@/components/auth/AuthForm";

export default function RegisterPage() {
  return (
    <main className="grid min-h-screen place-items-center p-6">
      <AuthForm mode="register" />
    </main>
  );
}
