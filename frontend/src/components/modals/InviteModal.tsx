import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { invitationApi } from "@/utils/api/invitationsApi";
import { HiMail } from "react-icons/hi";
import { Button, Input, Label, Select } from "../ui";
import {
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

const InviteModal = ({
  isOpen,
  onClose,
  onInvite,
  availableRoles,
}: {
  isOpen: boolean;
  onClose: () => void;
  onInvite: (email: string, role: string) => void;
  availableRoles: Array<{ id: string; name: string; description: string }>;
}) => {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("MEMBER");
  const [inviting, setInviting] = useState(false);

  const isEmailValid = email ? invitationApi.validateEmail(email) : true;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !isEmailValid) return;

    setInviting(true);
    try {
      onInvite(email.trim(), role);
      setEmail("");
      setRole("MEMBER");
      onClose();
    } catch (error) {
      console.error("Failed to send invitation:", error);
    } finally {
      setInviting(false);
    }
  };

  const handleClose = () => {
    setEmail("");
    setRole("MEMBER");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[var(--card)] border-none rounded-[var(--card-radius)] shadow-lg max-w-md">
        <DialogHeader>
          <DialogTitle className="text-[var(--foreground)] flex items-center gap-2">
            <HiMail className="w-5 h-5 text-[var(--primary)]" />
            Invite Member
          </DialogTitle>
          <DialogDescription className="text-[var(--muted-foreground)]">
            Send an invitation to join this workspace.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label
              htmlFor="invite-email"
              className="text-sm font-medium text-[var(--foreground)]"
            >
              Email Address{" "}
              <span className="text-red-500">*</span>
            </Label>
            <Input
              id="invite-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter email address"
              className="mt-1 border-input bg-background text-[var(--foreground)]"
              required
            />
            {email && !isEmailValid && (
              <p className="text-xs text-[var(--destructive)] mt-1">
                Please enter a valid email address
              </p>
            )}
          </div>

          <div>
            <Label className="text-sm font-medium text-[var(--foreground)]">
              Role
            </Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger className="mt-1 border-input bg-background text-[var(--foreground)]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border-none bg-[var(--card)]">
                {availableRoles.map((r) => (
                  <SelectItem key={r.id} value={r.name}>
                    <div className="flex flex-col">
                      <span className="font-medium">{r.name}</span>
                      <span className="text-xs text-[var(--muted-foreground)]">
                        {r.description}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={inviting}
              className="h-8 border-none bg-[var(--primary)]/5 hover:bg-[var(--primary)]/10 text-[var(--foreground)] transition-all duration-200"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={inviting || !email.trim() || !isEmailValid}
              className="h-8 bg-[var(--primary)] text-[var(--primary-foreground)] hover:bg-[var(--primary)]/90 hover:shadow-md transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {inviting ? (
                <>
                  <div className="w-4 h-4 border-2 border-[var(--primary-foreground)] border-t-transparent rounded-full animate-spin mr-2"></div>
                  Sending...
                </>
              ) : (
                "Send Invitation"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default InviteModal;
