export const metadata = {
  title: 'AI Chatbot',
  description: 'An extremely minimal AI chatbot powered by Google Gemini and Next.js.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0 }}>{children}</body>
    </html>
  );
}
