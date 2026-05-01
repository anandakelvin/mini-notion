// SkeletonAnnotations.tsx
import React from "react";
import { useSkeletonizer } from ".";

/**
 * SkeletonIgnore:
 *  Widgets annotated with Skeleton.ignore will NOT be skeletonized.
 *  We render a wrapper with class "skel-ignore" so CSS rules opt it out.
 */
export function SkeletonIgnore({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="skel-ignore">{children}</div>;
}

/**
 * SkeletonKeep:
 *  Widgets annotated with Skeleton.keep will not be skeletonized
 *  but will still live under global shimmer overlay.
 */
export function SkeletonKeep({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="skel-keep">{children}</div>;
}

/**
 * SkeletonShade:
 *  Widgets annotated with Skeleton.shade keep their content,
 *  but have a local shimmer mask applied.
 */
export function SkeletonShade({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="skel-shade">{children}</div>;
}

/**
 * SkeletonLeaf:
 *  Marks containers as leafs; we treat the whole container as a single bone.
 *  Children layout is preserved but hidden while loading.
 */
export function SkeletonLeaf({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="skel-leaf">{children}</div>;
}

/**
 * SkeletonReplace:
 *  Widgets annotated with Skeleton.replace will be replaced
 *  when skeletonizer is enabled, and the replacement will be skeletonized.
 *
 *  In Flutter this is used e.g. for Image.network.
 */
type SkeletonReplaceProps = {
  replacement?: React.ReactNode;
  children: React.ReactNode;
};

export function SkeletonReplace({
  replacement,
  children,
}: SkeletonReplaceProps) {
  const { enabled } = useSkeletonizer();

  if (enabled) {
    // When skeleton is ON, we render the replacement (or children) so
    // it gets skeletonized by the zone rules.
    return <>{replacement ?? children}</>;
  }

  // When skeleton is OFF, we render the real widget.
  return <>{children}</>;
}

/**
 * SkeletonUnite:
 *  Widgets annotated with Skeleton.unite will be drawn as one big bone.
 *  We wrap children in a "skel-unite" container that becomes a single block.
 */
type SkeletonUniteProps = {
  children: React.ReactNode;
};

export function SkeletonUnite({ children }: SkeletonUniteProps) {
  return <div className="skel-unite">{children}</div>;
}

/**
 * SkeletonIgnorePointers:
 *  Widgets annotated with Skeleton.ignorePointers will ignore pointer
 *  events when skeletonizer is enabled.
 */
export function SkeletonIgnorePointers({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="skel-ignore-pointers">{children}</div>;
}
