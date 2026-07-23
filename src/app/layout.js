import '../index.css';

export const metadata = {
  title: 'PathAI — AI/ML Learning Platform | ACT AI Final Project',
  description: 'PathAI is a full-stack AI/ML learning companion — final project for the ACT AI Course, Government of Pakistan. Features TF-IDF ATS resume scoring, AI roadmaps, doubt-solving chat, and progress analytics.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
