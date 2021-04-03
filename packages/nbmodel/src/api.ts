/* -----------------------------------------------------------------------------
| Copyright (c) Jupyter Development Team.
| Distributed under the terms of the Modified BSD License.
|----------------------------------------------------------------------------*/

import { PartialJSONObject } from '@lumino/coreutils';

import { IDisposable } from '@lumino/disposable';

import { ISignal } from '@lumino/signaling';

import * as nbformat from '@jupyterlab/nbformat';

/**
 * This file defines the shared nbmodel types.
 *
 * - Notebook Type.
 * - Notebook Metadata Types.
 * - Cell Types.
 * - Cell Metadata Types.
 *
 * It also defines the shared changes to be used in the events.
 */

// Notebook Type.

/**
 * Implements an API for nbformat.INotebookContent
 */
export interface ISharedNotebook extends IDisposable {
  /**
   * Perform a transaction. While the function f is called, all changes to the shared
   * document are bundled into a single event.
   */
  transact(f: () => void): void;
  getMetadata(): nbformat.INotebookMetadata;
  setMetadata(metadata: nbformat.INotebookMetadata): void;
  updateMetadata(value: Partial<nbformat.INotebookMetadata>): void;
  readonly nbformat_minor: number;
  readonly nbformat: number;
  readonly cells: ISharedCell[];
  getCell(index: number): ISharedCell;
  insertCell(index: number, cell: ISharedCell): void;
  insertCells(index: number, cells: Array<ISharedCell>): void;
  moveCell(fromIndex: number, toIndex: number): void;
  deleteCell(index: number): void;
  deleteCellRange(from: number, to: number): void;
  undo(): void;
  redo(): void;
  readonly changed: ISignal<this, NotebookChange>;
}

// Notebook Metadata Types.

export interface ISharedKernelspecMetadata
  extends nbformat.IKernelspecMetadata,
    IDisposable {
  [key: string]: any;
  name: string;
  display_name: string;
}

export interface ISharedLanguageInfoMetadata
  extends nbformat.ILanguageInfoMetadata,
    IDisposable {
  [key: string]: any;
  name: string;
  codemirror_mode?: string | PartialJSONObject;
  file_extension?: string;
  mimetype?: string;
  pygments_lexer?: string;
}

// Cell Types.

export type ISharedCell =
  | ISharedCodeCell
  | ISharedRawCell
  | ISharedMarkdownCell
  | ISharedUnrecognizedCell;

export interface ISharedBaseCellMetada extends nbformat.IBaseCellMetadata {
  [key: string]: any;
}

/**
 * Implements an API for nbformat.IBaseCell.
 */
export interface ISharedBaseCell<Metadata extends ISharedBaseCellMetada>
  extends IDisposable {
  // @todo clone should only be available in the specific implementations i.e. ISharedCodeCell
  clone(): ISharedBaseCell<Metadata>;
  readonly isStandalone: boolean;
  getSource(): string;
  setSource(value: string): void;
  /**
   * Replace content from `start' to `end` with `value`.
   */
  updateSource(start: number, end: number, value?: string): void;
  getMetadata(): Partial<Metadata>;
  getMetadata(metadata: Partial<Metadata>): void;
  toJSON(): nbformat.IBaseCell;
  readonly cell_type: 'code' | 'markdown' | 'raw';
  readonly changed: ISignal<this, CellChange<Metadata>>;
}

/**
 * Implements an API for nbformat.ICodeCell.
 */
export interface ISharedCodeCell
  extends ISharedBaseCell<ISharedBaseCellMetada> {
  cell_type: 'code';
  /**
   * The code cell's prompt number. Will be null if the cell has not been run.
   */
  execution_count: nbformat.ExecutionCount;
  /**
   * Execution, display, or stream outputs.
   */
  getOutputs(): nbformat.IOutput[];
  toJSON(): nbformat.IBaseCell;
}

/**
 * Implements an API for nbformat.IMarkdownCell.
 */
export interface ISharedMarkdownCell
  extends ISharedBaseCell<ISharedBaseCellMetada> {
  /**
   * String identifying the type of cell.
   */
  cell_type: 'markdown';
  /**
   * Cell attachments.
   */
  getAttachments(): nbformat.IAttachments | undefined;
  setAttachments(attchments: nbformat.IAttachments | undefined): void;
  toJSON(): nbformat.IMarkdownCell;
}

/**
 * Implements an API for nbformat.IRawCell.
 */
export interface ISharedRawCell
  extends ISharedBaseCell<ISharedBaseCellMetada>,
    IDisposable {
  /**
   * String identifying the type of cell.
   */
  cell_type: 'raw';
  getAttachments(): nbformat.IAttachments | undefined;
  setAttachments(attchments: nbformat.IAttachments | undefined): void;
  toJSON(): nbformat.IRawCell;
}

/**
 * Changes on Sequence-like data are expressed as Quill-inspired deltas.
 *
 * @source https://quilljs.com/docs/delta/
 */
export type Delta<T> = Array<{ insert?: T; delete?: number; retain?: number }>;

/**
 * Implements an API for nbformat.IUnrecognizedCell.
 *
 * @todo Is this needed?
 */
export interface ISharedUnrecognizedCell
  extends ISharedBaseCell<ISharedBaseCellMetada>,
    IDisposable {
  cell_type: 'raw';
  toJSON(): nbformat.ICodeCell;
}

/**
 * Definition of the shared changes.
 */
export type NotebookChange = {
  cellsChange?: Delta<ISharedCell[]>;
  metadataChange?: {
    oldValue: nbformat.INotebookMetadata;
    newValue: nbformat.INotebookMetadata | undefined;
  };
};

export type CellChange<MetadataType> = {
  sourceChange?: Delta<string>;
  metadataChange?: {
    oldValue: Partial<MetadataType> | undefined;
    newValue: Partial<MetadataType> | undefined;
  };
};

export type MapChange = Map<
  string,
  { action: 'add' | 'update' | 'delete'; oldValue: any; newValue: any }
>;