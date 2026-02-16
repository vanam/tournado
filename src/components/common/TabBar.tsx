import type { ReactElement } from 'react';

interface TabItem<T extends string> {
  id: T;
  label: string;
}

interface TabBarProps<T extends string> {
  tabs: TabItem<T>[];
  activeId: T;
  onChange: (id: T) => void;
  className?: string;
}

export const TabBar = <T extends string>({
  tabs,
  activeId,
  onChange,
  className = '',
}: TabBarProps<T>): ReactElement => {
  return (
    <div
      className={`flex gap-1 mb-4 border-b border-[var(--color-border-soft)] overflow-x-auto overflow-y-hidden ${className}`.trim()}
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => { onChange(tab.id); }}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors duration-150 whitespace-nowrap flex-shrink-0 ${
            activeId === tab.id
              ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
              : 'border-transparent text-[var(--color-muted)] hover:text-[var(--color-text)] hover:border-[var(--color-border)]'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
