/**
 * Pinwheel / Windmill loader with optional grass decoration.
 * size="card"  → small inline (inside journey card image area)
 * size="page"  → large fullscreen with brown stick + green bushes
 */

import styles from './Pinwheel.module.css';

interface PinwheelProps {
  size?: 'card' | 'page';
  label?: string;
}

export function Pinwheel({ size = 'page', label = 'Loading…' }: PinwheelProps) {
  if (size === 'card') {
    // Compact version — no stick/grass, just the spinning wheel
    return (
      <div className={styles.cardLoader} role="status" aria-label={label}>
        <div className={styles.cardContainer} aria-hidden="true">
          <div className={styles.pin} />
          <div className={`${styles.paperContainer} ${styles.red}`}>
            <div className={`${styles.paperLeaf1} ${styles.red1}`} />
            <div className={`${styles.paperLeaf2} ${styles.red2}`} />
          </div>
          <div className={`${styles.paperContainer} ${styles.rotate90}`}>
            <div className={`${styles.paperLeaf1} ${styles.yellow1}`} />
            <div className={`${styles.paperLeaf2} ${styles.yellow2}`} />
          </div>
          <div className={`${styles.paperContainer} ${styles.rotate180}`}>
            <div className={`${styles.paperLeaf1} ${styles.green1}`} />
            <div className={`${styles.paperLeaf2} ${styles.green2}`} />
          </div>
          <div className={`${styles.paperContainer} ${styles.rotate270}`}>
            <div className={`${styles.paperLeaf1} ${styles.blue1}`} />
            <div className={`${styles.paperLeaf2} ${styles.blue2}`} />
          </div>
        </div>
      </div>
    );
  }

  // Full page version — large windmill + stick + green bushes
  return (
    <div className={styles.pageLoader} role="status" aria-label={label}>
      {/* The windmill head */}
      <div className={styles.windmill} aria-hidden="true">
        <div className={styles.container}>
          <div className={styles.pin} />
          <div className={`${styles.paperContainer} ${styles.red}`}>
            <div className={`${styles.paperLeaf1} ${styles.red1}`} />
            <div className={`${styles.paperLeaf2} ${styles.red2}`} />
          </div>
          <div className={`${styles.paperContainer} ${styles.rotate90}`}>
            <div className={`${styles.paperLeaf1} ${styles.yellow1}`} />
            <div className={`${styles.paperLeaf2} ${styles.yellow2}`} />
          </div>
          <div className={`${styles.paperContainer} ${styles.rotate180}`}>
            <div className={`${styles.paperLeaf1} ${styles.green1}`} />
            <div className={`${styles.paperLeaf2} ${styles.green2}`} />
          </div>
          <div className={`${styles.paperContainer} ${styles.rotate270}`}>
            <div className={`${styles.paperLeaf1} ${styles.blue1}`} />
            <div className={`${styles.paperLeaf2} ${styles.blue2}`} />
          </div>
        </div>
        {/* Brown stick */}
        <div className={styles.stick} />
        {/* Green bushes */}
        <div className={styles.bushes} />
      </div>
    </div>
  );
}
