"use client";

import { Provider } from "react-redux";
import store from "../store/index";
import "./globals.css";
import { ToastProvider } from "@/context/ToastContext";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Provider store={store}>
          <ToastProvider>
            {children}
          </ToastProvider>
        </Provider>
      </body>
    </html>
  );
}