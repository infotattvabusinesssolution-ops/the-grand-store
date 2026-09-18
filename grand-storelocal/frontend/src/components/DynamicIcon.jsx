import React from 'react';
import * as LucideIcons from 'lucide-react';

// Helper to convert string like "flame" or "FLAME" to "Flame", "help-circle" to "HelpCircle"
const toPascalCase = (string) => {
  if (!string) return '';
  return string
    .match(/[a-z0-9]+/gi)
    ?.map((word) => word.charAt(0).toUpperCase() + word.substr(1).toLowerCase())
    .join('') || '';
};

const DynamicIcon = ({ name, size = 24, className = "" }) => {
  const pascalName = toPascalCase(name);
  const IconComponent = LucideIcons[pascalName] || LucideIcons[name];

  if (!IconComponent) {
    // Return a default icon or null if the specified icon doesn't exist
    const FallbackIcon = LucideIcons['HelpCircle'];
    return <FallbackIcon size={size} className={className} />;
  }

  return <IconComponent size={size} className={className} />;
};

export default DynamicIcon;
