import type { Player } from "@/types/tournament";
import ImageComponent from "../ui/image.component";

const PlayerAvatar = ({
  player,
  name,
  size,
}: {
  player: Player | null;
  name: string;
  size: number;
}) => {
  const initial = name.slice(0, 1).toUpperCase() || "?";

  if (!player?.avatar) {
    return (
      <span
        className="flex shrink-0 items-center justify-center font-medium text-text-primary"
        style={{
          width: size,
          height: size,
          borderRadius: 3,
          backgroundColor: "var(--border)",
          fontSize: Math.max(10, Math.round(size * 0.38)),
        }}
        aria-hidden="true"
      >
        {initial}
      </span>
    );
  }

  return (
    <span
      className="flex shrink-0 overflow-hidden"
      style={{ width: size, height: size, borderRadius: 3 }}
    >
      <ImageComponent
        src={player.avatar}
        alt="player avatar"
        draggable={false}
        referrerPolicy="no-referrer"
        className="h-full w-full"
      />
    </span>
  );
};

export default PlayerAvatar;
