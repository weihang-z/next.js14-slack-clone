import { MessageList } from "@/components/message-list";
import { useGetMember } from "@/features/members/api/use-get-member";
import { useGetMessages } from "@/features/messages/api/use-get-messages";
import { useMemberId } from "@/hooks/use-member-id";
import { usePanel } from "@/hooks/use-panel";
import { Loader } from "lucide-react";
import { Doc } from "../../../../../../convex/_generated/dataModel";
import { ChatInput } from "./chat-input";
import { Header } from "./header";

interface ConversationProps {
  data: Doc<"conversations">;
}

export const Conversation = ({ data }: ConversationProps) => {
  const memberId = useMemberId();

  const { onOpenProfile } = usePanel();

  const { data: member, isLoading: memberLoading } = useGetMember({ memberId });
  const { results, status, loadMore } = useGetMessages({
    conversationId: data._id,
  });

  if (memberLoading || status === "LoadingFirstPage") {
    return (
      <div className="h-full flex-1 flex items-center justify-center gap-2">
        <Loader className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <Header
        memberName={member?.user.name}
        memberImage={member?.user.image}
        onClick={() => onOpenProfile(memberId)}
      />
      <MessageList
        data={results}
        variant="conversation"
        memberImage={member?.user.image}
        memberName={member?.user.name}
        loadMore={loadMore}
        isLoadingMore={status === "LoadingMore"}
        canLoadMore={status === "CanLoadMore"}
      />
      <ChatInput
        placeholder={`Message ${member?.user.name}`}
        conversationId={data._id}
      />
    </div>
  );
};
