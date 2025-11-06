import type {Metadata, Viewport} from "next";
import "./globals.css";
import CookieConsent from "@/components/Cookies";
import {AppRouterCacheProvider} from '@mui/material-nextjs/v15-appRouter';
import {Inter} from 'next/font/google';
import {ThemeProvider} from '@mui/material/styles';
import theme from "../theme"

const APP_NAME = process.env.NEXT_PUBLIC_PRODUCTNAME!;
const APP_DEFAULT_TITLE = process.env.NEXT_PUBLIC_PRODUCTNAME!;
const APP_TITLE_TEMPLATE = "%s - PWA";
const APP_DESCRIPTION = "An Electrical Outage Reporting Platform";


const inter = Inter({
  weight: ['300', '400', '500', '700'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

export const metadata: Metadata = {
  applicationName: APP_NAME,
  title: {
    default: APP_DEFAULT_TITLE,
    template: APP_TITLE_TEMPLATE,
  },
  description: APP_DESCRIPTION,
  manifest: "./manifest.ts",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: APP_DEFAULT_TITLE,
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: APP_NAME,
    title: {
      default: APP_DEFAULT_TITLE,
      template: APP_TITLE_TEMPLATE,
    },
    description: APP_DESCRIPTION,
  },
};

export const viewport: Viewport = {
  themeColor: "#FFFFFF",
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
  // const gaID = process.env.NEXT_PUBLIC_GOOGLE_TAG;
  return (
    <html lang="en" className={inter.variable}>
    <body>
    <AppRouterCacheProvider>
      <ThemeProvider theme={theme}>
        {children}
      </ThemeProvider>
    </AppRouterCacheProvider>
    {/*<Analytics />*/}
    <CookieConsent/>
    {/* {gaID && (
      <GoogleAnalytics gaId={gaID}/>
    )} */}
    </body>
    </html>
  );
}
