import styles from "./SidebarFooterItem.module.scss";
import IconComponent from "@/components/Asset/Icon";
import { ICONS } from "@/constants/asset";
import { useDeviceStore } from "@/states/deviceStore";

type FooterIconName = "noti" | "ask" | "notiM" | "askM";

interface SidebarFooterItemProps {
  icon: FooterIconName;
  label: string;
  onClickItem: () => void;
  isHaveDropdown: boolean;
  isDropdownOpen: boolean;
}

const SidebarFooterItem = ({
  icon,
  label,
  onClickItem,
  isHaveDropdown,
  isDropdownOpen,
}: SidebarFooterItemProps) => {
  const isMobile = useDeviceStore((state) => state.isMobile);

  const resolvedIcon = isMobile
    ? icon === "noti"
      ? "notiM"
      : icon === "ask"
      ? "askM"
      : icon
    : icon;

  if (!ICONS[resolvedIcon as keyof typeof ICONS]) {
    return null;
  }

  return (
    <div className={styles.sidebarItem} onClick={onClickItem}>
      <div className={styles.wrapper}>
        <div className={styles.icon}>
          <IconComponent name={resolvedIcon} size={15} />
        </div>
        <span className={styles.label}>{label}</span>
        {isHaveDropdown && (
          <div className={styles.dropdownIcon}>
            <IconComponent
              name={isDropdownOpen ? "footerDropdownActive" : "footerDropdown"}
              size={10}
              padding={6}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default SidebarFooterItem;
export type { FooterIconName };
