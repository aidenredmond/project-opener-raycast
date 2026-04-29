import { Action, ActionPanel, getPreferenceValues, List, open, showToast, Toast } from "@raycast/api";
import { useEffect, useState } from "react";
import { homedir } from "os";
import { Repo, scanRepos } from "./utils/scan-repos";

// Change this to your projects root
const BASE_DIR = `${homedir()}/dev/`;

type EditorId = "vscode" | "zed";

interface Preferences {
  editor: EditorId;
}

const EDITORS: Record<EditorId, { bundleId: string; name: string }> = {
  vscode: { bundleId: "com.microsoft.VSCode", name: "VS Code" },
  zed: { bundleId: "dev.zed.Zed", name: "Zed" },
};

export default function Command() {
  const { editor: editorId } = getPreferenceValues<Preferences>();
  const editor = EDITORS[editorId];

  const [repos, setRepos] = useState<Repo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const id = setTimeout(() => {
      try {
        setRepos(scanRepos(BASE_DIR));
      } catch (err) {
        showToast({ style: Toast.Style.Failure, title: "Scan failed", message: String(err) });
      } finally {
        setIsLoading(false);
      }
    }, 0);
    return () => clearTimeout(id);
  }, []);

  return (
    <List isLoading={isLoading} searchBarPlaceholder="Search repos…">
      {repos.map((repo) => (
        <List.Item
          key={repo.path}
          title={repo.name}
          subtitle={repo.relativePath}
          accessories={[{ text: repo.path }]}
          actions={
            <ActionPanel>
              <Action
                title={`Open in ${editor.name}`}
                onAction={() =>
                  open(repo.path, editor.bundleId).catch(() =>
                    showToast({ style: Toast.Style.Failure, title: `${editor.name} not found` }),
                  )
                }
              />
              <Action.CopyToClipboard title="Copy Path" content={repo.path} />
            </ActionPanel>
          }
        />
      ))}
    </List>
  );
}
