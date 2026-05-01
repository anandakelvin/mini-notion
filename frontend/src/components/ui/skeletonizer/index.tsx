// Skeletonizer.tsx
import React, { createContext, useContext } from "react";
import "./skeletonizer.css";

type SkeletonizerContextValue = {
  enabled: boolean;
};

const SkeletonizerContext = createContext<SkeletonizerContextValue>({
  enabled: false,
});

export function useSkeletonizer() {
  return useContext(SkeletonizerContext);
}

type SkeletonizerProps = {
  enabled: boolean;
  children: React.ReactNode;
};

/**
 * Wrap once, skeletonize everything.
 *
 * <Skeletonizer enabled={loading}>
 *   <YourLayout />
 * </Skeletonizer>
 */
export function Skeletonizer({ enabled, children }: SkeletonizerProps) {
  return (
    <SkeletonizerContext.Provider value={{ enabled }}>
      <div className="skel-zone" data-skeleton={enabled ? "on" : "off"}>
        {children}
      </div>
    </SkeletonizerContext.Provider>
  );
}
