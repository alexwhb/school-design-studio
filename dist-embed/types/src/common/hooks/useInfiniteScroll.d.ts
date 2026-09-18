import { type RefObject } from 'react';
export default function useInfiniteScroll(ref: RefObject<HTMLElement | null>, load: () => void, distance?: number, enabled?: boolean): void;
