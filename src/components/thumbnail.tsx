import Image from "next/image";
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "./ui/dialog";

interface ThumbnailProps {
  url: string | null | undefined;
}

export const Thumbnail = ({ url }: ThumbnailProps) => {
  if (!url) return null;

  return (
    <Dialog>
      <DialogTrigger>
        <div className="relative overflow-hidden max-w-[360px] border rounded-lg my-2 cursor-zoom-in">
          <Image
            src={url}
            alt="Message image"
            width={800}
            height={600}
            className="rounded-md object-cover size-full"
          />
        </div>
      </DialogTrigger>
      <DialogContent className="max-w-[800px] border-none bg-transparent p-0 shadow-none">
        <DialogTitle className="sr-only">Message image</DialogTitle>
        <Image
          src={url}
          alt="Message image"
          width={1200}
          height={900}
          className="rounded-md object-cover size-full"
        />
      </DialogContent>
    </Dialog>
  );
};
