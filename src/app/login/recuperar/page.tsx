"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";

export default function RecuperarPage() {
  type Paso = "email" | "codigo" | "password";

  const [paso, setPaso] = useState<Paso>("email");
  const [email, setEmail] = useState("");
  const [codigoBoxes, setCodigoBoxes] = useState<string[]>([
    "",
    "",
    "",
    "",
    "",
    "",
  ]);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [mostrarConfirm, setMostrarConfirm] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [reenviando, setReenviando] = useState(false);
  const [segundosReenvio, setSegundosReenvio] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [exito, setExito] = useState(false);
  const codigoRefs = useRef<(HTMLInputElement | null)[]>([]);

  function validarEmail(email: string) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = sessionStorage.getItem("login_email");
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (saved) setEmail(saved);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined" && email) {
      sessionStorage.setItem("login_email", email);
    }
  }, [email]);

  useEffect(() => {
    if (segundosReenvio > 0) {
      const timer = setTimeout(
        () => setSegundosReenvio(segundosReenvio - 1),
        1000,
      );
      return () => clearTimeout(timer);
    }
  }, [segundosReenvio]);

  async function enviarCodigo(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!validarEmail(email)) {
      setError("Ingresa un correo válido.");
      return;
    }

    setCargando(true);

    // Validar que el correo existe en el sistema
    const checkRes = await fetch("/api/auth/check-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const { exists } = await checkRes.json();

    if (!exists) {
      setCargando(false);
      setError("No existe una cuenta con ese correo. Registrate primero.");
      return;
    }

    // Enviar código de 6 dígitos vía API personalizada
    const res = await fetch("/api/otp/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, purpose: "recovery" }),
    });
    const result = await res.json();

    setCargando(false);

    if (!res.ok) {
      if (result.error?.includes("rate") || result.error?.includes("límite")) {
        setSegundosReenvio(60);
        setPaso("codigo");
        return;
      }
      setError(
        result.error || "No se pudo enviar el código. Intenta de nuevo.",
      );
      return;
    }

    setPaso("codigo");
    setSegundosReenvio(60);
  }

  async function reenviarCodigo() {
    if (segundosReenvio > 0) return;
    setReenviando(true);
    setError(null);

    const res = await fetch("/api/otp/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, purpose: "recovery" }),
    });
    const result = await res.json();

    setReenviando(false);

    if (!res.ok) {
      if (result.error?.includes("rate") || result.error?.includes("límite")) {
        setSegundosReenvio(60);
        return;
      }
      setError(result.error || "No se pudo reenviar el código.");
      return;
    }

    setSegundosReenvio(60);
  }

  async function verificarCodigo(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const codigoCombinado = codigoBoxes.join("");

    if (codigoCombinado.length < 6) {
      setError("Ingresá el código de 6 dígitos.");
      return;
    }

    setCargando(true);

    const res = await fetch("/api/otp/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, code: codigoCombinado }),
    });
    const result = await res.json();

    setCargando(false);

    if (!res.ok || !result.ok) {
      setError(
        result.error ||
          "Código inválido o expirado. Verificá el código e intenta de nuevo.",
      );
      return;
    }

    if (result.user_id) {
      setUserId(result.user_id);
    }

    setPaso("password");
  }

  async function resetPassword(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setCargando(true);

    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId, password }),
    });
    const result = await res.json();

    setCargando(false);

    if (!res.ok) {
      setError(
        result.error || "No se pudo cambiar la contraseña. Intenta de nuevo.",
      );
      return;
    }

    setExito(true);
  }

  return (
    <>
      <main
        suppressHydrationWarning
        className="relative flex min-h-screen items-center justify-center bg-[#F7F8FA] px-4"
      >
        <Link
          href={paso === "email" ? "/login" : "#"}
          onClick={
            paso !== "email"
              ? (e) => {
                  e.preventDefault();
                  setPaso((p) => (p === "password" ? "codigo" : "email"));
                }
              : undefined
          }
          className="absolute top-6 left-6 flex items-center gap-1 text-sm text-gray-600 hover:text-gray-800"
        >
          {paso === "email" ? "← Volver al inicio" : "← Atrás"}
        </Link>
        <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm ring-1 ring-black/5">
          <div className="mb-6 flex justify-center">
            <img
              src="/logo-rizoma.svg"
              alt="Desarrollo de Líderes y Equipo"
              className="h-14 w-auto"
            />
          </div>

          {/* Step indicator */}
          <div className="mb-6 flex items-center justify-center gap-1.5">
            <div
              className={`h-2 w-8 rounded-full ${paso === "email" ? "bg-[#1F4E79]" : "bg-gray-200"}`}
            />
            <div
              className={`h-2 w-8 rounded-full ${paso === "codigo" ? "bg-[#1F4E79]" : "bg-gray-200"}`}
            />
            <div
              className={`h-2 w-8 rounded-full ${paso === "password" ? "bg-[#1F4E79]" : "bg-gray-200"}`}
            />
          </div>

          {/* Step 1: Email */}
          {paso === "email" && (
            <>
              <h1 className="text-2xl font-semibold text-[#1F2937]">
                Recuperar contraseña
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Ingresa tu correo y te enviaremos un código de 6 dígitos para
                restablecer tu contraseña.
              </p>

              <form onSubmit={enviarCodigo} className="mt-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Correo
                  </label>
                  <input
                    required
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-black focus:border-[#1F4E79] focus:outline-none focus:ring-1 focus:ring-[#1F4E79]"
                    placeholder="tu@correo.com"
                  />
                </div>

                <button
                  type="submit"
                  disabled={cargando || !email}
                  className="w-full rounded-lg bg-[#1F4E79] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#173A5C] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {cargando ? "Enviando…" : "Enviar código"}
                </button>
              </form>
            </>
          )}

          {/* Step 2: Code */}
          {paso === "codigo" && (
            <>
              <h1 className="text-2xl font-semibold text-[#1F2937]">
                Verificar código
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Ingresa el código de 6 dígitos que enviamos a{" "}
                <span className="font-medium text-[#1F2937]">{email}</span>.
              </p>

              <form onSubmit={verificarCodigo} className="mt-6 space-y-4">
                <div>
                  <label className="block text-center text-sm font-medium text-gray-700">
                    Código de verificación
                  </label>
                  <div className="mt-1 flex items-center justify-center gap-2">
                    {codigoBoxes.map((digit, idx) => (
                      <input
                        key={idx}
                        id={`codigo-${idx}`}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => {
                          const val = e.target.value
                            .replace(/\D/g, "")
                            .slice(0, 1);
                          const newBoxes = [...codigoBoxes];
                          newBoxes[idx] = val;
                          setCodigoBoxes(newBoxes);
                          if (val && idx < 5) {
                            codigoRefs.current[idx + 1]?.focus();
                          }
                          if (
                            val &&
                            newBoxes.join("").length === 6 &&
                            idx === 5
                          ) {
                            setTimeout(() => {
                              const form = e.target.closest("form");
                              form?.requestSubmit();
                            }, 150);
                          }
                        }}
                        onKeyDown={(e) => {
                          if (
                            e.key === "Backspace" &&
                            !codigoBoxes[idx] &&
                            idx > 0
                          ) {
                            codigoRefs.current[idx - 1]?.focus();
                          }
                        }}
                        onPaste={(e) => {
                          const paste = e.clipboardData
                            .getData("text")
                            .replace(/\D/g, "")
                            .slice(0, 6 - idx);
                          if (paste) {
                            e.preventDefault();
                            const newBoxes = [...codigoBoxes];
                            for (let i = 0; i < paste.length; i++) {
                              if (idx + i < 6) {
                                newBoxes[idx + i] = paste[i];
                              }
                            }
                            setCodigoBoxes(newBoxes);
                            if (newBoxes.join("").length === 6) {
                              setTimeout(() => {
                                const form = e.currentTarget.closest("form");
                                form?.requestSubmit();
                              }, 150);
                            } else {
                              const lastIdx = Math.min(
                                idx + paste.length - 1,
                                5,
                              );
                              codigoRefs.current[lastIdx]?.focus();
                            }
                          }
                        }}
                        ref={(el) => {
                          codigoRefs.current[idx] = el;
                        }}
                        className="h-12 w-10 rounded-lg border border-gray-300 text-center text-xl font-medium text-black focus:border-[#1F4E79] focus:outline-none focus:ring-1 focus:ring-[#1F4E79]"
                      />
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={cargando || codigoBoxes.join("").length < 6}
                  className="w-full rounded-lg bg-[#1F4E79] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#173A5C] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {cargando ? "Verificando…" : "Verificar código"}
                </button>

                <button
                  type="button"
                  onClick={reenviarCodigo}
                  disabled={reenviando || segundosReenvio > 0}
                  className="w-full text-center text-sm text-[#1F4E79] hover:underline disabled:text-gray-400 disabled:no-underline"
                >
                  {reenviando
                    ? "Reenviando…"
                    : segundosReenvio > 0
                      ? `Reenviar código (${segundosReenvio}s)`
                      : "Reenviar código"}
                </button>
              </form>
            </>
          )}

          {/* Step 3: New password */}
          {paso === "password" && (
            <>
              <h1 className="text-2xl font-semibold text-[#1F2937]">
                Nueva contraseña
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Ingresa tu nueva contraseña. Debe tener al menos 8 caracteres.
              </p>

              <form onSubmit={resetPassword} className="mt-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Nueva contraseña
                  </label>
                  <div className="relative">
                    <input
                      required
                      type={mostrarPassword ? "text" : "password"}
                      minLength={8}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 pr-10 text-sm text-black focus:border-[#1F4E79] focus:outline-none focus:ring-1 focus:ring-[#1F4E79]"
                      placeholder="Mínimo 8 caracteres"
                    />
                    <button
                      type="button"
                      onClick={() => setMostrarPassword(!mostrarPassword)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-gray-700"
                      aria-label={
                        mostrarPassword
                          ? "Ocultar contraseña"
                          : "Mostrar contraseña"
                      }
                    >
                      {mostrarPassword ? (
                        <svg
                          className="h-5 w-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13.875 18.125A7.5 7.5 0 016 12c0-1.276.312-2.46.844-3.485M9.88 9.88l4.235 4.235M9.88 9.88L6.515 6.515M15.5 12a3.5 3.5 0 11-4.95 0 3.5 3.5 0 014.95 0z"
                          />
                        </svg>
                      ) : (
                        <svg
                          className="h-5 w-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M2.06 12C3.13 8.66 6.31 6 12 6c1.51 0 2.91.32 4.12.91M12 18c-1.11 0-2.1-.18-3.02-.47M9.88 5.06L6.52 8.42m9.06 9.06 3.4 3.4M12 15a3 3 0 100-6 3 3 0 000 6z"
                          />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Confirmar contraseña
                  </label>
                  <div className="relative">
                    <input
                      required
                      type={mostrarConfirm ? "text" : "password"}
                      minLength={8}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 pr-10 text-sm text-black focus:border-[#1F4E79] focus:outline-none focus:ring-1 focus:ring-[#1F4E79]"
                      placeholder="Repite la contraseña"
                    />
                    <button
                      type="button"
                      onClick={() => setMostrarConfirm(!mostrarConfirm)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-gray-700"
                      aria-label={
                        mostrarConfirm
                          ? "Ocultar contraseña"
                          : "Mostrar contraseña"
                      }
                    >
                      {mostrarConfirm ? (
                        <svg
                          className="h-5 w-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13.875 18.125A7.5 7.5 0 016 12c0-1.276.312-2.46.844-3.485M9.88 9.88l4.235 4.235M9.88 9.88L6.515 6.515M15.5 12a3.5 3.5 0 11-4.95 0 3.5 3.5 0 014.95 0z"
                          />
                        </svg>
                      ) : (
                        <svg
                          className="h-5 w-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M2.06 12C3.13 8.66 6.31 6 12 6c1.51 0 2.91.32 4.12.91M12 18c-1.11 0-2.1-.18-3.02-.47M9.88 5.06L6.52 8.42m9.06 9.06 3.4 3.4M12 15a3 3 0 100-6 3 3 0 000 6z"
                          />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={cargando}
                  className="w-full rounded-lg bg-[#1F4E79] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#173A5C] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {cargando ? "Cambiando…" : "Cambiar contraseña"}
                </button>
              </form>
            </>
          )}

          {error && paso !== "password" && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-6 w-6 text-red-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0018 0z"
                      />
                    </svg>
                  </div>
                  <p className="text-sm text-gray-700">{error}</p>
                </div>
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={() => setError(null)}
                    className="rounded-lg bg-[#1F4E79] px-6 py-2.5 text-sm font-medium text-white transition hover:bg-[#173A5C]"
                  >
                    Entendido
                  </button>
                </div>
              </div>
            </div>
          )}

          {paso === "email" && (
            <p className="mt-6 text-center text-sm text-gray-500">
              ¿Ya tienes cuenta?{" "}
              <Link
                href="/login"
                className="font-medium text-[#1F4E79] hover:underline"
              >
                Inicia sesión
              </Link>
            </p>
          )}

          {exito && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-6 w-6 text-green-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m5.618-4.016A11.967 11.967 0 0110 20a12 12 0 110-24 12 12 0 012.618 19.994z"
                      />
                    </svg>
                  </div>
                  <p className="text-sm text-gray-700">
                    Tu contraseña se ha restablecido correctamente. Ya puedes
                    iniciar sesión con tu nueva contraseña.
                  </p>
                </div>
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={() => (window.location.href = "/login")}
                    className="rounded-lg bg-[#1F4E79] px-6 py-2.5 text-sm font-medium text-white transition hover:bg-[#173A5C]"
                  >
                    Ir a iniciar sesión
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
