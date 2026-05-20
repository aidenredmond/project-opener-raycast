import { Action, ActionPanel, getPreferenceValues, List, open, showToast, Toast } from "@raycast/api";
import { useEffect, useMemo, useState } from "react";
import { homedir } from "os";
import { Repo, scanRepos } from "./utils/scan-repos";

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
  const [branchFilter, setBranchFilter] = useState("all");

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

  const branches = useMemo(() => {
    const unique = Array.from(new Set(repos.map((r) => r.branch).filter(Boolean) as string[])).sort();
    return unique;
  }, [repos]);

  const filtered = useMemo(
    () => (branchFilter === "all" ? repos : repos.filter((r) => r.branch === branchFilter)),
    [repos, branchFilter],
  );

  return (
    <List
      isLoading={isLoading}
      searchBarPlaceholder="Search repos…"
      searchBarAccessory={
        <List.Dropdown tooltip="Filter by branch" onChange={setBranchFilter} value={branchFilter}>
          <List.Dropdown.Item title="All branches" value="all" />
          <List.Dropdown.Section title="Branches">
            {branches.map((b) => (
              <List.Dropdown.Item key={b} title={b} value={b} />
            ))}
          </List.Dropdown.Section>
        </List.Dropdown>
      }
    >
      {filtered.map((repo) => (
        <List.Item
          key={repo.path}
          title={repo.name}
          subtitle={repo.branch ?? undefined}
          keywords={repo.branch ? [repo.branch] : undefined}
          accessories={[{ text: repo.relativePath }]}
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
