import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import styles from "./Header.module.scss";
import Button from "@/components/Button/Button";
import Link from "next/link";
import IconComponent from "@/components/Asset/Icon";
import { useModalStore } from "@/states/modalStore";
import { useAuthStore } from "@/states/authStore";
import { useMyData } from "@/api/users/getMe";
import { useRouter } from "next/router";
import { useToast } from "@/hooks/useToast";
import Notifications from "@/components/Notifications/Notifications";
import { useDeviceStore } from "@/states/deviceStore";
import { useIsMobile } from "@/hooks/useIsMobile";
import useAuthCheck from "@/hooks/useAuthCheck";
import { usePreventScroll } from "@/hooks/usePreventScroll";
import axiosInstance from "@/constants/baseurl";
import { FOOTER_ITEMS } from "@/constants/footer";
import SidebarFooterItem, { FooterIconName } from "../Sidebar/SidebarFooterItem/SidebarFooterItem";

export default function Header() {
  const openModal = useModalStore((state) => state.openModal);
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const setAccessToken = useAuthStore((state) => state.setAccessToken);
  const setIsLoggedIn = useAuthStore((state) => state.setIsLoggedIn);
  const setUserId = useAuthStore((state) => state.setUserId);
  const { data: myData } = useMyData();
  const [activeNav, setActiveNav] = useState("홈");
  const activeItemRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLDivElement>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const askDropdownRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const { showToast } = useToast();
  const router = useRouter();
  const isMobile = useDeviceStore((state) => state.isMobile);
  const isTablet = useDeviceStore((state) => state.isTablet);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSubMenuOpen, setIsSubMenuOpen] = useState(false);
  const [isAskDropdownOpen, setIsAskDropdownOpen] = useState(false);
  const isPostPage = ["/board", "/board/write", "/posts/[id]", "/posts/[id]/edit"].includes(
    router.pathname,
  );
  const isNavPage = ["/", "/popular", "/board", "/following", "/board/write"].includes(
    router.pathname,
  );
  const hideBtn = ["/write", "/feeds/[id]/edit", "/board/write", "/posts/[id]/edit"].includes(
    router.pathname,
  );
  const [isHome, setIsHome] = useState(false);
  useAuthCheck(setIsHome);
  useIsMobile();
  const email = "grimity.official@gmail.com";
  const navItems = [
    { name: "홈", path: "/" },
    { name: "인기그림", path: "/popular" },
    { name: "자유게시판", path: "/board" },
  ];

  if (isLoggedIn) {
    navItems.push({ name: "팔로잉", path: "/following" });
  }

  let name: "bellActive" | "bell";

  if (myData?.hasNotification) {
    name = "bellActive";
  } else {
    name = "bell";
  }

  useEffect(() => {
    if (showNotifications) {
      window.history.pushState({ isNotificationOpen: true }, "", window.location.href);

      function handlePopState(event: PopStateEvent) {
        setShowNotifications(false);
      }

      window.addEventListener("popstate", handlePopState);

      return () => {
        window.removeEventListener("popstate", handlePopState);
      };
    }
  }, [isMobile, showNotifications]);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(email);
      showToast("이메일이 복사되었습니다!", "success");
    } catch (error) {
      console.error("클립보드 복사 실패:", error);
      showToast("복사에 실패했습니다.", "success");
    }
  };

  const handleNavClick = (item: { name: string; path: string }) => {
    setActiveNav(item.name);
    if (isMobile) {
      setIsMenuOpen(false);
    }

    if (router.pathname === item.path) {
      router.reload();
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      router.push(item.path);
    }
  };

  const handleLogout = async () => {
    try {
      const refreshToken = localStorage.getItem("refresh_token");
      if (refreshToken) {
        await axiosInstance.post(
          "/auth/logout",
          {},
          {
            headers: {
              Authorization: `Bearer ${refreshToken}`,
              "exclude-access-token": true,
            },
          },
        );
      }
    } catch (error) {
      console.error("Logout failed", error);
    } finally {
      localStorage.clear();
      setIsLoggedIn(false);
      setAccessToken("");
      setUserId("");
      router.push("/");
      window.scrollTo({ top: 0, behavior: "smooth" });
      if (isMobile || isTablet) {
        setIsMenuOpen(false);
      }
    }
  };

  useEffect(() => {
    setIsDropdownOpen(false);
  }, [isLoggedIn]);

  useEffect(() => {
    const currentPath = router.pathname;
    const activeItem = navItems.find(
      (item) =>
        currentPath === item.path || (item.path === "/board" && currentPath.startsWith("/board/")),
    );
    if (activeItem) {
      setActiveNav(activeItem.name);
    }
  }, [router.pathname]);

  useEffect(() => {
    if (isNavPage && activeItemRef.current && indicatorRef.current) {
      const { offsetLeft, offsetWidth } = activeItemRef.current;
      indicatorRef.current.style.transform = `translateX(${offsetLeft}px)`;
      indicatorRef.current.style.width = `${offsetWidth}px`;
    } else if (!isNavPage && indicatorRef.current) {
      indicatorRef.current.style.transform = "none";
      indicatorRef.current.style.width = "0px";
    }
  }, [activeNav]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (askDropdownRef.current && !askDropdownRef.current.contains(event.target as Node)) {
        setIsAskDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleClickLogo = () => {
    if (router.pathname === "/") {
      router.reload();
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      router.push("/");
    }
  };

  const toggleNotifications = () => {
    setShowNotifications((prev) => !prev);
  };

  const toggleMenu = () => {
    setIsMenuOpen((prev) => !prev);
  };

  const toggleSubmenu = () => {
    setIsSubMenuOpen((prev) => !prev);
  };

  const handleFooterClick = (itemIcon: FooterIconName, route?: string) => {
    if (route) {
      router.push(route);
    } else if (itemIcon === "ask") {
      setIsAskDropdownOpen(!isAskDropdownOpen);
    }
  };

  usePreventScroll(isMenuOpen || (isMobile && showNotifications));

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <div className={styles.leftSection}>
          <div className={styles.cursor} onClick={handleClickLogo}>
            <img src={"/image/logo.svg"} width={100} height={29} alt="logo" loading="lazy" />
          </div>
        </div>
        <div className={styles.wrapper}>
          {isMobile && !isLoggedIn && (
            <div className={styles.uploadBtn} onClick={() => openModal({ type: "LOGIN" })}>
              <Button size="s" type="filled-primary">
                로그인
              </Button>
            </div>
          )}
          {!hideBtn &&
            !isMobile &&
            isLoggedIn &&
            (isPostPage ? (
              <Link href="/board/write">
                <Button size="m" type="filled-primary">
                  글 쓰기
                </Button>
              </Link>
            ) : (
              <Link href="/write">
                <Button size="m" type="filled-primary">
                  그림 업로드
                </Button>
              </Link>
            ))}
          <div className={styles.icons}>
            <Link href="/search">
              <IconComponent name="search" size={24} padding={8} isBtn />
            </Link>
            {(!isMobile || !isTablet) && isLoggedIn && myData && (
              <div className={styles.notificationWrapper} ref={notificationRef}>
                <div className={styles.notification} onClick={toggleNotifications}>
                  <IconComponent name={name} size={40} isBtn />
                </div>
                {showNotifications && <Notifications onClose={() => setShowNotifications(false)} />}
              </div>
            )}
          </div>
          {!isMobile ? (
            isLoggedIn && myData ? (
              <div className={styles.profileContact}>
                <div className={styles.profileSection}>
                  <div
                    className={styles.profileContainer}
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  >
                    <Image
                      src={myData.image || "/image/default.svg"}
                      width={28}
                      height={28}
                      alt="프로필 이미지"
                      className={styles.profileImage}
                      quality={50}
                      style={{ objectFit: "cover" }}
                      unoptimized
                    />
                  </div>
                  {isDropdownOpen && (
                    <div className={styles.dropdown} ref={dropdownRef}>
                      <Link href={`/${myData.url}`}>
                        <div
                          className={styles.dropdownItem}
                          onClick={() => {
                            setIsDropdownOpen(false);
                            window.scrollTo(0, 0);
                          }}
                        >
                          <Image
                            src={myData.image ?? "/image/default.svg"}
                            width={32}
                            height={32}
                            alt="프로필 이미지"
                            className={styles.profileImage}
                            quality={50}
                            style={{ objectFit: "cover" }}
                            unoptimized
                          />
                          <span>내 프로필</span>
                        </div>
                      </Link>
                      <div className={styles.divider} />
                      <Link href="/mypage?tab=liked-feeds">
                        <div
                          className={styles.dropdownItem}
                          onClick={() => {
                            setIsDropdownOpen(false);
                            window.scrollTo(0, 0);
                          }}
                        >
                          좋아요한 그림
                        </div>
                      </Link>
                      <Link href="/mypage?tab=saved-feeds">
                        <div
                          className={styles.dropdownItem}
                          onClick={() => {
                            setIsDropdownOpen(false);
                            window.scrollTo(0, 0);
                          }}
                        >
                          저장한 그림
                        </div>
                      </Link>
                      <div className={styles.divider} />
                      <Link href="/mypage?tab=saved-posts">
                        <div
                          className={styles.dropdownItem}
                          onClick={() => {
                            setIsDropdownOpen(false);
                            window.scrollTo(0, 0);
                          }}
                        >
                          저장한 글
                        </div>
                      </Link>
                      <div className={styles.divider} />
                      <div
                        className={`${styles.dropdownItem} ${styles.logout}`}
                        onClick={() => {
                          handleLogout();
                          setIsDropdownOpen(false);
                        }}
                      >
                        로그아웃
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className={styles.uploadBtn} onClick={() => openModal({ type: "LOGIN" })}>
                <Button size="m" type="filled-primary">
                  로그인
                </Button>
              </div>
            )
          ) : (
            <>
              <div onClick={toggleMenu}>
                <IconComponent name="hamburger" size={24} padding={8} isBtn />
              </div>
              <div
                className={`${styles.overlay} ${isMenuOpen ? styles.open : ""}`}
                onClick={(e) => {
                  if (e.target === e.currentTarget) {
                    toggleMenu();
                  }
                }}
              >
                <div
                  className={`${styles.sideMenu} ${isMenuOpen ? styles.open : ""}`}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className={styles.menuContentWrapper}>
                    <div className={styles.navUpload}>
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleMenu();
                        }}
                        className={styles.closeBtn}
                      >
                        <IconComponent name="x" size={24} isBtn />
                      </div>
                    </div>
                    {!isLoggedIn || !myData ? (
                      <>
                        <div
                          className={isMobile ? styles.uploadBtnContainer : styles.uploadBtn}
                          onClick={() => openModal({ type: "LOGIN" })}
                        >
                          <Button size="l" type="filled-primary">
                            로그인
                          </Button>
                        </div>
                        <nav className={styles.nav}>
                          {navItems.map((item, index) => (
                            <div
                              key={index}
                              className={styles.navItem}
                              onClick={() => {
                                handleNavClick(item);
                                toggleMenu();
                              }}
                            >
                              <p
                                className={`${styles.item} ${
                                  isNavPage && (activeNav === item.name ? styles.active : "")
                                }`}
                              >
                                {item.name}
                              </p>
                            </div>
                          ))}
                        </nav>
                      </>
                    ) : (
                      <div className={styles.mobileProfile}>
                        <div className={styles.profileSubmenu}>
                          <Link href={`/${myData?.url}`} className={styles.mobileMyInfo}>
                            <Image
                              src={myData?.image || "/image/default.svg"}
                              width={32}
                              height={32}
                              alt="프로필 이미지"
                              className={styles.profileImage}
                              quality={50}
                              style={{ objectFit: "cover" }}
                              unoptimized
                            />
                            <span className={styles.name}>{myData?.name}</span>
                          </Link>
                          <div
                            className={styles.submenu}
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleSubmenu();
                            }}
                          >
                            <IconComponent name={isSubMenuOpen ? "menuUp" : "menuDown"} size={20} />
                          </div>
                        </div>
                        {isSubMenuOpen && (
                          <div className={styles.btns}>
                            <Link href="/mypage?tab=liked-feeds">
                              <button className={styles.itemBtn}>
                                <IconComponent name="menuSave" size={18} isBtn />
                                저장한 컨텐츠
                              </button>
                            </Link>
                            <button className={styles.itemBtn} onClick={handleLogout}>
                              <IconComponent name="menuLogout" size={18} isBtn />
                              로그아웃
                            </button>
                          </div>
                        )}
                        <div className={styles.uploadBtn}>
                          <Link href="/write">
                            <Button
                              size="l"
                              type="filled-primary"
                              leftIcon={<IconComponent name="menuUpload" size={16} />}
                            >
                              그림 업로드
                            </Button>
                          </Link>
                        </div>
                        <div className={styles.bar} />
                        <nav className={styles.nav}>
                          {navItems.map((item, index) => (
                            <div
                              key={index}
                              className={styles.navItem}
                              onClick={() => {
                                handleNavClick(item);
                                toggleMenu();
                              }}
                            >
                              <p
                                className={`${styles.item} ${
                                  isNavPage && (activeNav === item.name ? styles.active : "")
                                }`}
                              >
                                {item.name}
                              </p>
                            </div>
                          ))}
                        </nav>
                      </div>
                    )}
                  </div>

                  <div className={styles.mobileFooterWrap}>
                    <div className={styles.footerMenu}>
                      {FOOTER_ITEMS.map((item, index) => (
                        <SidebarFooterItem
                          key={index}
                          icon={item.icon as FooterIconName}
                          label={item.label}
                          onClickItem={() => handleFooterClick(item.icon, item.route)}
                          isHaveDropdown={item.isHaveDropdown}
                          isDropdownOpen={item.icon === "ask" ? isAskDropdownOpen : false}
                        />
                      ))}
                    </div>
                    {isAskDropdownOpen && (
                      <div className={styles.dropdown} ref={askDropdownRef}>
                        <a
                          href="https://open.kakao.com/o/sKYFewgh"
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.dropdownItem}
                        >
                          카카오톡으로 문의하기
                        </a>
                        <div onClick={copyToClipboard} className={styles.dropdownItem}>
                          메일로 보내기
                        </div>
                      </div>
                    )}
                    <div className={styles.subLink}>
                      <a
                        href="https://nostalgic-patch-498.notion.site/1930ac6bf29881b9aa19ff623c69b8e6?pvs=74"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        이용약관
                      </a>
                      <a
                        href="https://nostalgic-patch-498.notion.site/1930ac6bf29881e9a3e4c405e7f49f2b?pvs=73"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        개인정보취급방침
                      </a>
                    </div>
                    <p className={styles.copy}>© Grimity. All rights reserved.</p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
