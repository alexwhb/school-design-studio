import type { TTableData } from '../../components/modules/widgets/wTable/tableModel';
export type TTablePatch = Partial<TTableData>;
export declare function updateTable(uuid: string, patch: TTablePatch): void;
