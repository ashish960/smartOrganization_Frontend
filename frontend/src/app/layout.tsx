"use client";

import { Provider } from "react-redux";
import store from "../store/index";
import "./globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-light-surface dark:bg-dark-surface text-neutral-900 dark:text-neutral-50">
        <Provider store={store}>
          {children}
        </Provider>
      </body>
    </html>
  );
}