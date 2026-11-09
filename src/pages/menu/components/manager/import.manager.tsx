import { useState } from "react";
import { ArrowLeft, Save, Upload } from "lucide-react";
import { cn } from "cn";

import Button from "@/components/ui/button.component";
import { Input, inputVariants } from "@/components/ui/input.component";
import Loader from "@/components/ui/loader.component";
import { MAX_SOURCE_URL_LENGTH } from "@/configs/tournament.config";
import {
  activeTournamentSelectors,
  useActiveTournamentActions,
  useActiveTournamentSelector,
} from "@/hooks/useActiveTournament.hook";
import { useParseTournament, useSaveTournament } from "@/hooks/useTournament.hook";
import { errorMessage } from "@/lib/error.utils";
import { ApiError } from "@/lib/http.utils";

import { modalStore } from "@/stores/modal.store";
import type { ImportStage, TournamentSnapshot, TournamentSnapshotWrite } from "@/types/tournament";
import {
  getActionLabel,
  getStageLabel,
  getVisibleUrlError,
  listHasTournament,
  validateSource,
} from "@/lib/validate.utils";

const isSubmitDisabled = (
  preview: TournamentSnapshot | null,
  pending: boolean,
  canParse: boolean,
): boolean => (preview ? pending : !canParse);

function ImportHeader({ onBack }: { onBack: () => void }) {
  const savedTournaments = useActiveTournamentSelector(activeTournamentSelectors.savedTournaments);
  const { selectTournament } = useActiveTournamentActions();
  const save = useSaveTournament();

  const [stage, setStage] = useState<ImportStage | null>(null);
  const [url, setUrl] = useState<string>("");
  const [html, setHtml] = useState<string>("");
  const [preview, setPreview] = useState<TournamentSnapshotWrite | null>(null);
  const [conflict, setConflict] = useState<boolean>(false);
  const [submitAttempted, setSubmitAttempted] = useState<boolean>(false);

  const parse = useParseTournament(setStage);

  const urlError = validateSource(url);
  const pending = parse.isPending || save.isPending;
  const inputError = getVisibleUrlError(urlError, submitAttempted, url);
  const exists = listHasTournament(savedTournaments, preview);
  const overwrite = exists || conflict;
  const errorText = errorMessage(parse.error, "Не удалось импортировать турнир");
  const actionLabel = getActionLabel(preview, overwrite, html.trim().length > 0);
  const stageLabel = getStageLabel(save.isPending, stage);
  const submitDisabled = isSubmitDisabled(preview, pending, !pending && urlError === null);

  const resetPreview = () => {
    setPreview(null);
    setConflict(false);
    setSubmitAttempted(false);
    setStage(null);
    parse.reset();
    save.reset();
  };

  const persist = () => {
    if (!preview) return;
    if (pending) return;

    save.reset();
    save.mutate(
      { snapshot: preview, createOnly: !overwrite },
      {
        onSuccess: (snapshot) => {
          selectTournament(snapshot.key);
          modalStore.close();
        },
        onError: (error) => {
          if (error instanceof ApiError && error.status === 409) {
            setConflict(true);
          }
        },
      },
    );
  };

  const getActionIcon = () => {
    if (pending) return <Loader className="size-4" />;
    if (preview) return <Save className="size-3.5" />;
    return <Upload className="size-3.5" />;
  };

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(event) => {
        event.preventDefault();

        if (pending) return;

        setSubmitAttempted(true);

        if (preview) {
          persist();
          return;
        }

        if (urlError) return;

        setStage(null);
        parse.reset();
        parse.mutate(
          { url: url.trim(), html },
          {
            onSuccess: (snapshot) => {
              setPreview(snapshot);
            },
          },
        );
      }}
    >
      <Input
        size="sm"
        label="Ссылка на турнир"
        placeholder="https://challonge.com/..."
        value={url}
        onChange={(event) => {
          setUrl(event.target.value);
          resetPreview();
        }}
        error={inputError}
        maxLength={MAX_SOURCE_URL_LENGTH}
        disabled={pending}
      />

      <textarea
        value={html}
        onChange={(event) => {
          setHtml(event.target.value);
          resetPreview();
        }}
        placeholder="Вставьте HTML страницы турнира или JSON с TournamentStore..."
        className={cn(inputVariants({ size: "md" }), "h-40 resize-none py-2 font-mono text-xs")}
        disabled={pending}
      />

      {preview && (
        <section className="flex flex-col gap-1 rounded-ui border border-border bg-surface-sunken p-3">
          <p className="text-sm font-medium text-text-primary">{preview.name}</p>

          {overwrite && (
            <p className="text-xs text-accent">
              Турнир уже сохранён. Сохранение перезапишет его данные.
            </p>
          )}
        </section>
      )}

      {pending && <output className="block text-xs text-text-muted">{stageLabel}</output>}

      {errorText && <p className="text-xs text-accent">{errorText}</p>}

      <div className="flex items-center justify-between gap-2">
        <Button type="button" size="sm" variant="ghost" disabled={pending} onClick={onBack}>
          <ArrowLeft className="size-3.5" />
        </Button>

        <Button type="submit" size="sm" disabled={submitDisabled}>
          {getActionIcon()}
          {actionLabel}
        </Button>
      </div>
    </form>
  );
}

export default ImportHeader;
