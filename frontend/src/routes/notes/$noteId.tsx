import "@blocknote/core/fonts/inter.css";
import { useCreateBlockNote, SuggestionMenuController, getDefaultReactSlashMenuItems } from "@blocknote/react";
import { BlockNoteSchema, defaultBlockSpecs, filterSuggestionItems } from "@blocknote/core";
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

const schema = BlockNoteSchema.create({
  blockSpecs: {
    paragraph: defaultBlockSpecs.paragraph,
    checkListItem: defaultBlockSpecs.checkListItem,
    image: defaultBlockSpecs.image,
    codeBlock: defaultBlockSpecs.codeBlock,
  },
});

const getColor = (email: string): string => {
  const colors = [
    "#ef4444",
    "#f97316",
    "#f59e0b",
    "#10b981",
    "#06b6d4",
    "#3b82f6",
    "#6366f1",
    "#8b5cf6",
    "#d946ef",
    "#ec4899",
  ];
  let hash = 0;
  for (let i = 0; i < email.length; i++) {
    hash = email.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colors.length;
  return colors[index];
};

const findCheckboxChanges = (oldBlocks: any[], newBlocks: any[]) => {
  const changes: Array<{ id: string; checked: boolean }> = [];
  
  const getChecklists = (blocks: any[]): Record<string, boolean> => {
    const map: Record<string, boolean> = {};
    const traverse = (list: any[]) => {
      list.forEach((b) => {
        if (b.type === "checkListItem") {
          map[b.id] = !!b.props?.checked;
        }
        if (b.children && Array.isArray(b.children)) {
          traverse(b.children);
        }
      });
    };
    traverse(blocks);
    return map;
  };

  const oldMap = getChecklists(oldBlocks);
  const newMap = getChecklists(newBlocks);

  Object.keys(newMap).forEach((id) => {
    if (oldMap[id] !== undefined && oldMap[id] !== newMap[id]) {
      changes.push({ id, checked: newMap[id] });
    }
  });

  return changes;
};

function ChecklistTooltips({ tooltips }: { tooltips: Record<string, { email: string; color: string; text: string }> }) {
  const [coords, setCoords] = useState<Record<string, { top: number; left: number }>>({});

  useEffect(() => {
    const updateCoords = () => {
      const newCoords: Record<string, { top: number; left: number }> = {};
      Object.keys(tooltips).forEach((blockId) => {
        const blockEl = document.querySelector(`[data-id="${blockId}"]`);
        if (blockEl) {
          const checkboxEl = blockEl.querySelector(".bn-checkbox, input[type='checkbox']");
          const target = checkboxEl || blockEl;
          
          const parent = document.getElementById("editor-container-wrapper");
          if (parent) {
            const parentRect = parent.getBoundingClientRect();
            const targetRect = target.getBoundingClientRect();
            
            newCoords[blockId] = {
              top: targetRect.top - parentRect.top,
              left: targetRect.left - parentRect.left + targetRect.width + 8,
            };
          }
        }
      });
      setCoords(newCoords);
    };

    updateCoords();
    window.addEventListener("resize", updateCoords);
    const interval = setInterval(updateCoords, 200);
    return () => {
      window.removeEventListener("resize", updateCoords);
      clearInterval(interval);
    };
  }, [tooltips]);

  return (
    <>
      {Object.entries(tooltips).map(([blockId, tooltip]) => {
        const pos = coords[blockId];
        if (!pos) return null;
        return (
          <div
            key={blockId}
            className="absolute z-50 pointer-events-none transition-all duration-300 animate-in fade-in slide-in-from-bottom-1"
            style={{
              top: `${pos.top - 6}px`,
              left: `${pos.left}px`,
            }}
          >
            <div
              className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold text-white shadow-sm"
              style={{ backgroundColor: tooltip.color }}
            >
              <span>{tooltip.email}</span>
              <span className="opacity-75 font-normal">({tooltip.text})</span>
            </div>
          </div>
        );
      })}
    </>
  );
}

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
  const [remoteTitleCursors, setRemoteTitleCursors] = useState<Record<string, { pos: number; email: string; color: string }>>({});
  const [actionTooltips, setActionTooltips] = useState<Record<string, { email: string; color: string; text: string; timestamp: number }>>({});

  const cursorsRef = useRef<Record<string, { pos: number; email: string; color: string }>>({});
  const socketRef = useRef<Socket | null>(null);

  const editor = useCreateBlockNote({
    schema,
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

      // Calculate checkbox changes before replacing blocks
      const oldBlocks = editor.document;
      const newBlocks = updatedNote.content || [];
      const changedList = findCheckboxChanges(oldBlocks, newBlocks);

      if (changedList.length > 0 && updatedNote.last_edited_by) {
        const email = updatedNote.last_edited_by;
        const color = getColor(email);
        
        changedList.forEach((change) => {
          setActionTooltips((prev) => ({
            ...prev,
            [change.id]: {
              email,
              color,
              text: change.checked ? "checked" : "unchecked",
              timestamp: Date.now(),
            },
          }));

          setTimeout(() => {
            setActionTooltips((prev) => {
              const next = { ...prev };
              if (next[change.id]?.timestamp === next[change.id]?.timestamp) {
                delete next[change.id];
              }
              return next;
            });
          }, 2500);
        });
      }

      // Update local state
      setTitle(updatedNote.title);
      titleRef.current = updatedNote.title;
      lastSavedAtRef.current = updatedNote.updated_at;

      // Only replace blocks if the content actually changed to avoid cursor jumps
      const currentBlocksStr = JSON.stringify(editor.document);
      const newBlocksStr = JSON.stringify(newBlocks);
      if (currentBlocksStr !== newBlocksStr) {
        editor.replaceBlocks(editor.document, newBlocks);
      }
    });

    socket.on("cursor_move", (data: { email: string; pos: number; color: string; isTitle?: boolean }) => {
      if (data.isTitle) {
        // Remove from ProseMirror cursors if present
        delete cursorsRef.current[data.email];
        if (editor?.prosemirrorView) {
          editor.prosemirrorView.dispatch(editor.prosemirrorView.state.tr);
        }
        // Add to remote title cursors
        setRemoteTitleCursors((prev) => ({
          ...prev,
          [data.email]: { pos: data.pos, email: data.email, color: data.color },
        }));
      } else {
        // Remove from remote title cursors if present
        setRemoteTitleCursors((prev) => {
          const copy = { ...prev };
          delete copy[data.email];
          return copy;
        });
        // Add to ProseMirror cursors
        cursorsRef.current[data.email] = {
          pos: data.pos,
          email: data.email,
          color: data.color,
        };
        // Force ProseMirror view redraw to apply new decorations
        if (editor?.prosemirrorView) {
          editor.prosemirrorView.dispatch(editor.prosemirrorView.state.tr);
        }
      }
    });

    socket.on("user_left", (data: { email: string }) => {
      delete cursorsRef.current[data.email];
      if (editor?.prosemirrorView) {
        editor.prosemirrorView.dispatch(editor.prosemirrorView.state.tr);
      }
      setRemoteTitleCursors((prev) => {
        const copy = { ...prev };
        delete copy[data.email];
        return copy;
      });
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

  const handleTitleCursor = (e: React.SyntheticEvent<HTMLInputElement>) => {
    const target = e.currentTarget;
    if (!socketRef.current) return;
    socketRef.current.emit("cursor_move", {
      noteId: Number(noteId),
      pos: target.selectionStart || 0,
      isTitle: true
    });
  };

  const getCursorOffset = (text: string, pos: number): number => {
    const span = document.createElement("span");
    span.style.fontFamily = "Inter, sans-serif";
    span.style.fontSize = "3rem"; // text-5xl
    span.style.fontWeight = "700"; // font-bold
    span.style.letterSpacing = "-0.025em"; // tracking-tight
    span.style.position = "absolute";
    span.style.visibility = "hidden";
    span.style.whiteSpace = "pre";
    span.textContent = text.substring(0, pos);
    document.body.appendChild(span);
    const width = span.getBoundingClientRect().width;
    document.body.removeChild(span);
    return width;
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
        <div className="mb-10 w-full relative">
          <Skeletonizer enabled={isLoading}>
            <input
              type="text"
              value={title}
              onChange={handleTitleChange}
              onFocus={handleTitleCursor}
              onKeyUp={handleTitleCursor}
              onSelect={handleTitleCursor}
              onClick={handleTitleCursor}
              placeholder="Untitled"
              className="text-5xl font-bold bg-transparent border-none outline-none w-full placeholder:text-muted-foreground/20 tracking-tight"
            />
            {Object.values(remoteTitleCursors).map((cursor) => {
              const offset = getCursorOffset(title, cursor.pos);
              return (
                <div
                  key={cursor.email}
                  className="absolute pointer-events-none transition-all duration-75"
                  style={{
                    left: `${offset}px`,
                    top: "0px",
                    height: "3.5rem", // match input height
                  }}
                >
                  {/* Vertical Cursor Line */}
                  <div
                    className="w-[2px] h-full"
                    style={{ backgroundColor: cursor.color }}
                  />
                  {/* Email Label above cursor */}
                  <div
                    className="absolute bottom-full left-0 mb-1 px-1.5 py-0.5 text-[9px] font-semibold rounded text-white whitespace-nowrap z-50"
                    style={{
                      backgroundColor: cursor.color,
                      fontFamily: "Inter, sans-serif",
                    }}
                  >
                    {cursor.email}
                  </div>
                </div>
              );
            })}
          </Skeletonizer>
        </div>
        
        <Skeletonizer enabled={isLoading}>
          <div id="editor-container-wrapper" className="relative min-h-[500px] -ml-[54px]"> 
            {/* -ml-[54px] to align the content with the title, as BlockNote has gutter/icons */}
            <BlockNoteView 
              editor={editor} 
              onChange={handleEditorChange}
              slashMenu={false}
            >
              <SuggestionMenuController
                triggerCharacter={"/"}
                getItems={async (query) => {
                  const allItems = getDefaultReactSlashMenuItems(editor);
                  const allowedTitles = ["Paragraph", "Check List", "Image", "Code Block"];
                  const filtered = allItems.filter((item) => allowedTitles.includes(item.title));
                  return filterSuggestionItems(filtered, query);
                }}
              />
            </BlockNoteView>
            <ChecklistTooltips tooltips={actionTooltips} />
          </div>
        </Skeletonizer>
      </div>
    </div>
  );
}
