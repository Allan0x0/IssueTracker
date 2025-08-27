import type { ComponentProps } from "react";
import { twMerge } from "tailwind-merge";

interface Props extends ComponentProps<'input'> {
  label: string;
}
export function Input(props: Props) {
  const { type, className, label, ...rest } = props;
  return (
    <div className="flex flex-col items-stretch gap-1">
      <span className="text-xs text-stone-400 font-light">{label}</span>
      <input
        type={type}
        className={twMerge("px-4 py-2 border border-blue-600 rounded-md", className)}
        {...rest}
      />
    </div>
  )
}

interface SelectProps extends ComponentProps<'select'> {
  label: string;
}
export function Select(prosp: SelectProps) {
  const { className, label, children, ...rest } = prosp;
  return (
    <div className="flex flex-col items-stretch gap-1">
      <span className="text-xs text-stone-400 font-light">{label}</span>
      <select className={twMerge("px-4 py-2 border border-blue-600 rounded-md", className)} {...rest}>
        {children}
      </select>
    </div>
  )
}

interface TextAreaProps extends ComponentProps<'textarea'> {
  label: string;
}
export function TextArea(props: TextAreaProps) {
  const { className, label, ...rest } = props;
  return (
    <div className="flex flex-col items-stretch gap-1">
      <span className="text-xs text-stone-400 font-light">{label}</span>
      <textarea className={twMerge("px-4 py-2 border border-blue-600 rounded-md")} {...rest}></textarea>
    </div>
  )
}