import { ReactNode } from 'react';

export interface HousekeepingSubTab<T extends string> {
    id: T;
    label: string;
    icon?: ReactNode;
    /** Small counter shown next to the label, e.g. the entries in the history. */
    count?: number;
}

/** The strip of sub-pages under the user and room headers. */
export const HousekeepingSubTabs = <T extends string>({ tabs, active, onChange }: { tabs: HousekeepingSubTab<T>[]; active: T; onChange: (id: T) => void }) => (
    <div className="flex items-end gap-0.5 border-b border-zinc-300" role="tablist">
        {tabs.map((tab) => {
            const isActive = tab.id === active;

            return (
                <button
                    key={tab.id}
                    aria-selected={isActive}
                    className={`-mb-px flex items-center gap-1 rounded-t border px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                        isActive
                            ? 'border-zinc-300 border-b-white bg-white text-zinc-900'
                            : 'border-transparent text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800'
                    }`}
                    role="tab"
                    type="button"
                    onClick={() => onChange(tab.id)}
                >
                    {tab.icon}
                    {tab.label}
                    {tab.count !== undefined && tab.count > 0 && (
                        <span className="rounded-full bg-zinc-200 px-1.5 text-[9px] tabular-nums text-zinc-700">{tab.count}</span>
                    )}
                </button>
            );
        })}
    </div>
);
