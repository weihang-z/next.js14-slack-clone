"use client";

import { UserBotton } from "@/features/auth/components/user-botton";
import { useCreateWorkspaceModal } from "@/features/workspace/store/use-create-workspace-modal";
import { useGetWorkspaces } from "@/features/workspace/api/use-get-workspaces";
import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Modals } from "@/components/Modals";

export default function Home() {
  const router = useRouter();
  const [open, setOpen] = useCreateWorkspaceModal();
  const { data, isLoading } = useGetWorkspaces();

  const workspaceID = useMemo(() => data?.[0]?._id, [data]);

  useEffect(() => {
    if (isLoading) {
      return;
    }
    if (workspaceID) {
      router.replace(`/workspace/${workspaceID}`);
    } else if (!open) {
      setOpen(true);
    }
  }, [workspaceID, isLoading, open, setOpen, router]);

  return (
    <div>
      <Modals />
      <UserBotton />
    </div>
  );
}
