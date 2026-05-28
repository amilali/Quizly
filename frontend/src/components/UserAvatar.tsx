import { cn } from "@/lib/utils"

interface UserAvatarProps {
  name: string;
  role?: string;
  className?: string;
  avatarSize?: "sm" | "md" | "lg";
}

export function UserAvatar({ name, role, className, avatarSize = "md" }: UserAvatarProps) {
  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/);
    if (parts.length === 0 || !parts[0]) return '';
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const sizeClasses = {
    sm: "w-10 h-10 text-sm",
    md: "w-12 h-12 text-lg",
    lg: "w-16 h-16 text-2xl"
  };

  const textClasses = {
    sm: { name: "text-sm", role: "text-[11px]" },
    md: { name: "text-[17px]", role: "text-[14px]" },
    lg: { name: "text-xl", role: "text-base" }
  };

  return (
    <div className={cn("flex items-center gap-4", className)}>
      <div 
        className={cn(
          "rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold shrink-0",
          sizeClasses[avatarSize]
        )}
      >
        {getInitials(name)}
      </div>
      {(name || role) && (
        <div className="flex flex-col justify-center">
          {name && <span className={cn("font-extrabold text-foreground leading-tight tracking-tight", textClasses[avatarSize].name)}>{name}</span>}
          {role && <span className={cn("text-muted-foreground font-semibold leading-tight mt-0.5", textClasses[avatarSize].role)}>{role}</span>}
        </div>
      )}
    </div>
  );
}
