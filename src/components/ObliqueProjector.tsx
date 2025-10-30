// Popup.tsx
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface PopupProps {
  message: string;
  duration?: number;        // 表示滞在時間（ms）
  onClose?: () => void;
}

export const Popup: React.FC<PopupProps> = ({
  message,
  duration = 2000,
  onClose,
}) => {
  const [visible, setVisible] = useState<boolean>(false);

  useEffect(() => {
    // 出現させる
    setVisible(true);
    // duration 後に消えるアニメーションへ
    const timeout = window.setTimeout(() => {
      setVisible(false);
    }, duration);
    return () => {
      window.clearTimeout(timeout);
    };
  }, [duration]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: "100%", opacity: 0 }}        // 下からスタート
          animate={{ y: 0, opacity: 1 }}             // 中央まで移動して表示
          exit={{ opacity: 0 }}                       // 消えるフェードアウト
          transition={{
            // 出現と停止の速度
            y: { type: "spring", stiffness: 100, damping: 20 },
            opacity: { duration: 0.3 },
          }}
          style={{
            position: "fixed",
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%)",
            background: "white",
            padding: "1em 2em",
            borderRadius: "8px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
            zIndex: 1000,
          }}
          onAnimationComplete={(definition) => {
            // exit アニメーションが完了したら onClose を呼ぶ
            if (definition === "exit") {
              onClose?.();
            }
          }}
        >
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  );
};