import { useState, useEffect, useRef } from "react";
import styles from "./Comment.module.scss";
import Image from "next/image";
import { authState } from "@/states/authState";
import { useRecoilValue } from "recoil";
import { useUserData } from "@/api/users/getId";
import { usePostFeedsComments } from "@/api/feeds-comments/postFeedComments";
import {
  useGetFeedsComments,
  useGetFeedsChildComments,
  FeedsCommentsResponse,
} from "@/api/feeds-comments/getFeedComments";
import { CommentProps } from "./Comment.types";
import { useToast } from "@/utils/useToast";
import { deleteComments } from "@/api/feeds-comments/deleteFeedComment";
import { useMutation, useQueryClient } from "react-query";
import Link from "next/link";
import Loader from "@/components/Layout/Loader/Loader";
import Dropdown from "@/components/Dropdown/Dropdown";
import { timeAgo } from "@/utils/timeAgo";
import TextField from "@/components/TextField/TextField";
import IconComponent from "@/components/Asset/Icon";
import Button from "@/components/Button/Button";
import Chip from "@/components/Chip/Chip";
import { deleteCommentLike, putCommentLike } from "@/api/feeds-comments/putDeleteCommentsLike";

export default function Comment({ feedId, feedWriterId }: CommentProps) {
  const { isLoggedIn, user_id } = useRecoilValue(authState);
  const { data: userData, isLoading } = useUserData(isLoggedIn ? user_id : null);
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [comment, setComment] = useState("");
  const [replyText, setReplyText] = useState("");
  const [activeReplyId, setActiveReplyId] = useState<string | null>(null);
  const [mentionedUser, setMentionedUser] = useState<{ id: string; name: string } | null>(null);
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
  const replyInputRef = useRef<HTMLInputElement>(null);
  const { data: commentsData, refetch: refetchComments } = useGetFeedsComments({ feedId });
  const postCommentMutation = usePostFeedsComments();
  const deleteCommentMutation = useMutation(deleteComments, {
    onSuccess: () => {
      showToast("댓글이 삭제되었습니다.", "success");
      refetchComments();
    },
    onError: () => {
      showToast("댓글 삭제에 실패했습니다.", "error");
    },
  });

  const handleLikeClick = async (commentId: string, currentIsLike: boolean) => {
    if (!isLoggedIn) {
      showToast("회원만 좋아요를 할 수 있어요!", "error");
      return;
    }

    try {
      if (currentIsLike) {
        await deleteCommentLike(commentId);
      } else {
        await putCommentLike(commentId);
      }

      refetchComments();

      if (expandedComments.size > 0) {
        expandedComments.forEach((commentId) => {
          queryClient.invalidateQueries(["getFeedsChildComments", feedId, commentId]);
        });
      }
    } catch (error) {
      showToast("좋아요 처리 중 오류가 발생했습니다.", "error");
    }
  };

  const handleCommentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setComment(e.target.value);
  };

  const handleReplyTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (mentionedUser && !value.startsWith(`@${mentionedUser.name} `)) {
      setReplyText(`@${mentionedUser.name} ${value}`);
    } else {
      setReplyText(value);
    }
  };

  const handleReply = (commentId: string, writer: { id: string; name: string }) => {
    if (activeReplyId === commentId) {
      setActiveReplyId(null);
      setMentionedUser(null);
      setReplyText("");
    } else {
      setActiveReplyId(commentId);
      setMentionedUser(writer);
      setReplyText(`@${writer.name} `);
    }
  };

  const handleReport = () => {
    showToast("신고 처리 로직 추가 필요합니다.", "success");
  };

  const handleCommentDelete = async (id: string) => {
    deleteCommentMutation.mutate(id);
  };

  const handleCommentSubmit = async () => {
    if (!isLoggedIn || !comment.trim()) return;

    postCommentMutation.mutate(
      {
        feedId,
        content: comment,
      },
      {
        onSuccess: () => {
          setComment("");
          refetchComments();
        },
      }
    );
  };

  const handleReplySubmit = async () => {
    if (!isLoggedIn || !replyText.trim() || !activeReplyId || !mentionedUser) return;

    const actualReplyContent = replyText.replace(`@${mentionedUser.name} `, "").trim();

    if (!actualReplyContent) {
      showToast("답글 내용을 입력해주세요.", "error");
      return;
    }

    postCommentMutation.mutate(
      {
        feedId,
        content: replyText,
        parentCommentId: activeReplyId,
        mentionedUserId: mentionedUser.id,
      },
      {
        onSuccess: () => {
          setReplyText("");
          setActiveReplyId(null);
          setMentionedUser(null);
          refetchComments();
          queryClient.invalidateQueries(["getFeedsChildComments", feedId, activeReplyId]);
        },
      }
    );
  };

  const toggleChildComments = (commentId: string) => {
    setExpandedComments((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(commentId)) {
        newSet.delete(commentId);
      } else {
        newSet.add(commentId);
      }
      return newSet;
    });
  };

  useEffect(() => {
    if (activeReplyId && replyInputRef.current) {
      replyInputRef.current.focus();
      if (mentionedUser) {
        const cursorPosition = `@${mentionedUser.name} `.length;
        replyInputRef.current.setSelectionRange(cursorPosition, cursorPosition);
      }
    }
  }, [activeReplyId, mentionedUser]);

  if (isLoading) {
    return <Loader />;
  }

  // 답글 영역
  const ChildComments = ({ parentId }: { parentId: string }) => {
    const { data: childComments, isLoading } = useGetFeedsChildComments({
      feedId,
      parentId,
    });

    if (isLoading) return <Loader />;
    if (!childComments) return null;

    return (
      <div className={styles.childComments}>
        {childComments.map((reply) => (
          <div key={reply.id} className={`${styles.comment} ${styles.nestedComment}`}>
            <div className={styles.commentBox}>
              <Link href={`/users/${reply.writer.id}`}>
                {reply.writer.image !== "https://image.grimity.com/null" ? (
                  <Image
                    src={reply.writer.image}
                    width={28}
                    height={28}
                    alt="댓글 프로필"
                    className={styles.writerImage}
                  />
                ) : (
                  <Image
                    src="/image/default.svg"
                    width={28}
                    height={28}
                    alt="댓글 프로필"
                    className={styles.writerImage}
                  />
                )}
              </Link>
              <div className={styles.commentBody}>
                <div className={styles.writerReply}>
                  <div className={styles.writerLeft}>
                    <div className={styles.writerCreatedAt}>
                      <Link href={`/users/${reply.writer.id}`}>
                        <div className={styles.writerName}>
                          {reply.writer.name}
                          {reply.writer.id === feedWriterId && (
                            <Chip size="s" type="filled-secondary">
                              작성자
                            </Chip>
                          )}
                        </div>
                      </Link>
                      <p className={styles.createdAt}>{timeAgo(reply.createdAt)}</p>
                    </div>
                    <p className={styles.commentText}>{reply.content}</p>
                    <div className={styles.likeReplyBtn}>
                      <div
                        className={styles.likeButton}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLikeClick(reply.id, reply.isLike);
                        }}
                      >
                        <Image
                          src={
                            reply.isLike
                              ? "/icon/comment-like-on.svg"
                              : "/icon/comment-like-off.svg"
                          }
                          width={24}
                          height={24}
                          alt="좋아요"
                          className={styles.likeIcon}
                        />
                        {reply.likeCount}
                      </div>
                      <p
                        onClick={() =>
                          handleReply(parentId, { id: reply.writer.id, name: reply.writer.name })
                        }
                        className={styles.replyBtn}
                      >
                        답글
                      </p>
                    </div>
                  </div>
                  {isLoggedIn && (
                    <div className={styles.replyBtnDropdown}>
                      {reply.writer.id === user_id ? (
                        <Dropdown
                          trigger={
                            <IconComponent
                              name="meatball"
                              padding={8}
                              width={24}
                              height={24}
                              isBtn
                            />
                          }
                          menuItems={[
                            {
                              label: "삭제하기",
                              onClick: () => handleCommentDelete(reply.id),
                              isDelete: true,
                            },
                          ]}
                        />
                      ) : (
                        <Dropdown
                          trigger={
                            <IconComponent
                              name="meatball"
                              padding={8}
                              width={24}
                              height={24}
                              isBtn
                            />
                          }
                          menuItems={[
                            {
                              label: "신고하기",
                              onClick: handleReport,
                              isDelete: true,
                            },
                          ]}
                        />
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // 댓글 영역
  const renderComment = (comment: FeedsCommentsResponse["comments"][number]) => {
    const isReplyActive = activeReplyId === comment.id;
    const isExpanded = expandedComments.has(comment.id);

    return (
      <div key={comment.id} className={styles.comment}>
        <div className={styles.commentBox}>
          <Link href={`/users/${comment.writer.id}`}>
            {comment.writer.image !== "https://image.grimity.com/null" ? (
              <Image
                src={comment.writer.image}
                width={40}
                height={40}
                alt="댓글 프로필"
                className={styles.writerImage}
              />
            ) : (
              <Image
                src="/image/default.svg"
                width={40}
                height={40}
                alt="댓글 프로필"
                className={styles.writerImage}
              />
            )}
          </Link>
          <div className={styles.commentBody}>
            <div className={styles.writerReply}>
              <div className={styles.writerLeft}>
                <div className={styles.writerCreatedAt}>
                  <Link href={`/users/${comment.writer.id}`}>
                    <div className={styles.writerName}>
                      {comment.writer.name}
                      {comment.writer.id === feedWriterId && (
                        <Chip size="s" type="filled-secondary">
                          작성자
                        </Chip>
                      )}
                    </div>
                  </Link>
                  <p className={styles.createdAt}>{timeAgo(comment.createdAt)}</p>
                </div>
                <p className={styles.commentText}>{comment.content}</p>
                <div className={styles.likeReplyBtn}>
                  <div
                    className={styles.likeButton}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleLikeClick(comment.id, comment.isLike);
                    }}
                  >
                    <Image
                      src={
                        comment.isLike ? "/icon/comment-like-on.svg" : "/icon/comment-like-off.svg"
                      }
                      width={24}
                      height={24}
                      alt="좋아요"
                      className={styles.likeIcon}
                    />
                    {comment.likeCount}
                  </div>
                  <p
                    onClick={() =>
                      handleReply(comment.id, { id: comment.writer.id, name: comment.writer.name })
                    }
                    className={styles.replyBtn}
                  >
                    {isReplyActive ? "취소" : "답글"}
                  </p>
                </div>
              </div>
              {isLoggedIn && (
                <div className={styles.replyBtnDropdown}>
                  {comment.writer.id === user_id ? (
                    <Dropdown
                      trigger={
                        <IconComponent name="meatball" padding={8} width={24} height={24} isBtn />
                      }
                      menuItems={[
                        {
                          label: "삭제하기",
                          onClick: () => handleCommentDelete(comment.id),
                          isDelete: true,
                        },
                      ]}
                    />
                  ) : (
                    <Dropdown
                      trigger={
                        <IconComponent name="meatball" padding={8} width={24} height={24} isBtn />
                      }
                      menuItems={[
                        {
                          label: "신고하기",
                          onClick: handleReport,
                          isDelete: true,
                        },
                      ]}
                    />
                  )}
                </div>
              )}
            </div>
            {comment.childCommentCount > 0 && (
              <div className={styles.viewReplies}>
                <button
                  onClick={() => toggleChildComments(comment.id)}
                  className={styles.viewRepliesBtn}
                >
                  {isExpanded ? "답글 숨기기" : `답글 ${comment.childCommentCount}개 보기`}
                  {isExpanded ? (
                    <IconComponent name="replyFold" width={16} height={16} isBtn />
                  ) : (
                    <IconComponent name="replySeeMore" width={16} height={16} isBtn />
                  )}
                </button>
                {isExpanded && <ChildComments parentId={comment.id} />}
              </div>
            )}
            {/* 답글 입력창 */}
            {isReplyActive && (
              <div className={styles.input}>
                {isLoggedIn && userData ? (
                  <Image
                    src={
                      userData.image !== "https://image.grimity.com/null"
                        ? userData.image
                        : "/image/default.svg"
                    }
                    width={24}
                    height={24}
                    alt="프로필 이미지"
                    className={styles.writerImage}
                  />
                ) : (
                  <Image
                    src="/image/default.svg"
                    width={24}
                    height={24}
                    alt="프로필 이미지"
                    className={styles.writerImage}
                  />
                )}
                <TextField
                  ref={replyInputRef}
                  placeholder={isLoggedIn ? "답글 달기" : "회원만 답글 달 수 있어요!"}
                  value={replyText}
                  onChange={handleReplyTextChange}
                  onFocus={() => {
                    if (!isLoggedIn) {
                      showToast("회원만 답글 달 수 있어요!", "error");
                    }
                  }}
                  isReply
                />
                <div className={styles.submitBtn}>
                  <Button
                    size="m"
                    type="filled-primary"
                    onClick={handleReplySubmit}
                    disabled={!isLoggedIn}
                  >
                    답글
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={styles.container}>
      <section className={styles.inputContainer}>
        {isLoggedIn && userData ? (
          <Image
            src={
              userData.image !== "https://image.grimity.com/null"
                ? userData.image
                : "/image/default.svg"
            }
            width={40}
            height={40}
            alt="프로필 이미지"
            className={styles.writerImage}
          />
        ) : (
          <Image
            src="/image/default.svg"
            width={40}
            height={40}
            alt="프로필 이미지"
            className={styles.writerImage}
          />
        )}
        <TextField
          placeholder={isLoggedIn ? "댓글 달기" : "회원만 댓글 달 수 있어요!"}
          value={comment}
          onChange={handleCommentChange}
          onFocus={() => {
            if (!isLoggedIn) {
              showToast("회원만 댓글 달 수 있어요!", "error");
            }
          }}
        />
        <div className={styles.submitBtn}>
          <Button
            size="l"
            type="filled-primary"
            onClick={handleCommentSubmit}
            disabled={!isLoggedIn}
          >
            댓글
          </Button>
        </div>
      </section>
      <section>{commentsData?.comments.map((comment) => renderComment(comment))}</section>
    </div>
  );
}
