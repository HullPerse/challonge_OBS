import Button from "@/components/ui/button.component";
import { formatDistanceToNow } from "@/lib/date.utils";
import type { TournamentSummary } from "@/types/tournament";
import { cn } from "cn";
import { RefreshCw, Trash2 } from "lucide-react";

function TournamentRow({
  item,
  active,
  confirming,
  deleting,
  refreshing,
  onSelect,
  onRefresh,
  onPrefetch,
  onAskDelete,
  onCancelDelete,
  onConfirmDelete,
}: {
  item: TournamentSummary;
  active: boolean;
  confirming: boolean;
  deleting: boolean;
  refreshing: boolean;
  onSelect: (key: string) => void;
  onRefresh: (key: string) => void;
  onPrefetch: (key: string) => void;
  onAskDelete: (key: string) => void;
  onCancelDelete: () => void;
  onConfirmDelete: (key: string) => void;
}) {
  return (
    <div
      className={cn(
        "group flex items-center gap-3 rounded-ui border p-3",
        active
          ? "border-accent bg-surface-elevated"
          : "border-border bg-surface opacity-80 hover:opacity-100 hover:border-accent/50 hover:cursor-pointer relative",
      )}
    >
      <button
        aria-label={item.name}
        type="button"
        className="flex min-w-0 flex-row flex-1 text-left hover:cursor-pointer disabled:pointer-events-none disabled:opacity-45"
        onClick={() => {
          onSelect(item.key);
        }}
        onPointerEnter={() => {
          onPrefetch(item.key);
        }}
        onFocus={() => {
          onPrefetch(item.key);
        }}
        disabled={active}
      >
        <section className="flex min-w-0 flex-1 flex-col gap-1 items-start h-full">
          <span className="flex min-w-0 items-center gap-2">
            <span className="truncate text-sm text-accent font-bold">{item.name}</span>
          </span>
          <span className="mt-0.5 block w-full truncate text-[11px] text-text-muted">
            {formatDistanceToNow(item.updatedAt)}
          </span>
        </section>
      </button>
      <section className="flex-row ml-auto hidden group-hover:flex">
        <Button
          size="icon"
          variant="ghost"
          title="Обновить с Challonge"
          disabled={refreshing || deleting}
          onClick={() => {
            onRefresh(item.key);
          }}
        >
          <RefreshCw className={cn("size-3.5", refreshing && "animate-spin")} />
        </Button>
        {confirming ? (
          <div className="flex shrink-0 items-center gap-1">
            <Button
              size="sm"
              variant="error"
              disabled={deleting}
              onClick={() => {
                onConfirmDelete(item.key);
              }}
            >
              Удалить
            </Button>
            <Button size="sm" variant="ghost" onClick={onCancelDelete}>
              Отмена
            </Button>
          </div>
        ) : (
          <Button
            size="icon"
            variant="ghost"
            onClick={() => {
              onAskDelete(item.key);
            }}
          >
            <Trash2 className="size-3.5" />
          </Button>
        )}
      </section>
    </div>
  );
}

export default TournamentRow;
