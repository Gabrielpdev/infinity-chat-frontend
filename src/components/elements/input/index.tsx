/* eslint-disable react/display-name */

import React, { RefObject } from "react";

interface InputProps extends React.HTMLProps<HTMLInputElement> {
  ref?: RefObject<HTMLInputElement>;
}

const Input = React.forwardRef(
  (props: InputProps, ref: React.ForwardedRef<HTMLInputElement>) => {
    return (
      <input
        ref={ref}
        {...props}
        className={`border border-gray-300 p-2 rounded-md text-dark-500 font-medium  ${props.className}`}
      />
    );
  }
);

export default Input;
