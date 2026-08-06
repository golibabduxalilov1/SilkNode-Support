import { cn } from '../lib/cn.js';
import { Skeleton } from './Skeleton.jsx';
import { EmptyState } from './EmptyState.jsx';

/**
 * DataTable — full-width responsive table in an overflow container.
 * columns: [{ key, header, align?: 'left'|'right'|'center', numeric?: bool, render?: (row, index) => node, width?: string }]
 */
export function DataTable({
  columns,
  data = [],
  rowKey = (row, index) => row.id ?? index,
  loading = false,
  skeletonRows = 5,
  emptyMessage = 'No records found.',
  onRowClick,
  className,
}) {
  const isEmpty = !loading && data.length === 0;

  return (
    <div className={cn('overflow-x-auto rounded-md border border-border', className)}>
      <table className="w-full min-w-[640px] border-collapse text-left">
        <thead>
          <tr className="border-b border-border-strong bg-sunken">
            {columns.map((col) => (
              <th
                key={col.key}
                scope="col"
                style={col.width ? { width: col.width } : undefined}
                className={cn(
                  'whitespace-nowrap px-4 py-3 font-mono text-[11px] font-medium uppercase tracking-wide text-fg-secondary',
                  col.align === 'right' && 'text-right',
                  col.align === 'center' && 'text-center'
                )}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {loading &&
            Array.from({ length: skeletonRows }).map((_, rowIndex) => (
              <tr key={`skeleton-${rowIndex}`}>
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-3">
                    <Skeleton className="h-4 w-full max-w-32" />
                  </td>
                ))}
              </tr>
            ))}

          {!loading &&
            data.map((row, index) => (
              <tr
                key={rowKey(row, index)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={cn(
                  'transition-colors duration-150 [transition-timing-function:var(--ease-swiss)]',
                  'hover:bg-sunken',
                  onRowClick && 'cursor-pointer'
                )}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={cn(
                      'px-4 py-3 text-[14px] text-fg',
                      col.numeric && 'tabular-nums font-mono',
                      col.align === 'right' && 'text-right',
                      col.align === 'center' && 'text-center'
                    )}
                  >
                    {col.render ? col.render(row, index) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
        </tbody>
      </table>

      {isEmpty && (
        <div className="border-t border-border">
          <EmptyState title={emptyMessage} compact />
        </div>
      )}
    </div>
  );
}
