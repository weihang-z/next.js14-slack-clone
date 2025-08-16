import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";

interface useGetMemberProps {
  memberId: Id<"members">;
}

export const useGetMember = ({ memberId }: useGetMemberProps) => {
  const data = useQuery(api.members.getById, { id: memberId });
  const isLoading = data === undefined;

  return { data, isLoading };
};
