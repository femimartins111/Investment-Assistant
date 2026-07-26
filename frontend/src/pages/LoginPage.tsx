import { FormEvent, useState } from "react";

interface LoginPageProps {
  onLogin: (username: string) => void;
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();

    const cleanedUsername = username.trim();

    if (cleanedUsername.length < 2) {
      setError("Enter a username with at least 2 characters.");
      return;
    }

    setError("");
    onLogin(cleanedUsername);
  }

  return (
    <main className="page-center">
      <section className="auth-card">
        <p className="eyebrow">Local portfolio account</p>
        <h1>Enter your username</h1>
        <p className="muted-text">
          This is not real authentication. It only separates saved CSV uploads on your computer for
          the portfolio demo.
        </p>

        <form className="form-stack" onSubmit={handleSubmit}>
          <label htmlFor="username">Username</label>
          <input
            id="username"
            type="text"
            placeholder="Example: femi"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
          />

          {error && <p className="error-text">{error}</p>}

          <button className="primary-button full-width" type="submit">
            Continue
          </button>
        </form>
      </section>
    </main>
  );
}
