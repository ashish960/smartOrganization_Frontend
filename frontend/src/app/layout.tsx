"use client";

import { Provider } from "react-redux";
import store from "../store/index";
import "./globals.css";
import { ToastProvider } from "@/context/ToastContext";
import { ThemeProvider } from "next-themes";

import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";

function AuthInitializer({ children }: { children: React.ReactNode }) {
  const { restoreAuthFromStorage } = useAuth();
  
  useEffect(() => {
    restoreAuthFromStorage();
  }, []);

  return <>{children}</>;
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Provider store={store}>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <AuthInitializer>
              <ToastProvider>
                {children}
              </ToastProvider>
            </AuthInitializer>
          </ThemeProvider>
        </Provider>
      </body>
    </html>
  );
}