export default function Stars({ value = 0 }: { value?: number }) {
  return (
    <span aria-label={`${value} out of 5 stars`} className="text-sm leading-none text-amber-400">
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i}>{value >= i - 0.25 ? '★' : value >= i - 0.75 ? '⯪' : '☆'}</span>
      ))}
    </span>
  );
}
