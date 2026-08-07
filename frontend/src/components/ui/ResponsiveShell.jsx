/**
 * Content container: max-width 1200px, centered, with responsive horizontal
 * padding (20px mobile / 32px tablet / 40px desktop).
 */
export default function ResponsiveShell({ as: As = 'div', className = '', children, ...rest }) {
  return (
    <As className={`mx-auto max-w-(--container-max) px-5 md:px-8 lg:px-10 ${className}`} {...rest}>
      {children}
    </As>
  );
}
