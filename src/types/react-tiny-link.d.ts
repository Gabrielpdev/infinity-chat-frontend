declare module "react-tiny-link" {
  import { ComponentType } from "react";

  interface ReactTinyLinkProps {
    cardSize?: "small" | "large";
    showGraphic?: boolean;
    maxLine?: number;
    minLine?: number;
    url: string;
  }

  const ReactTinyLink: ComponentType<ReactTinyLinkProps>;

  export { ReactTinyLink };
}
