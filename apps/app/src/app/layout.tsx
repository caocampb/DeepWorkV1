export const metadata = {
  title: 'Deep Work Scheduler',
  description: 'Plan your day for maximum productivity',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
} 