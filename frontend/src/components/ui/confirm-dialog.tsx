import { AlertTriangle } from "lucide-react"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface ConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description: string
  confirmLabel?: string
  isDestructive?: boolean
  isLoading?: boolean
}

export function ConfirmDialog({
  isOpen, onClose, onConfirm, title, description,
  confirmLabel = "Confirmar",
  isDestructive = true,
  isLoading = false,
}: ConfirmDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="sm:max-w-[400px] w-[95%] bg-background border-border text-foreground">
        <DialogHeader>
          <div className="flex items-center gap-3">
            {isDestructive && <AlertTriangle className="h-5 w-5 text-red-500 shrink-0" />}
            <DialogTitle>{title}</DialogTitle>
          </div>
          <DialogDescription className="text-muted-foreground pt-1">{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button
            variant={isDestructive ? "destructive" : "default"}
            onClick={() => { onConfirm(); onClose() }}
            disabled={isLoading}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
