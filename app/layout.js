import "./globals.css";

export const metadata = {
  title: "URL Shortener",
  description: "URL 단축 서비스",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
