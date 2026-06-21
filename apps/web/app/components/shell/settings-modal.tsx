import { useAtom, useAtomValue, useSetAtom } from "jotai";

import { Modal } from "~/components/ui/modal";
import {
  activeOrgAtom,
  createOrgAtom,
  deleteOrgAtom,
  orgsAtom,
  renameOrgAtom,
  setActiveOrgAtom,
} from "~/state/workspace";

import { settingsOpenAtom } from "./shell-state";
import { WorkspaceList } from "./workspace-list";

// Settings — the home for low-frequency, app-wide controls. Organization
// switching lives here (RULES.md §4.0): selecting an org resets the active
// namespace and re-scopes every view.
export function SettingsModal() {
  const [open, setOpen] = useAtom(settingsOpenAtom);
  const orgs = useAtomValue(orgsAtom);
  const activeOrg = useAtomValue(activeOrgAtom);
  const setOrg = useSetAtom(setActiveOrgAtom);
  const createOrg = useSetAtom(createOrgAtom);
  const renameOrg = useSetAtom(renameOrgAtom);
  const deleteOrg = useSetAtom(deleteOrgAtom);

  return (
    <Modal open={open} onClose={() => setOpen(false)} title="Settings">
      <div className="flex flex-col gap-4">
        <section className="flex flex-col gap-2">
          <div>
            <h2 className="text-sm font-medium text-fg">Organization</h2>
            <p className="heading-body text-xs text-muted">
              Each organization is a separate household with its own houses and data. Switching
              refreshes everything.
            </p>
          </div>
          <WorkspaceList
            kind="org"
            items={orgs}
            activeId={activeOrg?.id ?? ""}
            handlers={{
              select: setOrg,
              create: createOrg,
              rename: (id, name) => renameOrg({ id, name }),
              remove: deleteOrg,
            }}
            onSelected={() => setOpen(false)}
          />
        </section>
      </div>
    </Modal>
  );
}
