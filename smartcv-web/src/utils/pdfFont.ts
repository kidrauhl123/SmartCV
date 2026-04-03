// 使用 Google Fonts 的 Noto Sans SC 中文字体
export const loadChineseFont = async () => {
  try {
    const response = await fetch('https://fonts.gstatic.com/s/notosanssc/v36/k3kXo84MPvpLmixcA63oeALhL4iJ-Q7m8w.woff2');
    const fontData = await response.arrayBuffer();
    return fontData;
  } catch (error) {
    console.error('加载字体失败:', error);
    return null;
  }
};
