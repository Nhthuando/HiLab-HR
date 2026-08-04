import type { Metadata } from "next";
import { SessionProvider } from "@/components/SessionProvider";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import "./globals.css";

export const metadata: Metadata = {
  title: "HiLab HR — AI CV Screening & Candidate Evaluation System",
  description: "Hệ thống AI lọc CV, chấm điểm ứng viên và gợi ý câu hỏi phỏng vấn tự động dựa trên Job Description (JD). Dành cho HR Back Office.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className="dark" suppressHydrationWarning>
      <body className="flex flex-col min-h-screen bg-zinc-950 text-zinc-100 antialiased" suppressHydrationWarning>
        <SessionProvider>
          <Navbar />
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </main>
          <Footer />
        </SessionProvider>
      </body>
    </html>
  );
}
