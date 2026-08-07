import { forwardRef } from 'react';
import { Check } from 'lucide-react';

/** 20x20 near-square checkbox, indigo when checked. Pass `label` for the trailing text. */
const Checkbox = forwardRef(function Checkbox({ label, className = '', ...rest }, ref) {
  return (
    <label className={`inline-flex cursor-pointer items-center gap-2 ${rest.disabled ? 'cursor-not-allowed opacity-40' : ''} ${className}`}>
      <span className="relative inline-flex size-5 flex-none">
        <input ref={ref} type="checkbox" className="peer absolute inset-0 size-5 cursor-pointer appearance-none rounded-[4px] border border-line-strong bg-panel transition-colors duration-150 ease-swiss checked:border-accent checked:bg-accent focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2 disabled:cursor-not-allowed" {...rest} />
        <Check className="pointer-events-none absolute inset-0 m-auto size-3.5 text-white opacity-0 peer-checked:opacity-100" aria-hidden="true" strokeWidth={3} />
      </span>
      {label && <span className="text-[15px] text-ink">{label}</span>}
    </label>
  );
});

export default Checkbox;
