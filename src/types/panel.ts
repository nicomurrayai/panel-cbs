/** Vista de un asset de imagen para el panel (resuelto con su URL pública). */
export type MediaAssetView = {
  id: string;
  key: string;
  path: string | null;
  url: string | null;
  alt: string;
  mimeType: string | null;
  width: number | null;
  height: number | null;
};
