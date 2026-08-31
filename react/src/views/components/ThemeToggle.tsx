import useTheme from '@/common/hooks/useTheme'
import Tooltip from '@/components/ui/Tooltip'
import './themeToggle.less'

export default function ThemeToggle() {
  const { preference, resolved, toggleTheme, setThemePreference } = useTheme()

  const next = resolved === 'dark' ? 'light' : 'dark'
  const tip =
    preference === 'system'
      ? `Switch to ${next} mode (following your system)`
      : `Switch to ${next} mode · shift-click to follow your system`

  function onClick(e: React.MouseEvent | React.KeyboardEvent) {
    if ((e as React.MouseEvent).shiftKey) setThemePreference('system')
    else toggleTheme()
  }

  return (
    <Tooltip content={tip} placement="bottom" showAfter={400}>
      <div
        className="theme-toggle"
        role="button"
        tabIndex={0}
        aria-label={tip}
        onClick={onClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onClick(e)
          }
        }}
      >
        <i className={`iconfont ${resolved === 'dark' ? 'icon-sun' : 'icon-moon'}`} aria-hidden="true">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {resolved === 'dark' ? (
              <>
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M6.3 17.7l-1.4 1.4M19.1 4.9l-1.4 1.4" />
              </>
            ) : (
              <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
            )}
          </svg>
        </i>
      </div>
    </Tooltip>
  )
}
