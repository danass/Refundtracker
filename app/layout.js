import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from 'sonner';
import LayoutShell from './components/LayoutShell';

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Reflow',
  description: 'Gestion des remboursements',
}

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body className={inter.className}>
        <LayoutShell>{children}</LayoutShell>
        <Toaster richColors closeButton position="bottom-right" />
      </body>
    </html>
  );
}
