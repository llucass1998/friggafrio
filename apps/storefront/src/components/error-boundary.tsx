import React, { Component, ErrorInfo, ReactNode } from "react"
import { Button } from "./ui/button"

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo)
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }
      
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-6 text-center border rounded-lg bg-gray-50 my-8 max-w-2xl mx-auto">
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          </div>
          <h2 className="text-2xl font-bold mb-2">Ops! Algo deu errado.</h2>
          <p className="text-gray-600 mb-6 max-w-md">
            Ocorreu um erro inesperado ao carregar esta parte da página. Nossa equipe já foi notificada.
          </p>
          <div className="flex gap-4">
            <Button 
              onClick={() => this.setState({ hasError: false })}
              variant="outline"
            >
              Tentar Novamente
            </Button>
            <Button 
              onClick={() => window.location.href = "/"}
            >
              Voltar ao Início
            </Button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
