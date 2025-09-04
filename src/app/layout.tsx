import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
    title: "Photo Editor",
    description: "Professional photo editing application",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
        <head>
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
            <link 
                href="https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,100..900;1,100..900&family=Roboto+Mono:ital,wght@0,100..700;1,100..700&display=swap" 
                rel="stylesheet" 
            />
            <link 
                href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" 
                rel="stylesheet" 
            />
        </head>
        <body className="antialiased" style={{ fontFamily: "'Roboto', sans-serif" }}>
            {children}
        </body>
        </html>
    );
}