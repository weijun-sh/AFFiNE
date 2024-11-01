import { IconButton } from '@affine/component';
import { PDFPageRenderer } from '@affine/core/modules/pdf/views';
import { PeekViewService } from '@affine/core/modules/peek-view';
import { stopPropagation } from '@affine/core/utils';
import {
  ArrowDownSmallIcon,
  ArrowUpSmallIcon,
  AttachmentIcon,
  CenterPeekIcon,
} from '@blocksuite/icons/rc';
import { useService } from '@toeverything/infra';
import clsx from 'clsx';
import { type MouseEvent, useCallback, useMemo, useRef, useState } from 'react';

import type { PDFViewerProps } from './pdf-viewer';
import type { PDFViewerInnerProps } from './pdf-viewer-inner';
import * as styles from './styles.css';
import * as embeddedStyles from './styles.embedded.css';

type PDFViewerEmbeddedInnerProps = PDFViewerProps & PDFViewerInnerProps;

export function PDFViewerEmbeddedInner({
  pdf,
  state,
  model,
}: PDFViewerEmbeddedInnerProps) {
  const peekView = useService(PeekViewService).peekView;

  const [cursor, setCursor] = useState(0);
  const viewerRef = useRef<HTMLDivElement>(null);

  const peek = useCallback(() => {
    const target = viewerRef.current?.closest(
      `affine-attachment[data-block-id="${model.id}"]`
    );
    if (!target) return;
    peekView.open({ element: target as HTMLElement }).catch(console.error);
  }, [viewerRef, peekView, model]);

  const navigator = useMemo(() => {
    const p = cursor - 1;
    const n = cursor + 1;

    return {
      prev: {
        disabled: p < 0,
        onClick: (e: MouseEvent) => {
          e.stopPropagation();
          setCursor(p);
        },
      },
      next: {
        disabled: n >= state.meta.pageCount,
        onClick: (e: MouseEvent) => {
          e.stopPropagation();
          setCursor(n);
        },
      },
      peek: {
        onClick: (e: MouseEvent) => {
          e.stopPropagation();
          peek();
        },
      },
    };
  }, [cursor, state, peek]);

  return (
    <div ref={viewerRef} className={embeddedStyles.pdfContainer}>
      <main className={embeddedStyles.pdfViewer}>
        <PDFPageRenderer
          key={cursor}
          pageNum={cursor}
          pdf={pdf}
          width={state.meta.width}
          height={state.meta.height}
          className={styles.pdfPage}
        />
        <div className={embeddedStyles.pdfControls}>
          <IconButton
            size={16}
            icon={<ArrowUpSmallIcon />}
            className={embeddedStyles.pdfControlButton}
            onDoubleClick={stopPropagation}
            {...navigator.prev}
          />
          <IconButton
            size={16}
            icon={<ArrowDownSmallIcon />}
            className={embeddedStyles.pdfControlButton}
            onDoubleClick={stopPropagation}
            {...navigator.next}
          />
          <IconButton
            size={16}
            icon={<CenterPeekIcon />}
            className={embeddedStyles.pdfControlButton}
            onDoubleClick={stopPropagation}
            {...navigator.peek}
          />
        </div>
      </main>
      <footer className={embeddedStyles.pdfFooter}>
        <div
          className={clsx([embeddedStyles.pdfFooterItem, { truncate: true }])}
        >
          <AttachmentIcon />
          <span className={embeddedStyles.pdfTitle}>{model.name}</span>
        </div>
        <div
          className={clsx([
            embeddedStyles.pdfFooterItem,
            embeddedStyles.pdfPageCount,
          ])}
        >
          <span>{state.meta.pageCount > 0 ? cursor + 1 : '-'}</span>/
          <span>{state.meta.pageCount > 0 ? state.meta.pageCount : '-'}</span>
        </div>
      </footer>
    </div>
  );
}
