import { useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import ActionButton from "@/components/common/ActionButton";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { toast } from "sonner";

function isValidPassword(password: any) {
  return (
    /[A-Z]/.test(password) && /[a-z]/.test(password) && /\d/.test(password)
  );
}

const extractErrorMessage = (response: any) => {
  if (response?.message?.message) {
    return response.message.message;
  }
  if (typeof response?.message === "string") {
    return response.message;
  }
  if (Array.isArray(response?.message)) {
    return response.message.join(", ");
  }
  return "Failed to change password. Please try again.";
};

export default function ResetPasswordSection() {
  const { changePassword } = useAuth();
  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({ currentPassword: "", newPassword: "", confirmPassword: "" });

    if (!isValidPassword(form.newPassword)) {
      setErrors((prev) => ({
        ...prev,
        newPassword:
          "Password must contain at least one uppercase letter, one lowercase letter, and one number.",
      }));
      setLoading(false);
      return;
    }

    if (form.newPassword !== form.confirmPassword) {
      setErrors((prev) => ({
        ...prev,
        confirmPassword: "Passwords do not match.",
      }));
      setLoading(false);
      return;
    }

    try {
      const response = await changePassword({
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
        confirmPassword: form.confirmPassword,
      });

      if (response.success) {
        toast.success("Password changed successfully!");
        setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      } else {
        const errorMsg = extractErrorMessage(response);

        if (errorMsg.toLowerCase().includes("current password")) {
          setErrors((prev) => ({ ...prev, currentPassword: errorMsg }));
        } else if (errorMsg.toLowerCase().includes("new password")) {
          setErrors((prev) => ({ ...prev, newPassword: errorMsg }));
        } else {
          toast.error(errorMsg);
        }
      }
    } catch (error) {
      toast.error("Failed to change password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-none">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-medium">Reset Password</CardTitle>
        <CardDescription className="text-sm text-gray-600">
          Change your account password to keep your account secure.
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-0">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Current Password Field */}
            <div>
              <Label className="text-sm font-medium mb-2 block">
                Current Password
              </Label>
              <div className="relative">
                <Input
                  type={showCurrentPassword ? "text" : "password"}
                  value={form.currentPassword}
                  onChange={(e) =>
                    setForm({ ...form, currentPassword: e.target.value })
                  }
                  placeholder="Enter current password"
                  className={errors.currentPassword ? "border-red-500" : ""}
                  required
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                >
                  {showCurrentPassword ? (
                    <EyeOff size={16} />
                  ) : (
                    <Eye size={16} />
                  )}
                </button>
              </div>
              {errors.currentPassword && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.currentPassword}
                </p>
              )}
            </div>

            {/* New Password Field */}
            <div>
              <Label className="text-sm font-medium mb-2 block">
                New Password
              </Label>
              <div className="relative">
                <Input
                  type={showNewPassword ? "text" : "password"}
                  value={form.newPassword}
                  onChange={(e) =>
                    setForm({ ...form, newPassword: e.target.value })
                  }
                  placeholder="Enter new password"
                  className={errors.newPassword ? "border-red-500" : ""}
                  required
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.newPassword ? (
                <p className="text-red-500 text-xs mt-1">
                  {errors.newPassword}
                </p>
              ) : (
                <p className="text-gray-500 text-xs mt-1">
                  Must contain uppercase, lowercase, and number
                </p>
              )}
            </div>

            {/* Confirm Password Field */}
            <div>
              <Label className="text-sm font-medium mb-2 block">
                Confirm Password
              </Label>
              <div className="relative">
                <Input
                  type={showConfirmPassword ? "text" : "password"}
                  value={form.confirmPassword}
                  onChange={(e) =>
                    setForm({ ...form, confirmPassword: e.target.value })
                  }
                  placeholder="Confirm new password"
                  className={errors.confirmPassword ? "border-red-500" : ""}
                  required
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff size={16} />
                  ) : (
                    <Eye size={16} />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.confirmPassword}
                </p>
              )}
            </div>
          </div>

          <div className="pt-6 flex justify-end">
            <ActionButton type="submit" disabled={loading} primary>
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Updating...
                </div>
              ) : (
                "Update Password"
              )}
            </ActionButton>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
