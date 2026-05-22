"use client";

import { useEffect, useState } from "react";

const POST_LOGIN_SHUTTER_KEY = "show_post_login_shutter";

export function markPostLoginShutter() {
  sessionStorage.setItem(POST_LOGIN_SHUTTER_KEY, "true");
}

export default function PostLoginShutter() {
  const [isVisible, setIsVisible] = useState(() => {
    if (typeof window === "undefined") return false;
    return sessionStorage.getItem(POST_LOGIN_SHUTTER_KEY) === "true";
  });

  useEffect(() => {
    if (!isVisible) return;

    sessionStorage.removeItem(POST_LOGIN_SHUTTER_KEY);

    const timeoutId = window.setTimeout(() => {
      setIsVisible(false);
    }, 2100);

    return () => window.clearTimeout(timeoutId);
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div className="post-login-shutter" aria-label="Cargando panel">
      <div className="post-login-shutter__sign">
        <span>BookFlow</span>
      </div>
      <div className="post-login-shutter__door">
        <div className="post-login-shutter__handle" />
      </div>
      <p className="post-login-shutter__text">Abriendo tu espacio...</p>
    </div>
  );
}
