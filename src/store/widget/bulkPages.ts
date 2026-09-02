/*
 * One page per person: a template page copied once for each row of a list,
 * with its `{{fields}}` filled from that row.
 *
 * What a person "is" here is deliberately small — a name for the page and a
 * resolver for the fields — so that the dialog decides how a row of the pasted
 * list turns into either, and this file only knows how to make pages out of
 * them. The same builder serves both outputs: the copies either go into the
 * design as pages, or are drawn straight to a PDF and thrown away.
 */
import { canvasState, widgetState } from '../state'
import { MAX_PAGES, copyLayout, showPage } from './pages'
import { fillLayout, type TFieldResolver } from '@/utils/mergeFields'
import type { TdLayout } from '../types'

/**
 * How many people one PDF run will take.
 *
 * Every page is drawn through html2canvas and held as a JPEG until the file is
 * assembled, so the run costs time and memory in proportion. Five hundred Letter
 * pages at Print quality is a few minutes and a few hundred megabytes, which is
 * about where a browser tab stops being a reasonable place to do this. A whole
 * school is usually more than one list anyway — a year group at a time.
 */
export const MAX_PDF_PEOPLE = 500

export type TPerson = {
  /** What the page is called in the strip: the first column, usually a name. */
  name: string
  resolve: TFieldResolver
}

export type TBulkPlan = {
  /** Indices into `dLayouts` of the pages to copy, in page order. */
  templates: number[]
  people: TPerson[]
  /** Take the template pages out once the copies are in. */
  removeTemplates: boolean
}

/** How many pages the plan makes. */
export function pagesToAdd(plan: Pick<TBulkPlan, 'templates' | 'people'>): number {
  return plan.templates.length * plan.people.length
}

/** How many pages the design would hold afterwards. */
export function pagesAfter(plan: TBulkPlan): number {
  return widgetState.dLayouts.length - (plan.removeTemplates ? plan.templates.length : 0) + pagesToAdd(plan)
}

export function fitsInDesign(plan: TBulkPlan): boolean {
  return pagesAfter(plan) <= MAX_PAGES
}

/**
 * The filled copies, in reading order: every template page for the first
 * person, then every template page for the second. Each copy is renumbered
 * the way a duplicated page is, so two people's pages never share an element
 * id, and named after the person so the strip reads as a register.
 */
export function buildPersonPages(templates: TdLayout[], people: TPerson[]): TdLayout[] {
  const pages: TdLayout[] = []
  for (const person of people) {
    for (const template of templates) {
      const { layout } = fillLayout(copyLayout(template), person.resolve)
      layout.global.name = person.name
      pages.push(layout)
    }
  }
  return pages
}

/**
 * Puts the copies into the design after the last template page, and moves to
 * the first of them.
 *
 * Not wrapped in history itself: the caller brackets the whole generation as
 * one change, so one Ctrl+Z takes every page back out.
 */
export function addPersonPages(plan: TBulkPlan): { added: number; first: number } {
  const templates = [...plan.templates].sort((a, b) => a - b).filter((index) => widgetState.dLayouts[index])
  if (templates.length === 0 || plan.people.length === 0) return { added: 0, first: canvasState.dCurrentPage }
  if (!fitsInDesign({ ...plan, templates })) return { added: 0, first: canvasState.dCurrentPage }

  const pages = buildPersonPages(
    templates.map((index) => widgetState.dLayouts[index]),
    plan.people,
  )
  let first = templates[templates.length - 1] + 1
  widgetState.dLayouts.splice(first, 0, ...pages)

  if (plan.removeTemplates) {
    // Highest first, so each removal leaves the lower indices where they were.
    for (const index of [...templates].reverse()) widgetState.dLayouts.splice(index, 1)
    first -= templates.length
  }

  showPage(first)
  return { added: pages.length, first }
}
