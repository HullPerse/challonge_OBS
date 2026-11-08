import { createSignalStore } from "@hullperse/hp_utils/signal";
import type { ModalContent } from "@/types/modal";

const store = createSignalStore();

const isOpen = store.atom<boolean>("isOpen", false);
const content = store.atom<ModalContent | null>("content", null);

export const modalStore = {
  content,
  isOpen,
  open: (next: ModalContent) => {
    content.set(next);
    isOpen.set(true);
  },
  close: () => {
    isOpen.set(false);
  },
};
