import { NoteService } from './note.service';

// ADR-015: open and save need only a login; list and delete stay owner-only.
describe('NoteService access', () => {
  const note = { id: 5, user_id: 1, title: 'T', updated_at: new Date(), blocks: [] };
  let prisma: any;
  let tx: any;
  let emitter: { emit: jest.Mock };
  let service: NoteService;

  beforeEach(() => {
    tx = {
      note: {
        update: jest.fn().mockResolvedValue(note),
        findUniqueOrThrow: jest.fn().mockResolvedValue(note),
        delete: jest.fn(),
      },
      block: { deleteMany: jest.fn(), create: jest.fn() },
    };
    prisma = {
      note: {
        findFirstOrThrow: jest.fn().mockResolvedValue(note),
        findMany: jest.fn().mockResolvedValue([note]),
      },
      $transaction: jest.fn((fn: (tx: any) => unknown) => fn(tx)),
    };
    emitter = { emit: jest.fn() };
    service = new NoteService(prisma, emitter as any);
  });

  it('opens a note by id without an owner filter', async () => {
    await service.getNoteById(5);
    expect(prisma.note.findFirstOrThrow).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 5 } }),
    );
  });

  it('saves a note by id without an owner filter, as the editor', async () => {
    await service.updateNote(5, 'other@x.com', 'New title');
    expect(prisma.note.findFirstOrThrow).toHaveBeenCalledWith({ where: { id: 5 } });
    expect(tx.note.update).toHaveBeenCalledWith({
      where: { id: 5 },
      data: { title: 'New title', last_edited_by: 'other@x.com' },
    });
    expect(emitter.emit).toHaveBeenCalledWith('note.5.updated', expect.anything());
  });

  it('lists only the caller\'s own notes', async () => {
    await service.getNotes(1);
    expect(prisma.note.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { user_id: 1 } }),
    );
  });

  it('deletes only when the caller is the owner', async () => {
    await service.deleteNote(5, 2);
    expect(prisma.note.findFirstOrThrow).toHaveBeenCalledWith({ where: { id: 5, user_id: 2 } });
  });
});
