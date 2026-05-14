import "./globals.css";
import Providers from "./Providers";

export const metadata = {
  title: "SmartOrg AI",
  description: "Enterprise AI Knowledge Assistant",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}