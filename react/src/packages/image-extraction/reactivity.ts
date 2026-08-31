/**
 * The two watchers the matting engine needs, over `@vue/reactivity`.
 *
 * The engine below this file is 1,300 lines of canvas geometry that was written
 * against Vue refs: the drag and scale listeners mutate `transformConfig` from
 * inside a mouse handler and the redraw happens because something was watching
 * it. Rewriting that into explicit calls would mean finding every mutation site
 * in code whose whole job is to be subtle about pixels.
 *
 * `@vue/reactivity` is the reactivity system on its own — no components, no
 * renderer, no DOM — so the engine keeps working unchanged for about 10kB, and
 * the whole eraser is loaded on demand (see ImageCutout) so nobody who never
 * opens it pays for either.
 *
 * `watch` and `watchEffect` live in Vue's runtime rather than in this package,
 * so they are rebuilt here on `effect`, with the same contract the engine relies
 * on: run once immediately, then again whenever a dependency changes.
 */
import { ReactiveEffect, isRef, isReactive, type Ref } from '@vue/reactivity'

export type StopHandle = () => void

function traverse(value: unknown, seen = new Set<unknown>()): unknown {
  if (value === null || typeof value !== 'object' || seen.has(value)) return value
  seen.add(value)
  if (Array.isArray(value)) {
    for (const item of value) traverse(item, seen)
  } else {
    for (const key of Object.keys(value as Record<string, unknown>)) {
      traverse((value as Record<string, unknown>)[key], seen)
    }
  }
  return value
}

export function watchEffect(fn: () => void): StopHandle {
  const runner: ReactiveEffect = new ReactiveEffect(fn, () => runner.run())
  runner.run()
  return () => runner.stop()
}

type Source = Ref<any> | object | (() => unknown)

function read(source: Source, deep: boolean): unknown {
  const value = typeof source === 'function' ? (source as () => unknown)() : isRef(source) ? source.value : source
  return deep || isReactive(source) ? traverse(value) : value
}

/**
 * Vue's `watch`, minus the parts the engine does not use: no `immediate`, no old
 * value, and sources are always a list. Reactive objects are traversed so a
 * change anywhere inside one fires, which is what `{ deep: true }` bought.
 */
export function watch(sources: Source[], callback: () => void, options: { deep?: boolean } = {}): StopHandle {
  const getter = () => sources.map((source) => read(source, !!options.deep))
  const runner: ReactiveEffect = new ReactiveEffect(getter, () => {
    runner.run()
    callback()
  })
  runner.run()
  return () => runner.stop()
}
