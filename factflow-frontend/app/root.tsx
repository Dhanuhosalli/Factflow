import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";
import { useEffect } from "react";
import './i18n'; // Import i18n configuration

import type { Route } from "./+types/root";
import "./app.css";

export const links: Route.LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
  },
  {
    rel: "icon",
    href: "/favicon.ico",
    type: "image/x-icon",
  },
];

export const meta: Route.MetaFunction = () => [
  { title: "FactFlow AI - Fake News Detection" },
  { name: "description", content: "AI-powered fake news detection for text and images" },
  { name: "theme-color", content: "#121212" },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details =
      error.status === 404
        ? "The requested page could not be found."
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="pt-16 p-4 container mx-auto bg-dark text-white">
      <h1 className="text-3xl font-bold text-neon-green mb-4">{message}</h1>
      <p className="text-gray-300 mb-6">{details}</p>
      {stack && (
        <pre className="w-full p-4 overflow-x-auto bg-dark-lighter rounded-lg">
          <code className="text-gray-400">{stack}</code>
        </pre>
      )}
      <a 
        href="/"
        className="inline-block mt-6 bg-neon-green text-black px-6 py-2 rounded-lg hover:bg-white transition-colors"
      >
        Back to Home
      </a>
    </main>
  );
}
