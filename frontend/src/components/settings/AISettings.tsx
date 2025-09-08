"use client";

import { useState, useEffect } from "react";
import { HiSparkles, HiKey, HiCog6Tooth } from "react-icons/hi2";
import { settingsApi, Setting } from "@/utils/api/settingsApi";
import api from "@/lib/api";
import { Button, Input, Label } from "../ui";

export default function AISettings() {
  const [isEnabled, setIsEnabled] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState("");
  const [apiUrl, setApiUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      const settings: Setting[] = await settingsApi.getAll("ai");

      // Map settings to state
      settings.forEach((setting) => {
        switch (setting.key) {
          case "ai_enabled":
            const enabled = setting.value === "true";
            setIsEnabled(enabled);
            // Sync with localStorage
            localStorage.setItem("aiEnabled", enabled.toString());
            // Notify other components
            window.dispatchEvent(
              new CustomEvent("aiSettingsChanged", {
                detail: { aiEnabled: enabled },
              })
            );
            break;
          case "ai_api_key":
            setApiKey(setting.value || "");
            break;
          case "ai_model":
            setModel(setting.value || "deepseek/deepseek-chat-v3-0324:free");
            break;
          case "ai_api_url":
            setApiUrl(setting.value || "https://openrouter.ai/api/v1");
            break;
        }
      });
    } catch (error) {
      console.error("Failed to load settings:", error);
      setMessage({ type: "error", text: "Failed to load AI settings" });
    } finally {
      setIsLoading(false);
    }
  };

  const saveSetting = async (
    key: string,
    value: string,
    description?: string
  ) => {
    await settingsApi.setSetting({
      key,
      value,
      description,
      category: "ai",
      isEncrypted: key === "ai_api_key", // Encrypt API keys
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    setMessage(null);

    try {
      console.log("Saving AI settings:", {
        ai_enabled: isEnabled.toString(),
        ai_api_key: apiKey ? "set" : "empty",
        ai_model: model,
        ai_api_url: apiUrl,
      });

      await Promise.all([
        saveSetting(
          "ai_enabled",
          isEnabled.toString(),
          "Enable/disable AI chat functionality"
        ),
        saveSetting("ai_api_key", apiKey, "AI provider API key"),
        saveSetting("ai_model", model, "AI model to use"),
        saveSetting("ai_api_url", apiUrl, "API endpoint URL"),
      ]);

      // Update cache and notify other components about AI settings change
      localStorage.setItem("aiEnabled", isEnabled.toString());
      window.dispatchEvent(
        new CustomEvent("aiSettingsChanged", {
          detail: { aiEnabled: isEnabled },
        })
      );

      setMessage({ type: "success", text: "AI settings saved successfully!" });
    } catch (error) {
      console.error("Failed to save settings:", error);
      setMessage({ type: "error", text: "Failed to save AI settings" });
    } finally {
      setIsSaving(false);
    }
  };

  const testConnection = async () => {
    if (!isEnabled) {
      setMessage({ type: "error", text: "Please enable AI chat first" });
      return;
    }

    if (!apiKey) {
      setMessage({ type: "error", text: "Please enter an API key first" });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      const response = await api.post("/ai-chat/chat", {
        message: "Hello, this is a test message",
        history: [],
      });

      if (response.data.success) {
        setMessage({ type: "success", text: "Connection test successful!" });
      } else {
        setMessage({
          type: "error",
          text: response.data.error || "Connection test failed",
        });
      }
    } catch (error: any) {
      console.error("Connection test failed:", error);
      const errorMessage =
        error.response?.data?.error ||
        error.message ||
        "Connection test failed";
      setMessage({ type: "error", text: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className=" p-6">
      <div className="flex items-center gap-2 mb-6">
        <HiSparkles className="w-6 h-6 text-blue-500" />
        <h2 className="text-xl font-semibold ">AI Assistant Settings</h2>
      </div>

      {message && (
        <div
          className={`mb-4 p-3 rounded-lg ${
            message.type === "success"
              ? "bg-[var(--status-active-bg) text-[var(--status-active-text)] border border-[var(--status-active-border)]"
              : "bg-[var(--status-suspended-bg)] text-[var(--status-suspended-text)] border border-[var(--status-suspended-border)]"
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="space-y-4">
        {/* Instructions */}
        {!isEnabled && (
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-sm text-blue-600 dark:text-blue-400">
              <strong>To use AI Chat:</strong> Toggle the switch below to enable
              AI, then add your API credentials.
            </p>
          </div>
        )}

        {/* Enable/Disable Switch */}
        <div className="flex items-center justify-between p-4 rounded-lg">
          <div>
            <h3 className="text-sm font-medium ">Enable AI Chat</h3>
            <p className="text-sm text-muted">
              Turn AI chat functionality on or off
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={isEnabled}
              onChange={async (e) => {
                const newValue = e.target.checked;
                setIsEnabled(newValue);
                // Cache the value for immediate loading on page refresh
                localStorage.setItem("aiEnabled", newValue.toString());
                // Immediately notify other components for real-time updates
                window.dispatchEvent(
                  new CustomEvent("aiSettingsChanged", {
                    detail: { aiEnabled: newValue },
                  })
                );

                // Auto-save the enabled/disabled state to database
                try {
                  await saveSetting(
                    "ai_enabled",
                    newValue.toString(),
                    "Enable/disable AI chat functionality"
                  );
                  console.log("AI enabled state saved to database:", newValue);
                  setMessage({
                    type: "success",
                    text: `AI chat ${newValue ? "enabled" : "disabled"}`,
                  });
                } catch (error) {
                  console.error("Failed to save AI enabled state:", error);
                  setMessage({
                    type: "error",
                    text: "Failed to save AI enabled state",
                  });
                }
              }}
              disabled={isLoading || isSaving}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-[var(--muted-foreground)] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-4 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-500"></div>
          </label>
        </div>

        {/* Configuration Fields - Only shown when enabled */}
        {isEnabled && (
          <>
            <div>
              <label className="block text-sm font-medium mb-2">
                <HiKey className="w-4 h-4 inline mr-1" />
                API Key
              </label>
              <Input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter your API key"
                disabled={isLoading || isSaving}
                className="login-input"
              />
            </div>

            <div>
              <Label className="block text-sm font-medium mb-2">
                <HiCog6Tooth className="w-4 h-4 inline mr-1" />
                Model
              </Label>
              <Input
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="e.g., deepseek/deepseek-chat-v3-0324:free"
                disabled={isLoading || isSaving}
                className="login-input"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Enter the model name for your AI provider
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">API URL</label>
              <Input
                type="url"
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
                placeholder="https://api.provider.com/v1"
                disabled={isLoading || isSaving}
                className="login-input"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                The base URL determines which AI provider is used
              </p>
            </div>
          </>
        )}
      </div>

      <div className="flex items-center gap-3 mt-6 pt-4 border-t border-[var(--border)]">
        <Button
          variant="default"
          onClick={handleSave}
          disabled={isLoading || isSaving || (isEnabled && !apiKey)}
          className="px-4 py-2 bg-[var(--primary)]/80 hover:bg-[var(--primary)] disabled:bg-gray-300 disabled:cursor-not-allowed text-[var(--primary-foreground)] rounded-lg transition-colors"
        >
          {isSaving ? "Saving..." : "Save Settings"}
        </Button>

        {isEnabled && (
          <Button
            variant="destructive"
            onClick={testConnection}
            disabled={isLoading || isSaving || !apiKey}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
          >
            {isLoading ? "Testing..." : "Test Connection"}
          </Button>
        )}
      </div>

      <div className="mt-4 p-3 bg-[var(--border)] rounded-lg">
        <h3 className="text-sm font-medium mb-2">Popular AI Providers:</h3>
        <ul className="text-xs space-y-1 text-[var(--accent-foreground)]">
          <li>
            • <strong>OpenRouter:</strong> https://openrouter.ai/api/v1 (100+
            models, free options available)
          </li>
          <li>
            • <strong>OpenAI:</strong> https://api.openai.com/v1 (GPT models)
          </li>
          <li>
            • <strong>Anthropic:</strong> https://api.anthropic.com/v1 (Claude
            models)
          </li>
          <li>
            • <strong>Google:</strong>{" "}
            https://generativelanguage.googleapis.com/v1beta (Gemini models)
          </li>
        </ul>
        <p className="text-xs mt-3">
          • API keys are encrypted and stored securely • Test connection after
          changes • The URL determines which provider is used
        </p>
      </div>
    </div>
  );
}
