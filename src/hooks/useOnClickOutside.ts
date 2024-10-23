import { useEffect } from "react";

const useOnClickOutside = (
  ref: React.RefObject<HTMLElement>, // Ref to any HTML element
  handler: (event: MouseEvent | TouchEvent) => void // Handler function that handles the event
) => {
  useEffect(() => {
    const listener = (event: MouseEvent | TouchEvent) => {
      // Check if the ref's current element contains the event target
      if (!ref.current || ref.current.contains(event.target as Node)) {
        return;
      }

      // Call the handler with the event
      handler(event);
    };

    document.addEventListener("mousedown", listener);
    document.addEventListener("touchstart", listener);

    // Cleanup event listeners on unmount
    return () => {
      document.removeEventListener("mousedown", listener);
      document.removeEventListener("touchstart", listener);
    };
  }, [ref, handler]); // Re-run the effect if ref or handler changes
};

export default useOnClickOutside;
