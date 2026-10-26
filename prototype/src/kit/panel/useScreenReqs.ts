import { useEffect, useState } from "react";

/** The docc targets of the elements on screen now (`data-req`), in reading order, without repeats. */
export const useScreenReqs = (): string[] => {
  const [targets, setTargets] = useState<string[]>([]);
  useEffect(() => {
    const read = () => {
      const next = [
        ...new Set(
          [...document.querySelectorAll<HTMLElement>("[data-req]")]
            .filter((el) => !el.closest("[data-proto-panel]"))
            .map((el) => el.dataset.req ?? ""),
        ),
      ].filter(Boolean);
      setTargets((prev) => (prev.join() === next.join() ? prev : next));
    };
    read();
    const observer = new MutationObserver(read);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["data-req"],
    });
    return () => observer.disconnect();
  }, []);
  return targets;
};
