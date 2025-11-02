import type { Metadata } from "next";
import "./globals.css";
import { Analytics } from '@vercel/analytics/next';
import CookieConsent from "@/components/Cookies";
import { GoogleAnalytics } from '@next/third-parties/google'
import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';
import { Inter } from 'next/font/google';
import { ThemeProvider } from '@mui/material/styles';
import theme from "../theme"

const inter = Inter({
	weight: ['300', '400', '500', '700'],
	subsets: ['latin'],
	display: 'swap',
	variable: '--font-inter',
})

export const metadata: Metadata = {
  title: process.env.NEXT_PUBLIC_PRODUCTNAME,
  description: "An Electrical Outage Reporting Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // let theme = process.env.NEXT_PUBLIC_THEME
  // if(!theme) {
  //   theme = "theme-sass3"
  // }
  const gaID = process.env.NEXT_PUBLIC_GOOGLE_TAG;
  return (
    <html lang="en" className={inter.variable}>
    <body>
        <AppRouterCacheProvider>
	        <ThemeProvider theme={theme}>
		        {children}
	        </ThemeProvider>
        </AppRouterCacheProvider>
      <Analytics />
      <CookieConsent />
      { gaID && (
          <GoogleAnalytics gaId={gaID}/>
      )}

    </body>
    </html>
  );
}
