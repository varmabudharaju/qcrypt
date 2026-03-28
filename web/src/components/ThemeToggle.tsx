import { useTheme } from '../theme.tsx';

export default function ThemeToggle() {
  const { theme, toggle } = useTheme();

  return (
    <button
      onClick={toggle}
      className="px-3 py-1.5 rounded border border-slate-300 dark:border-[#333] text-sm hover:bg-slate-100 dark:hover:bg-[#1a1a1a] transition-colors"
    >
      {theme === 'dark' ? 'Light' : 'Dark'}
    </button>
  );
}
