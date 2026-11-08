import { cn } from "cn";
import { LoaderCircle } from "lucide-react";

const Loader = ({ className }: { className?: string }) => (
  <LoaderCircle className={cn("animate-spin", className)} />
);

export default Loader;
