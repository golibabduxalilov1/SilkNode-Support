import { ArrowUp, ArrowDown } from 'lucide-react';
import { SkeletonStack } from './Skeleton.jsx';
import EmptyState from './EmptyState.jsx';

/**
 * Full-width responsive data table in an overflow container.
 * columns: [{ key, header, render(row), sortable, numeric, align }]
 */
export default function DataTable({
  columns, rows, keyField = 'id',
  sortBy, sortDir = 'asc', onSort,
  onRowClick, loading = false, emptyState,
  className = '',
}) {
  if (loading) return <SkeletonStack rows={4} />;
  if (!rows || rows.length === 0) {
    return emptyState || <EmptyState title="Ma'lumot yo'q" description="Hozircha ko'rsatiladigan qator topilmadi." />;
  }

  return (
    <div className={`overflow-x-auto rounded-md border border-line bg-panel ${className}`}>
      <table className="w-full border-collapse text-[13.5px]">
        <thead>
          <tr>
            {columns.map((col) => {
              const active = sortBy === col.key;
              return (
                <th
                  key={col.key}
                  scope="col"
                  aria-sort={active ? (sortDir === 'desc' ? 'descending' : 'ascending') : 'none'}
                  onClick={col.sortable ? () => onSort?.(col.key) : undefined}
                  className={[
                    'whitespace-nowrap border-b border-line-strong px-3.5 py-3 font-mono text-[11px] font-medium uppercase tracking-wider text-ink-soft',
                    col.align === 'right' ? 'text-right' : 'text-left',
                    col.sortable ? 'cursor-pointer select-none hover:text-ink' : '',
                  ].join(' ')}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.header}
                    {active && (sortDir === 'desc' ? <ArrowDown className="size-3" aria-hidden="true" /> : <ArrowUp className="size-3" aria-hidden="true" />)}
                  </span>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row[keyField]}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={`border-b border-line-soft transition-colors duration-150 ease-swiss last:border-b-0 ${onRowClick ? 'cursor-pointer hover:bg-sunken' : ''}`}
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={[
                    'px-3.5 py-3 align-middle text-ink',
                    col.align === 'right' ? 'text-right' : 'text-left',
                    col.numeric ? 'font-mono tabular-nums' : '',
                  ].join(' ')}
                >
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
