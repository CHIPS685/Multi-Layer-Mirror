export default function Skeleton(props: { height?: number }) {
  return (
    <div
      className="rounded-xl bg-black/5 animate-pulse"
      style={{ height: props.height ?? 16 }}
    />
  );
}