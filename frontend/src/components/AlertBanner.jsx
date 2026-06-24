const STYLES = {
  error: 'border-rose-500/30 bg-rose-500/10 text-rose-200',
  success: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200',
  warning: 'border-amber-500/30 bg-amber-500/10 text-amber-200',
  info: 'border-emerald-500/20 bg-slate-800/60 text-slate-300',
};

function AlertBanner({ type = 'error', message, onDismiss, className = '' }) {
  if (!message) return null;

  return (
    <div
      className={`flex items-start gap-3 p-4 rounded-xl border text-sm ${STYLES[type]} ${className}`}
      role="alert"
    >
      <span className="flex-1 leading-relaxed">{message}</span>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="shrink-0 opacity-70 hover:opacity-100 transition-opacity"
          aria-label="Dismiss"
        >
          ✕
        </button>
      )}
    </div>
  );
}

export default AlertBanner;
