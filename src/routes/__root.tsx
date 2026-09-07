import "@/lib/force-latin-numbers";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { Toaster } from "@/components/ui/sonner";
import { StageProvider } from "@/contexts/StageContext";
import { GlobalStoreProvider } from "@/contexts/GlobalStoreContext";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4" dir="rtl">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">الصفحة غير موجودة</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          الصفحة التي تبحث عنها غير متوفرة أو تم نقلها.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            العودة للرئيسية
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-8" dir="rtl">
      <div className="max-w-lg w-full text-center bg-card p-6 md:p-8 rounded-3xl border border-border shadow-xl space-y-4">
        <div className="mx-auto w-12 h-12 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center font-black text-xl">
          !
        </div>
        <h1 className="text-2xl font-black tracking-tight text-foreground">
          تعذر تحميل الصفحة
        </h1>
        <p className="text-sm font-medium text-muted-foreground">
          حدث خطأ أثناء تحميل محتوى هذه الصفحة. يمكنك محاولة إعادة التحميل أو الانتقال إلى الصفحة الرئيسية.
        </p>

        {error?.message && (
          <div className="text-right p-3 rounded-xl bg-destructive/5 border border-destructive/20 text-xs font-mono text-destructive break-all max-h-32 overflow-y-auto">
            {error.message}
          </div>
        )}

        {error?.stack && (
          <details className="text-right text-xs text-muted-foreground">
            <summary className="cursor-pointer font-bold hover:underline mb-1">
              عرض التفاصيل الفنية للمطورين
            </summary>
            <pre className="p-3 rounded-xl bg-muted/50 border border-border text-[11px] font-mono text-left overflow-x-auto whitespace-pre-wrap max-h-40" dir="ltr">
              {error.stack}
            </pre>
          </details>
        )}

        <div className="pt-2 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-md transition-all hover:bg-primary/90"
          >
            إعادة المحاولة
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-xl border border-input bg-background px-5 py-2.5 text-sm font-bold text-foreground transition-all hover:bg-accent"
          >
            الرئيسية
          </a>
          <button
            type="button"
            onClick={() => {
              try {
                if (typeof window !== "undefined") {
                  window.location.reload();
                }
              } catch (e) {}
            }}
            className="inline-flex items-center justify-center rounded-xl border border-border px-4 py-2.5 text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
          >
            تحديث المتصفح
          </button>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "نظام  إدارة المدارس" },
      { name: "description", content: "Serene School Hub manages educational schedules, attendance, grades, and parent follow-ups." },
      { property: "og:title", content: "نظام  إدارة المدارس" },
      { property: "og:description", content: "Serene School Hub manages educational schedules, attendance, grades, and parent follow-ups." },
      { property: "og:type", content: "website" },
      { name: "twitter:title", content: "نظام  إدارة المدارس" },
      { name: "twitter:description", content: "Serene School Hub manages educational schedules, attendance, grades, and parent follow-ups." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/816cf124-f456-4075-9179-f60c98c4719c/id-preview-7c158727--faa2d35f-e1c1-41e7-a511-c45ecf22f207.lovable.app-1781453627241.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/816cf124-f456-4075-9179-f60c98c4719c/id-preview-7c158727--faa2d35f-e1c1-41e7-a511-c45ecf22f207.lovable.app-1781453627241.png" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800&family=Tajawal:wght@400;500;700&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <StageProvider>
      <GlobalStoreProvider>
        <QueryClientProvider client={queryClient}>
          <Outlet />
          <Toaster position="top-center" richColors />
        </QueryClientProvider>
      </GlobalStoreProvider>
    </StageProvider>
  );
}
