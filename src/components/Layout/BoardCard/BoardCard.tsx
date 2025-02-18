import IconComponent from "@/components/Asset/Icon";
import styles from "./BoardCard.module.scss";
import { formatCurrency } from "@/utils/formatCurrency";
import { BoardCardProps } from "./BoardCard.types";
import Link from "next/link";
import { timeAgo } from "@/utils/timeAgo";

export default function BoardCard({
  id,
  title,
  commentCount,
  viewCount,
  createdAt,
}: BoardCardProps) {
  return (
    <div className={styles.container}>
      <div className={styles.infoContainer}>
        <Link href={`/posts/${id}`}>
          <h3 className={styles.title}>{title}</h3>
          <div className={styles.bottomContainer}>
            <div className={styles.countContainer}>
              <div className={styles.likeContainer}>
                <IconComponent name="boardAllComment" width={16} height={16} />
                <p className={styles.commentCount}>{formatCurrency(commentCount)}</p>
              </div>
              <div className={styles.likeContainer}>
                <IconComponent name="boardView" width={16} height={16} />
                <p className={styles.count}>{formatCurrency(viewCount)}</p>
              </div>
            </div>
            <img src="/icon/card-dot.svg" width={3} height={3} alt="dot" loading="lazy" />
            <p className={styles.createdAt}>{timeAgo(createdAt)}</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
