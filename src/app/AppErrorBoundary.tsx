import { Component, type ErrorInfo, type ReactNode } from 'react';

type Props = { children: ReactNode };
type State = { error: Error | null };

/** Keep the desktop window usable when an unexpected render error occurs. */
export class AppErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State { return { error }; }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[FIT] UI render failure', error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <main className="startup-error" role="alert" aria-live="assertive">
        <div className="startup-error-card">
          <h1>Không thể hiển thị ứng dụng / Application error</h1>
          <p>Giao diện gặp lỗi khi khởi động. Dữ liệu phiên trên thiết bị chưa bị xóa.</p>
          <p>The UI failed to render. Your local investigation data has not been deleted.</p>
          <pre>{this.state.error.message}</pre>
          <button type="button" onClick={() => window.location.reload()}>Tải lại / Reload</button>
          <p className="startup-error-hint">Nếu lỗi tiếp diễn, hãy chụp màn hình thông báo và kiểm tra Console trong WebView Developer Tools.</p>
        </div>
      </main>
    );
  }
}
