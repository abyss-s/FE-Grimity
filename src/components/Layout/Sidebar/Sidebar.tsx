import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/router";
import SidebarItem, { BaseIconName } from "./SidebarItem/SidebarItem";
import SidebarFooterItem, { FooterIconName } from "./SidebarFooterItem/SidebarFooterItem";
import styles from "./Sidebar.module.scss";
import { MENU_ITEMS } from "@/constants/menu";
import { FOOTER_ITEMS } from "@/constants/footer";
import { useAuthStore } from "@/states/authStore";
import { useDeviceStore } from "@/states/deviceStore";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useToast } from "@/hooks/useToast";

const Sidebar = () => {
  const [isAskDropdownOpen, setIsAskDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { showToast } = useToast();
  const email = "grimity.official@gmail.com";
  const { isLoggedIn } = useAuthStore((state) => state);
  const router = useRouter();
  const { isMobile } = useDeviceStore((state) => state);
  useIsMobile();

  const menuItems = isLoggedIn
    ? [...MENU_ITEMS, { icon: "following", label: "팔로잉", route: "following" }]
    : MENU_ITEMS;

  const footerItems = FOOTER_ITEMS;

  const handleItemClick = (route: string) => {
    router.push(`/${route}`);
  };

  const handleFooterClick = (itemIcon: FooterIconName, route?: string) => {
    if (route) {
      router.push(route);
    } else if (itemIcon === "ask") {
      setIsAskDropdownOpen(!isAskDropdownOpen);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(email);
      showToast("이메일이 복사되었습니다!", "success");
    } catch (error) {
      console.error("클립보드 복사 실패:", error);
      showToast("복사에 실패했습니다.", "success");
    }
  };

  const isItemActive = (route: string) => {
    const currentPath = router.pathname;

    if (route === "/" && currentPath === "/") return true;
    if (route === "popular" && currentPath === "/popular") return true;
    if (route === "board" && (currentPath === "/board" || currentPath.startsWith("/posts/")))
      return true;
    if (route === "following" && currentPath === "/following") return true;

    return false;
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsAskDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <>
      {!isMobile && (
        <nav className={styles.container}>
          <div className={styles.menu}>
            {menuItems.map((item, index) => (
              <SidebarItem
                key={index}
                icon={item.icon as BaseIconName}
                label={item.label}
                onClick={() => handleItemClick(item.route)}
                isActive={isItemActive(item.route)}
              />
            ))}
          </div>

          <div className={styles.footer}>
            {footerItems.map((item, index) => (
              <SidebarFooterItem
                key={index}
                icon={item.icon as FooterIconName}
                label={item.label}
                onClickItem={() => handleFooterClick(item.icon, item.route)}
                isHaveDropdown={item.isHaveDropdown}
                isDropdownOpen={item.icon === "ask" ? isAskDropdownOpen : false}
              />
            ))}

            {isAskDropdownOpen && (
              <div className={styles.dropdown} ref={dropdownRef}>
                <a
                  href="https://open.kakao.com/o/sKYFewgh"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.dropdownItem}
                >
                  카카오톡으로 문의하기
                </a>
                <button onClick={copyToClipboard} className={styles.dropdownItem}>
                  메일로 보내기
                </button>
              </div>
            )}
            <div className={styles.subLink}>
              <a
                href="https://nostalgic-patch-498.notion.site/1930ac6bf29881b9aa19ff623c69b8e6?pvs=74"
                target="_blank"
                rel="noopener noreferrer"
              >
                개인정보취급방침
              </a>
              <a
                href="https://nostalgic-patch-498.notion.site/1930ac6bf29881e9a3e4c405e7f49f2b?pvs=73"
                target="_blank"
                rel="noopener noreferrer"
              >
                이용약관
              </a>
            </div>
            <p className={styles.copy}>© Grimity. All rights reserved.</p>
          </div>
        </nav>
      )}
    </>
  );
};

export default Sidebar;
