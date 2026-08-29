import React from "react";

export interface PageContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  maxWidth?: "default" | "full" | "narrow";
}

export function PageContainer({
  maxWidth = "default",
  className = "",
  children,
  ...props
}: PageContainerProps) {
  const maxWidthStyles = {
    default: "max-w-6xl",
    full: "max-w-full",
    narrow: "max-w-4xl",
  };

  return (
    <div
      className={`w-full mx-auto p-4 sm:p-6 lg:p-8 ${maxWidthStyles[maxWidth]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
