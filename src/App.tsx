import { lazy, Suspense, type ReactNode } from "react";

const MenuPage = lazy(() => import("./pages/menu.page"));
const OverlayPage = lazy(() => import("./pages/overlay.page"));
const NotFoundPage = lazy(() => import("./pages/notFound.page"));

const renderPage = (path: string): ReactNode => {
  if (path === "/") return <MenuPage />;
  if (path === "/overlay") return <OverlayPage />;

  return <NotFoundPage />;
};

function App() {
  return (
    <div
      className="flex w-screen h-screen overflow-hidden bg-background text-text-primary"
      onContextMenu={(e) => {
        e.preventDefault();
      }}
    >
      <Suspense fallback={null}>{renderPage(window.location.pathname)}</Suspense>
    </div>
  );
}

export default App;
