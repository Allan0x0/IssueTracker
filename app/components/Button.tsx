import type { ComponentProps } from "react";
import { twMerge } from "tailwind-merge";

interface Props extends ComponentProps<'button'> { }
export function Button(props: Props) {
  const { className, children, type = "button", ...rest } = props;
  return (
    <button
      type={type}
      className={twMerge("bg-blue-600 rounded-md px-4 py-2 text-white hover:bg-blue-500", props.disabled && "bg-stone-400", className)}
      {...rest}
    >
      {children}
    </button>
  )
}