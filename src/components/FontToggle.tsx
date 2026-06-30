"use client";

import { useEffect, useState } from "react";

/** 对话字体切换：像素(默认) ↔ 清晰(系统圆体)。全局生效 + localStorage 记忆。 */
export default function FontToggle() {
  const [clear, setClear] = useState(false);

  useEffect(() => {
    const v = typeof localStorage !== "undefined" && localStorage.getItem("fde-font") === "clear";
    setClear(v);
    document.documentElement.dataset.font = v ? "clear" : "pixel";
  }, []);

  const toggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    const v = !clear;
    setClear(v);
    document.documentElement.dataset.font = v ? "clear" : "pixel";
    try { localStorage.setItem("fde-font", v ? "clear" : "pixel"); } catch { /* ignore */ }
  };

  return (
    <button className="font-toggle" onClick={toggle} title="切换对话字体">
      字体：{clear ? "清晰" : "像素"}
    </button>
  );
}
