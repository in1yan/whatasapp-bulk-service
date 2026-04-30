"use client";

import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "success" | "ghost";
}

export const Button = ({ variant = "primary", className = "", ...props }: ButtonProps) => {
  const baseStyles = "px-5 py-1 rounded-[4px] font-mono font-medium text-base transition-colors duration-150 active:translate-y-[1px]";
  
  const variants = {
    primary: "bg-background border border-border-gray text-foreground hover:bg-dark-surface",
    secondary: "bg-dark-surface border border-border-warm text-foreground hover:bg-mid-gray/20",
    danger: "bg-danger-red text-foreground hover:bg-danger-red/80",
    success: "bg-success-green text-foreground hover:bg-success-green/80",
    ghost: "bg-transparent text-mid-gray hover:text-foreground",
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${className}`}
      {...props}
    />
  );
};
