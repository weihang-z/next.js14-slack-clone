import { useMutation } from "convex/react";
import { useCallback, useMemo, useState } from "react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";

type RequestType = { name: string; id: Id<"channels"> };
type ResponseType = Id<"channels"> | null;

type Options = {
  onSuccess?: (data: ResponseType) => void;
  onError?: (error: Error) => void;
  onSettled?: () => void;
  throwError?: boolean;
};

export const useUpdateChannel = () => {
  const [_data, setData] = useState<ResponseType>(null);
  const [_error, setError] = useState<Error | null>(null);
  const [status, setStatus] = useState<
    "pending" | "success" | "error" | "settled" | null
  >(null);

  const isPending = useMemo(() => status === "pending", [status]);
  const isSuccess = useMemo(() => status === "success", [status]);
  const isError = useMemo(() => status === "error", [status]);
  const isSettled = useMemo(() => status === "settled", [status]);

  const mutation = useMutation(api.channels.update);

  const mutate = useCallback(
    async (values: RequestType, options: Options) => {
      try {
        setData(null);
        setError(null);

        setStatus("pending");

        const response = await mutation(values);
        setData(response); // Update the data state
        setStatus("success"); // Update status
        options.onSuccess?.(response);
        return response;
      } catch (error) {
        setError(error as Error); // Update error state
        setStatus("error"); // Update status
        options.onError?.(error as Error);
        if (options?.throwError) {
          throw error;
        }
      } finally {
        setStatus("settled");
        options.onSettled?.();
      }
    },
    [mutation]
  );

  return { mutate, isPending, isError, isSettled, isSuccess };
};
