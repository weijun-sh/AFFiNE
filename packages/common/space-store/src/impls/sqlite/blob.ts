import { share } from '../../connection';
import {
  type BlobRecord,
  BlobStorage,
  type BlobStorageOptions,
} from '../../storage';
import { NativeDBConnection } from './db';

interface SqliteBlobStorageOptions extends BlobStorageOptions {
  dbPath: string;
}

export class SqliteBlobStorage extends BlobStorage<SqliteBlobStorageOptions> {
  override connection = share(new NativeDBConnection(this.options.dbPath));

  get db() {
    return this.connection.inner;
  }

  override async get(key: string) {
    return this.db.getBlob(key);
  }

  override async set(blob: BlobRecord) {
    await this.db.setBlob(blob);
  }

  override async delete(key: string, permanently: boolean) {
    await this.db.deleteBlob(key, permanently);
  }

  override async release() {
    await this.db.releaseBlobs();
  }

  override async list() {
    return this.db.listBlobs();
  }
}
