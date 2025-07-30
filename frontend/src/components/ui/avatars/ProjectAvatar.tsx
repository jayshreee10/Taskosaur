'use client';

import Image from 'next/image'

interface ProjectAvatarProps {
  project: string | { name: string; avatar?: string };
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  color?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info';
}

export default function ProjectAvatar({ 
  project, 
  size = 'md',
  color = 'secondary'
}: ProjectAvatarProps) {
  const sizeClass = `project-avatar-${size}`;
  const colorClass = `project-avatar-${color}`;

  const sizeDimensions = {
    xs: { width: 16, height: 16 },
    sm: { width: 24, height: 24 },
    md: { width: 32, height: 32 },
    lg: { width: 40, height: 40 },
    xl: { width: 48, height: 48 }
  };

  const projectName = typeof project === 'string' ? project : project.name;
  const initial = projectName.charAt(0).toUpperCase();
  const avatarImage = typeof project !== 'string' ? project.avatar : undefined;

  return (
    <div className={`project-avatar ${sizeClass} ${colorClass}`}>
      {avatarImage ? (
        <Image src={avatarImage} alt={projectName} className="h-full w-full rounded-lg object-cover" width={100} height={100} />
      ) : (
        initial
      )}
    </div>
  );
}