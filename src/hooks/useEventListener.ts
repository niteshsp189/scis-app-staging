import { useState, useEffect } from "react";

/**
 * A hook that listens for a custom event and executes a callback when it's fired
 * 
 * @param eventName The name of the event to listen for
 * @param callback The function to execute when the event is fired
 */
export function useEventListener<T = any>(
  eventName: string,
  callback: (data?: T) => void
) {
  useEffect(() => {
    const handleEvent = (event: CustomEvent<T>) => {
      callback(event.detail);
    };

    // Add event listener
    document.addEventListener(eventName, handleEvent as EventListener);

    // Remove event listener on cleanup
    return () => {
      document.removeEventListener(eventName, handleEvent as EventListener);
    };
  }, [eventName, callback]);
}

/**
 * A hook that allows dispatching custom events
 * 
 * @param eventName The name of the event to dispatch
 * @returns A function to dispatch the event with optional data
 */
export function useEventDispatcher<T = any>(eventName: string) {
  return (data?: T) => {
    const event = new CustomEvent(eventName, { detail: data });
    document.dispatchEvent(event);
  };
}
