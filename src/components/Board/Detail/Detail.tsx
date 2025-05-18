import { useRouter } from "next/router";
import styles from "./Detail.module.scss";
import { usePostsDetails } from "@/api/posts/getPostsId";
import Loader from "@/components/Layout/Loader/Loader";
import { timeAgo } from "@/utils/timeAgo";
import DOMPurify from "dompurify";
import Chip from "@/components/Chip/Chip";
import { getTypeLabel } from "../BoardAll/AllCard/AllCard";
import Link from "next/link";
import Button from "@/components/Button/Button";
import IconComponent from "@/components/Asset/Icon";
import { useModalStore } from "@/states/modalStore";
import { useToast } from "@/hooks/useToast";
import { useAuthStore } from "@/states/authStore";
import { useEffect, useState } from "react";
import { deletePostsSave, putPostsSave } from "@/api/posts/putDeletePostsIdSave";
import { deletePostsLike, putPostsLike } from "@/api/posts/putDeletePostsLike";
import { PostDetailProps } from "./Detail.types";
import Dropdown from "@/components/Dropdown/Dropdown";
import { deletePostsFeeds } from "@/api/posts/deletePostsId";
import BoardAll from "../BoardAll/BoardAll";
import ShareBtn from "./ShareBtn/ShareBtn";
import PostComment from "./Comment/Comment";
import { useDeviceStore } from "@/states/deviceStore";
import { useIsMobile } from "@/hooks/useIsMobile";

export default function PostDetail({ id }: PostDetailProps) {
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const user_id = useAuthStore((state) => state.user_id);
  const openModal = useModalStore((state) => state.openModal);
  const { showToast } = useToast();
  const [currentLikeCount, setCurrentLikeCount] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const { data: posts, isLoading, refetch } = usePostsDetails(id as string);
  const isMobile = useDeviceStore((state) => state.isMobile);
  const isTablet = useDeviceStore((state) => state.isTablet);
  useIsMobile();
  const router = useRouter();
  const { pathname } = useRouter();
  useEffect(() => {
    refetch();
  }, [pathname]);

  useEffect(() => {
    if (!posts) return;
    setIsLiked(posts.isLike ?? false);
    setIsSaved(posts.isSave ?? false);
    setCurrentLikeCount(posts.likeCount ?? 0);
  }, [posts]);

  if (isLoading) {
    return <Loader />;
  }

  const sanitizedContent = posts ? DOMPurify.sanitize(posts.content) : "";

  const handleOpenShareModal = () => {
    if (posts) {
      openModal({
        type: "SHAREPOST",
        data: { postId: id, title: posts.title },
      });
    }
  };
  const handleOpenReportModal = () => {
    if (isMobile) {
      openModal({
        type: "REPORT",
        data: { refType: "POST", refId: posts?.author.id },
      });
    } else {
      openModal({
        type: "REPORT",
        data: { refType: "POST", refId: posts?.author.id },
      });
    }
  };

  const handleLikeClick = async () => {
    if (!isLoggedIn) {
      showToast("로그인 후 좋아요를 누를 수 있어요.", "error");
      return;
    }

    if (isLiked) {
      await deletePostsLike(id);
      setCurrentLikeCount((prev) => prev - 1);
    } else {
      await putPostsLike(id);
      setCurrentLikeCount((prev) => prev + 1);
    }
    setIsLiked(!isLiked);
  };

  const handleSaveClick = async () => {
    if (!isLoggedIn) {
      showToast("로그인 후 저장할 수 있어요.", "error");
      return;
    }

    if (isSaved) {
      await deletePostsSave(id);
    } else {
      await putPostsSave(id);
    }
    setIsSaved(!isSaved);
  };

  const handleDelete = async () => {
    if (!id) return;

    try {
      openModal({
        type: null,
        data: {
          title: "글을 정말 삭제하시겠어요?",
          confirmBtn: "삭제하기",
          onClick: async () => {
            try {
              await deletePostsFeeds(id);
              router.push("/board");
            } catch (err) {
              showToast("삭제 중 오류가 발생했습니다.", "error");
            }
          },
        },
        isComfirm: true,
      });
    } catch (error) {
      showToast("삭제 중 오류가 발생했습니다.", "error");
    }
  };

  const handleOpenEditPage = () => {
    router.push(`/posts/${id}/edit`);
  };

  return (
    <div className={styles.container}>
      {posts && (
        <div className={styles.center}>
          <section className={styles.header}>
            <div className={styles.headerLeft}>
              <div className={styles.chip}>
                {posts.type === "NOTICE" ? (
                  <Chip size="s" type="filled-secondary">
                    {getTypeLabel(posts.type)}
                  </Chip>
                ) : (
                  <Chip size="s" type="filled-assistive">
                    {getTypeLabel(posts.type)}
                  </Chip>
                )}
              </div>
              {isMobile ? (
                <>
                  <h1 className={styles.title}>{posts.title}</h1>
                  <div className={styles.authorCreatedAt}>
                    {posts.type !== "NOTICE" && (
                      <p className={styles.author}>{posts.author.name}</p>
                    )}
                    <p className={styles.createdAt}>{timeAgo(posts.createdAt)}</p>
                  </div>
                </>
              ) : (
                <>
                  <h1 className={styles.title}>{posts.title}</h1>
                  <div className={styles.authorCreatedAt}>
                    {posts.type !== "NOTICE" && (
                      <p className={styles.author}>{posts.author.name}</p>
                    )}
                    <p className={styles.createdAt}>{timeAgo(posts.createdAt)}</p>
                  </div>
                </>
              )}
            </div>
            {!isMobile && (
              <div className={styles.dropdownContainer}>
                {isLoggedIn &&
                  (user_id === posts.author.id ? (
                    <div className={styles.dropdown}>
                      <Dropdown
                        trigger={<IconComponent name="meatball" padding={8} size={24} isBtn />}
                        menuItems={[
                          {
                            label: "수정하기",
                            onClick: handleOpenEditPage,
                          },
                          {
                            label: "삭제하기",
                            onClick: handleDelete,
                            isDelete: true,
                          },
                        ]}
                      />
                    </div>
                  ) : (
                    <div className={styles.dropdown}>
                      <Dropdown
                        trigger={<IconComponent name="meatball" padding={8} size={24} isBtn />}
                        menuItems={[
                          {
                            label: "신고하기",
                            onClick: handleOpenReportModal,
                            isDelete: true,
                          },
                        ]}
                      />
                    </div>
                  ))}
                <ShareBtn postId={id} title={posts.title} thumbnail={posts.thumbnail} />
              </div>
            )}
          </section>
          <div className={styles.bar} />
          <div className={styles.content} dangerouslySetInnerHTML={{ __html: sanitizedContent }} />
          <div className={styles.counts}>
            <div className={styles.count}>
              <IconComponent name="boardLikeCount" size={16} />
              {posts.likeCount}
            </div>
            <div className={styles.count}>
              <IconComponent name="commentCount" size={16} />
              {posts.commentCount}
            </div>
            <div className={styles.count}>
              <IconComponent name="viewCount" size={16} />
              {posts.viewCount}
            </div>
          </div>
          <div className={styles.btnContainer}>
            <div className={styles.likeBtn} onClick={handleLikeClick}>
              <Button
                size="l"
                type="outlined-assistive"
                leftIcon={
                  <IconComponent
                    name={isLiked ? "boardLikeCountOn" : "boardLikeCountOff"}
                    size={20}
                  />
                }
              >
                {currentLikeCount}
              </Button>
            </div>
            <div className={styles.saveBtn} onClick={handleSaveClick}>
              <IconComponent name={isSaved ? "detailSaveOn" : "detailSaveOff"} size={20} />
            </div>
            {user_id === posts.author.id || !isLoggedIn ? (
              <div className={styles.dropdown}>
                {!isMobile ? (
                  <Dropdown
                    trigger={
                      <div className={styles.menuBtn}>
                        <IconComponent name="meatball" size={20} />
                      </div>
                    }
                    menuItems={[
                      {
                        label: "공유하기",
                        onClick: handleOpenShareModal,
                      },
                    ]}
                  />
                ) : user_id === posts.author.id ? (
                  <Dropdown
                    trigger={
                      <div className={styles.menuBtn}>
                        <IconComponent name="meatball" size={20} />
                      </div>
                    }
                    menuItems={[
                      {
                        label: "공유하기",
                        onClick: handleOpenShareModal,
                      },
                      {
                        label: "수정하기",
                        onClick: handleOpenEditPage,
                      },
                      {
                        label: "삭제하기",
                        onClick: handleDelete,
                        isDelete: true,
                      },
                    ]}
                  />
                ) : (
                  <Dropdown
                    trigger={
                      <div className={styles.menuBtn}>
                        <IconComponent name="meatball" size={20} />
                      </div>
                    }
                    menuItems={[
                      {
                        label: "공유하기",
                        onClick: handleOpenShareModal,
                      },
                      {
                        label: "신고하기",
                        onClick: handleOpenReportModal,
                        isDelete: true,
                      },
                    ]}
                  />
                )}
              </div>
            ) : (
              <div className={styles.dropdown}>
                <Dropdown
                  trigger={
                    <div className={styles.menuBtn}>
                      <IconComponent name="meatball" size={20} />
                    </div>
                  }
                  menuItems={[
                    {
                      label: "공유하기",
                      onClick: handleOpenShareModal,
                    },
                    {
                      label: "신고하기",
                      onClick: handleOpenReportModal,
                      isDelete: true,
                    },
                  ]}
                />
              </div>
            )}
          </div>
          <PostComment postId={id} postWriterId={posts.author.id} />
          {!posts.commentCount && <div className={styles.bar} />}
          <section className={styles.uploadBtn}>
            {isLoggedIn && (
              <Link href="/board/write">
                <Button
                  size="m"
                  type="outlined-assistive"
                  leftIcon={<IconComponent name="detailWrite" size={16} />}
                >
                  글쓰기
                </Button>
              </Link>
            )}
          </section>
          <BoardAll isDetail hasChip={true} />
        </div>
      )}
    </div>
  );
}
