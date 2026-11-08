import { useEffect, useState } from "react";

import { api } from "@/api/index.api";
import OverlayBracket from "@/components/overlay/bracket.overlay";
import { applyEvent } from "@/lib/bracket/overlay.utils";
import { readOverlayBootstrap } from "@/lib/overlay/bootstrap.utils";
import type { OverlayScene } from "@/types/overlay";

function OverlayPage() {
  const [scene, setScene] = useState<OverlayScene | null>(() => {
    const bootstrap = readOverlayBootstrap();
    if (!bootstrap) return null;

    return {
      state: bootstrap.state,
      tournament: bootstrap.tournament,
      visibility: bootstrap.visibility,
    };
  });
  const [connected, setConnected] = useState<boolean>(false);

  useEffect(() => {
    const bodyBackground = document.body.style.background;
    const documentBackground = document.documentElement.style.background;

    document.body.style.background = "transparent";
    document.documentElement.style.background = "transparent";

    const unsubscribe = api.overlay.subscribe({
      onOpen: () => {
        setConnected(true);
      },
      onError: () => {
        setConnected(false);
      },
      onEvent: (event) => {
        setScene((previous) => applyEvent(previous, event));
      },
    });

    return () => {
      unsubscribe();
      document.body.style.background = bodyBackground;
      document.documentElement.style.background = documentBackground;
    };
  }, []);

  return (
    <main
      className="pointer-events-none relative h-screen w-screen select-none overflow-hidden bg-transparent"
      data-overlay
      data-overlay-connected={connected}
    >
      <OverlayBracket scene={scene} />
    </main>
  );
}

export default OverlayPage;
