import Button from "@/components/ui/button.component";

function NotFoundPage() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-3">
      <h1 className="text-sm font-medium text-text-primary">Страница не найдена</h1>
      <Button
        size="sm"
        onClick={() => {
          location.href = "/";
        }}
      >
        Вернуться
      </Button>
    </div>
  );
}

export default NotFoundPage;
