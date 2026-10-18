import * as RD from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "./Button";
import { useT } from "@/i18n";
import { cn } from "@/lib/utils";

export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  className,
  footer,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  className?: string;
  footer?: ReactNode;
}) {
  const t = useT();
  return (
    <RD.Root open={open} onOpenChange={onOpenChange}>
      <RD.Portal>
        <RD.Overlay
          className="fixed inset-0 z-50 bg-[#0a1020]/55 backdrop-blur-[2px]"
          style={{ animation: "fade-in .18s ease-out" }}
        />
        <RD.Content
          aria-describedby={undefined}
          className={cn(
            "fixed left-1/2 top-1/2 z-50 max-h-[90dvh] w-[calc(100vw-2rem)] max-w-md overflow-y-auto rounded-sheet border border-line bg-surface p-6 shadow-pop focus:outline-none",
            className,
          )}
          style={{
            transform: "translate(-50%, -50%)",
            animation: "dialog-in .2s cubic-bezier(.2,.8,.2,1)",
          }}
        >
          <div className="flex items-start justify-between gap-4">
            <RD.Title className="text-lg font-semibold leading-snug">
              {title}
            </RD.Title>
            <RD.Close
              className="-m-1.5 rounded-lg p-1.5 text-muted hover:bg-surface-2"
              aria-label={t("common.close")}
            >
              <X className="size-5" />
            </RD.Close>
          </div>
          {description ? (
            <RD.Description className="mt-2 text-sm leading-relaxed text-muted">
              {description}
            </RD.Description>
          ) : null}
          {children && <div className="mt-5">{children}</div>}
          {footer && (
            <div className="mt-6 flex flex-wrap justify-end gap-2.5">
              {footer}
            </div>
          )}
        </RD.Content>
      </RD.Portal>
    </RD.Root>
  );
}

export interface ConfirmDialogProps {
  open: boolean;
  title: ReactNode;
  description?: ReactNode;
  confirmLabel: string;
  destructive?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}
/** Required only for the destructive actions listed in spec §7.5. */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  destructive,
  loading,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const t = useT();
  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o && !loading) onCancel();
      }}
      title={title}
      description={description}
      footer={
        <>
          <Button variant="secondary" onClick={onCancel} disabled={loading}>
            {t("common.cancel")}
          </Button>
          <Button
            variant={destructive ? "danger" : "primary"}
            onClick={onConfirm}
            loading={loading}
          >
            {confirmLabel}
          </Button>
        </>
      }
    />
  );
}
