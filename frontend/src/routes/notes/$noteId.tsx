import "@blocknote/core/fonts/inter.css";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/shadcn";
import "@blocknote/shadcn/style.css";
import { createFileRoute, Link } from '@tanstack/react-router';
import { useFetchNote } from "frontend/src/hooks/notes/use-fetch-note";
import { useUpdateNote } from "frontend/src/hooks/notes/use-update-note";
import { useEffect, useState, useRef, useCallback } from "react";
import { Skeletonizer } from "frontend/src/components/ui/skeletonizer";
import { IconChevronLeft } from "@tabler/icons-react";
import { Button } from "frontend/src/components/ui/button";

export const Route = createFileRoute('/notes/$noteId')({
  component: RouteComponent,
})

function RouteComponent() {
  const { noteId } = Route.useParams();
  const { note, isLoading } = useFetchNote(noteId);
  const { updateNote } = useUpdateNote(noteId);
  
  const [title, setTitle] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const editor = useCreateBlockNote();
  
  const hasInitialized = useRef(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize data once fetched
  useEffect(() => {
    if (note && !hasInitialized.current) {
      setTitle(note.title);
      if (note.content && Array.isArray(note.content)) {
        editor.replaceBlocks(editor.document, note.content);
      }
      hasInitialized.current = true;
    }
  }, [note, editor]);

  // Auto-save logic
  const triggerSave = useCallback(() => {
    if (!hasInitialized.current) return;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    setIsSaving(true);
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await updateNote({
          title,
          content: editor.document
        });
      } catch (error) {
        console.error("Failed to save note:", error);
      } finally {
        setIsSaving(false);
      }
    }, 1000); // 1 second debounce
  }, [title, editor.document, updateNote]);

  const handleEditorChange = () => {
    triggerSave();
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
    triggerSave();
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center">
      <div className="w-full max-w-4xl px-8 pt-4">
        <div className="flex items-center justify-between py-2">
          <Link to="/notes">
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground transition-colors">
              <IconChevronLeft className="w-4 h-4 mr-1" />
              All Notes
            </Button>
          </Link>
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground/50 font-medium">
            {isSaving ? (
              <span className="flex items-center gap-1.5">
                <span className="w-1 h-1 rounded-full bg-amber-500 animate-pulse" />
                Saving...
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                <span className="w-1 h-1 rounded-full bg-emerald-500" />
                Saved
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="w-full max-w-3xl px-8 pt-12 pb-32">
        <div className="mb-10">
          <Skeletonizer enabled={isLoading} className="w-full">
            <input
              type="text"
              value={title}
              onChange={handleTitleChange}
              placeholder="Untitled"
              className="text-5xl font-bold bg-transparent border-none outline-none w-full placeholder:text-muted-foreground/20 tracking-tight"
            />
          </Skeletonizer>
        </div>
        
        <Skeletonizer enabled={isLoading}>
          <div className="min-h-[500px] -ml-[54px]"> 
            {/* -ml-[54px] to align the content with the title, as BlockNote has gutter/icons */}
            <BlockNoteView 
              editor={editor} 
              onChange={handleEditorChange}
            />
          </div>
        </Skeletonizer>
      </div>
    </div>
  );
}
