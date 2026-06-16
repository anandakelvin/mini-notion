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
import { io, Socket } from "socket.io-client";
import { toast } from "sonner";
import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "prosemirror-state";
import { Decoration, DecorationSet } from "prosemirror-view";

// Define custom collaborative cursor extension
const CollaborativeCursor = Extension.create<{
  cursorsRef: React.MutableRefObject<Record<string, { pos: number; email: string; color: string }>>;
}>({
  name: "collaborativeCursor",

  addProseMirrorPlugins() {
    const cursorsRef = this.options.cursorsRef;
    return [
      new Plugin({
        key: new PluginKey("collaborativeCursor"),
        props: {
          decorations(state: any) {
            const decos: any[] = [];
            const cursors = cursorsRef.current || {};
            Object.values(cursors).forEach((cursor) => {
              if (cursor.pos >= 0 && cursor.pos <= state.doc.content.size) {
                const cursorEl = document.createElement("span");
                cursorEl.className = "remote-cursor-container";
                cursorEl.style.position = "relative";
                cursorEl.style.borderLeft = `2px solid ${cursor.color}`;
                cursorEl.style.marginLeft = "-1px";
                cursorEl.style.marginRight = "-1px";
                cursorEl.style.height = "1.2em";
                cursorEl.style.display = "inline-block";
                cursorEl.style.verticalAlign = "middle";

                const labelEl = document.createElement("span");
                labelEl.className = "remote-cursor-label";
                labelEl.textContent = cursor.email;
                labelEl.style.position = "absolute";
                labelEl.style.bottom = "100%";
                labelEl.style.left = "0";
                labelEl.style.background = cursor.color;
                labelEl.style.color = "#ffffff";
                labelEl.style.fontSize = "9px";
                labelEl.style.padding = "1px 4px";
                labelEl.style.borderRadius = "2px";
                labelEl.style.whiteSpace = "nowrap";
                labelEl.style.pointerEvents = "none";
                labelEl.style.zIndex = "50";
                labelEl.style.transform = "translateY(-2px)";
                labelEl.style.fontWeight = "600";
                labelEl.style.fontFamily = "Inter, sans-serif";

                cursorEl.appendChild(labelEl);

                const decoration = Decoration.widget(cursor.pos, cursorEl, {
                  key: cursor.email,
                  side: 1,
                });
                decos.push(decoration);
              }
            });
            return DecorationSet.create(state.doc, decos);
          },
        },
      }),
    ];
  },
});

export const Route = createFileRoute('/notes/$noteId')({
  component: RouteComponent,
})

function RouteComponent() {
  const { noteId } = Route.useParams();
  const { note, isLoading } = useFetchNote(noteId);
  const { updateNote } = useUpdateNote(noteId);
  
  const [title, setTitle] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const cursorsRef = useRef<Record<string, { pos: number; email: string; color: string }>>({});
  const socketRef = useRef<Socket | null>(null);

  const editor = useCreateBlockNote({
    _tiptapOptions: {
      extensions: [
        CollaborativeCursor.configure({ cursorsRef }) as any
      ]
    }
  });
  
  const hasInitialized = useRef(false);
  const saveTimeoutRef = useRef<any | null>(null);
  const isLocalSaveRef = useRef(false);
  const lastSavedAtRef = useRef<any | null>(null);
  const titleRef = useRef("");

  useEffect(() => {
    titleRef.current = title;
  }, [title]);

  // Initialize data once fetched
  useEffect(() => {
    if (note && !hasInitialized.current) {
      setTitle(note.title);
      titleRef.current = note.title;
      lastSavedAtRef.current = note.updated_at;
      if (note.content && Array.isArray(note.content)) {
        editor.replaceBlocks(editor.document, note.content);
      }
      hasInitialized.current = true;
    }
  }, [note, editor]);

  // Socket.io Realtime Syncing
  useEffect(() => {
    const socket = io("http://localhost:3000", {
      withCredentials: true,
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("join_note", { noteId: Number(noteId) });
    });

    socket.on("note_updated", (updatedNote: any) => {
      // If this update was triggered by our own save, skip applying it
      if (isLocalSaveRef.current) {
        isLocalSaveRef.current = false;
        lastSavedAtRef.current = updatedNote.updated_at;
        return;
      }

      // Update local state
      setTitle(updatedNote.title);
      titleRef.current = updatedNote.title;
      lastSavedAtRef.current = updatedNote.updated_at;

      // Only replace blocks if the content actually changed to avoid cursor jumps
      const currentBlocksStr = JSON.stringify(editor.document);
      const newBlocksStr = JSON.stringify(updatedNote.content || []);
      if (currentBlocksStr !== newBlocksStr) {
        editor.replaceBlocks(editor.document, updatedNote.content || []);
      }
    });

    socket.on("cursor_move", (data: { email: string; pos: number; color: string }) => {
      cursorsRef.current[data.email] = {
        pos: data.pos,
        email: data.email,
        color: data.color,
      };
      // Force ProseMirror view redraw to apply new decorations
      if (editor?.prosemirrorView) {
        editor.prosemirrorView.dispatch(editor.prosemirrorView.state.tr);
      }
    });

    socket.on("user_left", (data: { email: string }) => {
      delete cursorsRef.current[data.email];
      if (editor?.prosemirrorView) {
        editor.prosemirrorView.dispatch(editor.prosemirrorView.state.tr);
      }
    });

    socket.on("error", (err: any) => {
      toast.error(err.message || "WebSocket error");
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [noteId, editor]);

  // Emit local cursor movement
  useEffect(() => {
    if (!editor) return;

    return editor.onSelectionChange(() => {
      const selection = editor.prosemirrorView?.state.selection;
      if (!selection || !socketRef.current) return;

      socketRef.current.emit("cursor_move", {
        noteId: Number(noteId),
        pos: selection.from,
      });
    });
  }, [editor, noteId]);

  // Auto-save logic
  const triggerSave = useCallback((newTitle: string, newContent: any) => {
    if (!hasInitialized.current) return;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    setIsSaving(true);
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        isLocalSaveRef.current = true;
        const res = await updateNote({
          title: newTitle,
          content: newContent,
          updatedAt: lastSavedAtRef.current || undefined,
        });
        if (res) {
          lastSavedAtRef.current = res.updated_at;
        }
      } catch (error: any) {
        isLocalSaveRef.current = false;
        if (error.response?.status === 409) {
          toast.error("Conflict detected: This note was modified in another session. Please refresh to merge.");
        } else {
          toast.error("Failed to save note");
        }
      } finally {
        setIsSaving(false);
      }
    }, 1000); // 1 second debounce
  }, [updateNote]);

  const handleEditorChange = () => {
    triggerSave(titleRef.current, editor.document);
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTitle(val);
    triggerSave(val, editor.document);
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
        <div className="mb-10 w-full">
          <Skeletonizer enabled={isLoading}>
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
