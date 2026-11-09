import Loader from "@/components/ui/loader.component";
import type { SelectStatusVariant } from "@/types/ui";

const STATUS_TEXT: Record<SelectStatusVariant, string> = {
  loading: "Загрузка турниров…",
  error: "Нет связи с сервером",
  empty: "Нет турниров",
};

function SelectStatus({ variant }: { variant: SelectStatusVariant }) {
  return (
    <div className="flex h-10 items-center gap-2 truncate rounded-ui border border-border px-2 text-xs font-bold text-accent md:text-sm">
      {variant === "loading" && <Loader className="size-4" />}
      {STATUS_TEXT[variant]}
    </div>
  );
}

export default SelectStatus;
