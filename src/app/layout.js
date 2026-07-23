import '../index.css';

export const metadata = {
  title: 'PathAI - AI-Powered Learning Assistant',
  description: 'AI-powered learning companion for AI/ML students with roadmap generation, doubt-solving chat, code debugger, and ATS resume scorer.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
