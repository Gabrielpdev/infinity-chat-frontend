/* eslint-disable react/display-name */

import React, { RefObject } from "react";

interface ButtontProps extends React.HTMLProps<HTMLButtonElement> {
  children: React.ReactNode;
  isLoading?: boolean;
  type?: "button" | "submit" | "reset";
  ref?: RefObject<HTMLButtonElement>;
}

const Button = React.forwardRef(
  (
    { children, isLoading, ...rest }: ButtontProps,
    ref: React.ForwardedRef<HTMLButtonElement>
  ) => {
    return (
      <button
        type={rest.type}
        ref={ref}
        disabled={rest.disabled || isLoading}
        {...rest}
        className={`bg-highlight-500 p-2 rounded-md text-white ${rest.className}`}
      >
        {isLoading ? (
          <svg className="mr-3 size-5 animate-spin ..." viewBox="0 0 24 24" />
        ) : (
          children
        )}
      </button>
    );
  }
);

export default Button;
