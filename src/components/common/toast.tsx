import {
  AlertCircle,
  CheckCircle2,
  Info,
  TriangleAlert,
  X,
} from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ToastType = "success" | "error" | "warning" | "info";

type ToastOptions = {
  title?: string;
  description?: string;
  duration?: number;
};

type ToastItem = Required<Pick<ToastOptions, "duration">> &
  Omit<ToastOptions, "duration"> & {
    id: string;
    type: ToastType;
  };

type ToastApi = {
  show: (type: ToastType, options: string | ToastOptions) => string;
  success: (options: string | ToastOptions) => string;
  error: (options: string | ToastOptions) => string;
  warning: (options: string | ToastOptions) => string;
  info: (options: string | ToastOptions) => string;
  dismiss: (id: string) => void;
};

const DEFAULT_DURATION = 3200;
const ToastContext = createContext<ToastApi | null>(null);
let toastItems: ToastItem[] = [];
const toastListeners = new Set<() => void>();

const icons: Record<ToastType, ReactNode> = {
  success: <CheckCircle2 className="h-4 w-4 text-success" aria-hidden />,
  error: <AlertCircle className="h-4 w-4 text-error" aria-hidden />,
  warning: <TriangleAlert className="h-4 w-4 text-warning" aria-hidden />,
  info: <Info className="h-4 w-4 text-info" aria-hidden />,
};

function normalizeToastOptions(options: string | ToastOptions): ToastOptions {
  if (typeof options === "string") {
    return { title: options };
  }

  return options;
}

function createToastId() {
  return `toast-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function emitToastChange() {
  toastListeners.forEach((listener) => listener());
}

function subscribeToast(listener: () => void) {
  toastListeners.add(listener);
  return () => toastListeners.delete(listener);
}

function getToastSnapshot() {
  return toastItems;
}

function dismissToast(id: string) {
  toastItems = toastItems.filter((item) => item.id !== id);
  emitToastChange();
}

function showToast(type: ToastType, options: string | ToastOptions) {
  const normalized = normalizeToastOptions(options);
  const id = createToastId();

  toastItems = [
    ...toastItems,
    {
      id,
      type,
      title: normalized.title,
      description: normalized.description,
      duration: normalized.duration ?? DEFAULT_DURATION,
    },
  ];
  emitToastChange();

  return id;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const dismiss = useCallback((id: string) => dismissToast(id), []);
  const show = useCallback(
    (type: ToastType, options: string | ToastOptions) =>
      showToast(type, options),
    [],
  );

  const api = useMemo<ToastApi>(
    () => ({
      show,
      success: (options) => show("success", options),
      error: (options) => show("error", options),
      warning: (options) => show("warning", options),
      info: (options) => show("info", options),
      dismiss,
    }),
    [dismiss, show],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <Toaster />
    </ToastContext.Provider>
  );
}

export function Toaster() {
  const items = useSyncExternalStore(
    subscribeToast,
    getToastSnapshot,
    getToastSnapshot,
  );

  return <ToastViewport items={items} onDismiss={dismissToast} />;
}

export function useToast() {
  const api = useContext(ToastContext);

  if (!api) {
    throw new Error("useToast must be used inside ToastProvider.");
  }

  return api;
}

export const toast = {
  success(options: string | ToastOptions) {
    return showToast("success", options);
  },
  error(options: string | ToastOptions) {
    return showToast("error", options);
  },
  warning(options: string | ToastOptions) {
    return showToast("warning", options);
  },
  info(options: string | ToastOptions) {
    return showToast("info", options);
  },
  dismiss(id: string) {
    dismissToast(id);
  },
};

function ToastViewport({
  items,
  onDismiss,
}: {
  items: ToastItem[];
  onDismiss: (id: string) => void;
}) {
  if (typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div
      className="fixed right-4 top-4 z-50 flex w-[min(360px,calc(100vw-32px))] flex-col gap-2"
      role="region"
      aria-label="消息通知"
    >
      {items.map((item) => (
        <ToastMessage key={item.id} item={item} onDismiss={onDismiss} />
      ))}
    </div>,
    document.body,
  );
}

function ToastMessage({
  item,
  onDismiss,
}: {
  item: ToastItem;
  onDismiss: (id: string) => void;
}) {
  useEffect(() => {
    if (item.duration <= 0) {
      return;
    }

    const timer = window.setTimeout(() => onDismiss(item.id), item.duration);
    return () => window.clearTimeout(timer);
  }, [item.duration, item.id, onDismiss]);

  return (
    <div
      className="flex gap-3 rounded-admin border border-border bg-surface p-3 text-sm shadow-admin"
      role={item.type === "error" ? "alert" : "status"}
    >
      <div className="mt-0.5 shrink-0">{icons[item.type]}</div>
      <div className="min-w-0 flex-1">
        {item.title && (
          <div className="break-words font-medium text-text-primary">
            {item.title}
          </div>
        )}
        {item.description && (
          <div
            className={cn(
              "break-words text-[13px] text-text-tertiary",
              item.title && "mt-0.5",
            )}
          >
            {item.description}
          </div>
        )}
      </div>
      <Button
        size="icon"
        variant="ghost"
        className="h-7 w-7 shrink-0"
        onClick={() => onDismiss(item.id)}
        aria-label="关闭通知"
      >
        <X className="h-4 w-4" aria-hidden />
      </Button>
    </div>
  );
}
