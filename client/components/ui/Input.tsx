"use client";

import React from "react";

export const Input = ({ className = "", ...props }: React.InputHTMLAttributes<HTMLInputElement>) => {
  return (
    <input
      className={`w-full bg-[#f8f7f7] border border-border-warm rounded-[6px] px-5 py-4 text-background font-mono focus:outline-none focus:border-accent-blue transition-colors ${className}`}
      {...props}
    />
  );
};

export const Textarea = ({ className = "", ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => {
  return (
    <textarea
      className={`w-full bg-[#f8f7f7] border border-border-warm rounded-[6px] px-5 py-4 text-background font-mono focus:outline-none focus:border-accent-blue transition-colors min-h-[120px] ${className}`}
      {...props}
    />
  );
};
