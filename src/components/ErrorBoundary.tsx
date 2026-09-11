import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-[var(--color-bg)] text-white p-4">
          <div className="bg-[var(--color-panel-bg)] border border-[var(--color-border)] p-6 rounded-2xl max-w-md w-full shadow-2xl text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
            <h1 className="text-xl font-bold mb-2">Đã xảy ra lỗi không mong muốn</h1>
            <p className="text-[var(--color-text-muted)] text-sm mb-6">
              Ứng dụng gặp sự cố. Vui lòng tải lại trang hoặc liên hệ hỗ trợ nếu lỗi vẫn tiếp diễn.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="flex items-center gap-2 bg-[var(--color-primary)] text-black px-6 py-2.5 rounded-xl font-semibold hover:bg-[var(--color-primary)]/90 transition-colors"
            >
              <RefreshCcw className="w-5 h-5" /> Tải lại trang
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
