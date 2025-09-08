import React, { useEffect, useState, useCallback } from "react";
import MDEditor from "@uiw/react-md-editor";

interface TaskDescriptionProps {
  value: string;
  onChange: (value: string) => void;
  editMode?: boolean;
  onSaveRequest?: (newValue: string) => void;
}

const TaskDescription: React.FC<TaskDescriptionProps> = ({
  value,
  onChange,
  editMode = true,
  onSaveRequest,
}) => {
  const [colorMode, setColorMode] = useState<"light" | "dark">("light");

  useEffect(() => {
    if (typeof document !== "undefined") {
      setColorMode(
        document.documentElement.classList.contains("dark") ? "dark" : "light"
      );
    }
  }, []);

  const handleCheckboxToggle = useCallback(
    (checkboxIndex: number) => {
      if (!value) return;

      const lines = value.split("\n");
      let currentCheckboxCount = 0;

      // Find the checkbox line by its index among checkboxes
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes("- [ ] ") || lines[i].includes("- [x] ")) {
          if (currentCheckboxCount === checkboxIndex) {
            // Toggle the checkbox
            if (lines[i].includes("- [ ] ")) {
              lines[i] = lines[i].replace("- [ ] ", "- [x] ");
            } else if (lines[i].includes("- [x] ")) {
              lines[i] = lines[i].replace("- [x] ", "- [ ] ");
            }
            break;
          }
          currentCheckboxCount++;
        }
      }

      const newValue = lines.join("\n");
      onChange(newValue);

      if (onSaveRequest) {
        onSaveRequest(newValue);
      }
    },
    [value, onChange, onSaveRequest]
  );

  if (editMode) {
    return (
      <div className="space-y-4" data-color-mode={colorMode}>
        <MDEditor
          value={value}
          onChange={(val) => onChange(val || "")}
          hideToolbar={false}
          className="task-md-editor"
          textareaProps={{
            placeholder: "Describe the task in detail...",
            className:
              "bg-[var(--background)] text-[var(--foreground)] border-none h-[420px] focus:outline-none",
          }}
          height={520}
        />
      </div>
    );
  }

  return (
    <div
      className="prose max-w-none bg-[var(--background)] text-sm text-[var(--foreground)] p-2 rounded-md border border-[var(--border)] markdown-body"
      data-color-mode={colorMode}
    >
     <div className="overflow-y-auto h-full">
            <MDEditor.Markdown source={value} className="prose max-w-none" />
          </div>
    </div>
  );
};

export default TaskDescription;
