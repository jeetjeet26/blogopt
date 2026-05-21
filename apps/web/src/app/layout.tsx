import type { Metadata } from "next";
import "./styles.css";

export const metadata: Metadata = {
  title: "P11 Buzz Optimizer",
  description: "Internal SEO and GEO optimizer for P11creative blog content."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <main className="shell">{children}</main>
      </body>
    </html>
  );
}
