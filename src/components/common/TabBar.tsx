import type { ReactElement } from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/Tabs';

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
  const handleValueChange = (value: string): void => {
    onChange(value as T);
  };

  return (
    <Tabs value={activeId} onValueChange={handleValueChange} className={className}>
      <TabsList className={`flex gap-1 mb-4 border-b border-[var(--color-border-soft)] overflow-x-auto overflow-y-hidden bg-transparent h-auto p-0 rounded-none ${className}`.trim()}>
        {tabs.map((tab) => (
          <TabsTrigger
            key={tab.id}
            value={tab.id}
            className="flex-shrink-0"
          >
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
