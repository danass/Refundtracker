import { Inter } from 'next/font/google'
import './globals.css'
import DashboardLayout from './components/DashboardLayout'
// import { Toaster } from "./components/ui/toaster" // Old toaster
import { Toaster as SonnerToaster } from 'sonner'; // New sonner toaster

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Refund Management System',
  description: 'Internal tool for managing refund requests',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <DashboardLayout>
          {children}
        </DashboardLayout>
        <SonnerToaster richColors closeButton /> {/* Use SonnerToaster */}
      </body>
    </html>
  )
} 