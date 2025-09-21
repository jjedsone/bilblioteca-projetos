// src/router.ts
export const goEditor = (pid?: string) => {
  location.hash = pid ? `#/editor?pid=${encodeURIComponent(pid)}` : "#/editor";
};

export const goLibrary = () => {
  location.hash = "#/biblioteca";
};
