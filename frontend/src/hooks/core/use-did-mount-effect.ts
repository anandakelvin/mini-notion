import { useEffect, useRef } from 'react';

export function useDidMountEffect(effect: () => any, deps : Array<any>) {
  const didMount = useRef(false);

  useEffect(() => {
    if (didMount.current) {
      return effect();
    } else {
      didMount.current = true;
    }
  }, deps);
}