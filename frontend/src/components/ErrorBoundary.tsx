import { Component } from "react"
import type { ReactNode } from "react"
import { AlertTriangle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Props {
  children: ReactNode
  fallbackTitle?: string
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[ErrorBoundary]", error, info)
  }

  reset = () => this.setState({ hasError: false, error: undefined })

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4 animate-in fade-in duration-500 px-4">
          <AlertTriangle className="h-14 w-14 text-yellow-500" />
          <h2 className="text-xl font-bold text-foreground">
            {this.props.fallbackTitle ?? "Algo deu errado"}
          </h2>
          <p className="text-sm text-muted-foreground max-w-md">
            Ocorreu um erro inesperado nesta página. Tente atualizar ou entre em contato com o suporte se o problema persistir.
          </p>
          {this.state.error && (
            <p className="text-xs text-muted-foreground font-mono bg-muted px-3 py-2 rounded-md max-w-sm truncate">
              {this.state.error.message}
            </p>
          )}
          <Button onClick={this.reset} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Tentar novamente
          </Button>
        </div>
      )
    }
    return this.props.children
  }
}
