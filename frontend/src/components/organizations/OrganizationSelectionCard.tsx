import { Organization } from "@/utils/api";
import { Badge, Card, CardContent } from "../ui";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { HiCalendar, HiCheck, HiClock } from "react-icons/hi";
import { HiBuildingOffice2, HiRocketLaunch } from "react-icons/hi2";

const OrganizationSelectionCard = ({ 
  organization, 
  isSelected, 
  onSelect 
}: { 
  organization: Organization; 
  isSelected: boolean; 
  onSelect: (org: Organization) => void;
}) => {
  const getInitials = (name: string) => {
    return name?.charAt(0)?.toUpperCase() || '?';
  };

  return (
    <Card 
      className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
        isSelected 
          ? 'border-[var(--primary)] bg-[var(--primary)]/5 shadow-sm' 
          : 'border-[var(--border)] hover:border-[var(--primary)]/50'
      }`}
      onClick={() => onSelect(organization)}
    >
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <Avatar className="h-12 w-12 flex-shrink-0">
            <AvatarFallback className="bg-gradient-to-br from-[var(--primary)] to-[var(--primary)]/80 text-[var(--primary-foreground)] text-lg font-bold">
              {getInitials(organization.name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-lg font-semibold text-[var(--foreground)] truncate">
                {organization.name}
              </h3>
              {isSelected && (
                <div className="w-6 h-6 rounded-full bg-[var(--primary)] flex items-center justify-center flex-shrink-0">
                  <HiCheck size={14} className="text-[var(--primary-foreground)]" />
                </div>
              )}
            </div>
            
            {organization.description && (
              <p className="text-sm text-[var(--muted-foreground)] mb-3 line-clamp-2">
                {organization.description}
              </p>
            )}

            <div className="flex items-center gap-4 text-xs text-[var(--muted-foreground)]">
              {organization._count && (
                <>
                  <div className="flex items-center gap-1">
                    <HiBuildingOffice2 size={12} />
                    <span>{organization._count.members} members</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <HiRocketLaunch size={12} />
                    <span>{organization._count.workspaces} workspaces</span>
                  </div>
                </>
              )}
              {organization.createdAt && (
                <div className="flex items-center gap-1">
                  <HiCalendar size={12} />
                  <span>{new Date(organization.createdAt).toLocaleDateString()}</span>
                </div>
              )}
            </div>

            {organization.settings?.features && (
              <div className="flex items-center gap-2 mt-3">
                {organization.settings.features.timeTracking && (
                  <Badge variant="secondary" className="text-xs">
                    <HiClock size={10} className="mr-1" />
                    Time Tracking
                  </Badge>
                )}
                {organization.settings.features.automation && (
                  <Badge variant="secondary" className="text-xs">
                    <HiRocketLaunch size={10} className="mr-1" />
                    Automation
                  </Badge>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
export default OrganizationSelectionCard;