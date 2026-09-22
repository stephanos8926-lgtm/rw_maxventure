import type {Metadata} from 'next';
import './globals.css'; // Global styles

export const metadata: Metadata = {
  title: 'Paperclip Enterprise Simulator',
  description: 'Autonomous multi-agent enterprise orchestration platform where users act as CEO, bootstrapping a virtual company from concept to execution with AI agents.',
  openGraph: {
    title: 'Paperclip Enterprise Simulator',
    description: 'Autonomous multi-agent enterprise orchestration platform where users act as CEO, bootstrapping a virtual company from concept to execution with AI agents.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Paperclip Enterprise Simulator',
    description: 'Autonomous multi-agent enterprise orchestration platform where users act as CEO, bootstrapping a virtual company from concept to execution with AI agents.',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
