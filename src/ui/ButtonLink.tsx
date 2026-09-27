import React from "react";
import { Link, LinkProps } from "react-router-dom";
import { buttonClass, ButtonSize, ButtonVariant } from "./Button";

type Props = LinkProps & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
};

/** A router link styled as a button (valid HTML: no button inside <a>). */
export const ButtonLink: React.FC<Props> = ({
  variant,
  size,
  fullWidth,
  className,
  ...rest
}) => (
  <Link
    className={buttonClass({
      variant,
      size,
      fullWidth,
      className: typeof className === "string" ? className : undefined,
    })}
    {...rest}
  />
);
