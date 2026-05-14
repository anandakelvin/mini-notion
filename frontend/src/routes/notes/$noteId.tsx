import "@blocknote/core/fonts/inter.css";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/shadcn";
import "@blocknote/shadcn/style.css";
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/notes/$noteId')({
  component: RouteComponent,
})

function RouteComponent() {
  const editor = useCreateBlockNote();
  return (
		// <div className="border border-black h-full w-full">
			<BlockNoteView editor={editor} />
		// </div>
  );
}
