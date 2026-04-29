import { Action, ActionPanel, List, open, showToast, Toast } from "@raycast/api";
import { useEffect, useState } from "react";
import { homedir } from "os";
import { Repo, scanRepos } from "./utils/scan-repos";

// Change this to your projects root
const BASE_DIR = `${homedir()}/dev/repo`;

export default function Command() {
  const [repos, setRepos] = useState<Repo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Defer scan so the loading UI renders first
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
                title="Open in VS Code"
                onAction={() =>
                  open(repo.path, "com.microsoft.VSCode").catch(() =>
                    showToast({ style: Toast.Style.Failure, title: "VS Code not found" }),
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
