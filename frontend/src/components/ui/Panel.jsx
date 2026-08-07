/**
 * White surface primitive for cards/panels. Pass `interactive` for hoverable,
 * clickable panels (strengthens border + adds a subtle shadow on hover).
 */
export default function Panel({ as: As = 'div', interactive = false, padding = 'md', className = '', children, ...rest }) {
  const paddings = { none: '', sm: 'p-3', md: 'p-4', lg: 'p-6' };
  return (
    <As
      className={[
        'rounded-md border border-line bg-panel',
        'transition-[border-color,box-shadow] duration-150 ease-swiss',
        interactive ? 'cursor-pointer hover:border-line-strong hover:shadow-(--shadow-hover)' : '',
        paddings[padding],
        className,
      ].join(' ')}
      {...rest}
    >
      {children}
    </As>
  );
}
