import { useToast } from "@/hooks/useToast";
import Image from "next/image";
import styles from "./SharePost.module.scss";
import { modalState } from "@/states/modalState";
import { useRecoilState } from "recoil";
import Button from "@/components/Button/Button";
import { serviceUrl } from "@/constants/serviceurl";
import { ShareBtnProps } from "@/components/Board/Detail/ShareBtn/ShareBtn.types";

export default function SharePost({ postId, title }: ShareBtnProps) {
  const { showToast } = useToast();
  const [, setModal] = useRecoilState(modalState);
  const url = `${serviceUrl}posts/${postId}`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(url);
      showToast("클립보드에 복사되었습니다.", "success");
      setModal({ isOpen: false, type: null, data: null });
    } catch {
      showToast("클립보드 복사에 실패했습니다.", "error");
    }
  };

  const handleKaKaoShare = () => {
    if (!window.Kakao) {
      showToast("카카오톡 SDK가 로드되지 않았습니다.", "error");
      return;
    }

    const { Kakao } = window;
    if (!Kakao.isInitialized()) {
      Kakao.init(process.env.NEXT_PUBLIC_KAKAO_APP_KEY);
    }

    Kakao.Share.sendDefault({
      objectType: "feed",
      content: {
        title: "그림 커뮤니티 그리미티",
        description: title,
        imageUrl: "https://avatars.githubusercontent.com/u/194518500?s=200&v=4",
        link: { mobileWebUrl: url, webUrl: url },
      },
    });

    setModal({ isOpen: false, type: null, data: null });
  };

  const handleTwitterShare = () => {
    const text = "이 글 같이 봐요!";
    window.open("https://twitter.com/intent/tweet?text=" + text + "&url=" + url);
  };

  return (
    <div className={styles.container}>
      <div className={styles.messageContainer}>
        <Image src="/image/logo.svg" width={120} height={34} alt="logo" />
        <p className={styles.text}>그리미티의 글을 공유해보세요!</p>
      </div>
      <div className={styles.buttonContainer}>
        <Button
          size="l"
          type="outlined-assistive"
          onClick={copyToClipboard}
          leftIcon={<Image src="/icon/copy.svg" width={20} height={20} alt="클립보드 복사" />}
        >
          링크 복사하기
        </Button>
        <Button
          size="l"
          type="outlined-assistive"
          onClick={handleTwitterShare}
          leftIcon={<Image src="/icon/twitter.svg" width={20} height={20} alt="트위터 공유" />}
        >
          트위터에 공유
        </Button>
        <Button
          size="l"
          type="outlined-assistive"
          onClick={handleKaKaoShare}
          leftIcon={<Image src="/icon/kakaotalk.svg" width={20} height={20} alt="카카오톡 공유" />}
        >
          카톡으로 공유
        </Button>
      </div>
    </div>
  );
}
