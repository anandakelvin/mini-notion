// SkeletonAnnotations.tsx
export function SkelIgnore({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export function SkelKeep({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export function SkelReplace(props: {
  replacement?: React.ReactNode;
  children: React.ReactNode;
}) {
  return <>{props.children}</>;
}