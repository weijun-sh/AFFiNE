import { noop } from 'lodash-es';
import {
  applyUpdate,
  Doc,
  encodeStateAsUpdate,
  encodeStateVector,
  UndoManager,
} from 'yjs';

import { type DocRecord, DocStorage, type DocStorageOptions } from './doc';

export interface HistoryFilter {
  before?: Date;
  limit?: Date;
}

export interface ListedHistory {
  userId: string | null;
  timestamp: Date;
}

export abstract class HistoricalDocStorage<
  Options extends DocStorageOptions = DocStorageOptions,
> extends DocStorage<Options> {
  constructor(opts: Options) {
    super(opts);

    this.on('snapshot', snapshot => {
      this.createHistory(snapshot.docId, snapshot).catch(noop);
    });
  }

  abstract listHistories(
    docId: string,
    filter?: HistoryFilter
  ): Promise<ListedHistory[]>;
  abstract getHistory(
    docId: string,
    timestamp: Date
  ): Promise<DocRecord | null>;
  abstract deleteHistory(docId: string, timestamp: Date): Promise<void>;

  async rollbackDoc(docId: string, timestamp: Date, editor?: string) {
    const toSnapshot = await this.getHistory(docId, timestamp);
    if (!toSnapshot) {
      throw new Error('Can not find the version to rollback to.');
    }

    const fromSnapshot = await this.getDoc(docId);

    if (!fromSnapshot) {
      throw new Error('Can not find the current version of the doc.');
    }

    const change = this.generateRevertUpdate(fromSnapshot.bin, toSnapshot.bin);
    await this.pushDocUpdate({ docId, bin: change, editor });
    // force create a new history record after rollback
    await this.createHistory(docId, fromSnapshot);
  }

  // history can only be created upon update pushing.
  protected abstract createHistory(
    docId: string,
    snapshot: DocRecord
  ): Promise<void>;

  protected generateRevertUpdate(
    fromNewerBin: Uint8Array,
    toOlderBin: Uint8Array
  ): Uint8Array {
    const newerDoc = new Doc();
    applyUpdate(newerDoc, fromNewerBin);
    const olderDoc = new Doc();
    applyUpdate(olderDoc, toOlderBin);

    const newerState = encodeStateVector(newerDoc);
    const olderState = encodeStateVector(olderDoc);

    const diff = encodeStateAsUpdate(newerDoc, olderState);

    const undoManager = new UndoManager(Array.from(olderDoc.share.values()));

    applyUpdate(olderDoc, diff);

    undoManager.undo();

    return encodeStateAsUpdate(olderDoc, newerState);
  }
}
