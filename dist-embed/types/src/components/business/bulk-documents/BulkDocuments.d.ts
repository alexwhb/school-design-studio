import './bulkDocuments.less';
export type BulkDocumentsHandle = {
    open: () => void;
};
type Props = {
    getTitle?: () => string;
};
/**
 * One page per person.
 *
 * The office job this is for: forty certificates for a year group, a name badge
 * for everyone coming to the open evening, an award letter to each family. The
 * design is made once with `{{Name}}` where the name goes, the list is pasted
 * from wherever it already lives, and every copy is filled in — either as pages
 * of this design, where each one can still be touched up, or straight into a
 * PDF for the printer when there are too many pages to want to keep.
 *
 * Three steps in the order the decisions are made: what the list is, which
 * column fills which field, and what to make of it. Each step says out loud
 * what it has understood — how many people, which fields have no column, how
 * many pages that comes to — because the mistakes in a job like this are only
 * found at the printer otherwise.
 */
declare const BulkDocuments: import("react").ForwardRefExoticComponent<Props & import("react").RefAttributes<BulkDocumentsHandle>>;
export default BulkDocuments;
