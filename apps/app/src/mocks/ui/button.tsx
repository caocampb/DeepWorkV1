import React from 'react';

// Mock Button component
export const Button = ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { children?: React.ReactNode }) => {
  return <button {...props}>{children}</button>;
};

export default Button; 