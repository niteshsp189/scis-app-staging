import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageSquare, Plus, Edit2, Trash2, Pin, PinOff } from "lucide-react";
import { CustomerData, CustomerNote } from "@/types/customer";
import { CustomerNotesDialog } from "@/components/dialogs/CustomerNotesDialog";
import { ConfirmationDialog } from "@/components/dialogs/ConfirmationDialog";
import { customerNotesService } from "@/services/customerNotesService";
import { toast } from "@/hooks/use-toast";
import { renderHtmlContent } from "@/lib/htmlUtils";

interface CustomerNotesTabProps {
  customerData: CustomerData;
  onUpdateNotes: (notes: CustomerNote[]) => void;
}

const getNoteColorClass = (color: string) => {
  const colorMap = {
    black: "bg-gray-50 border-l-gray-500 text-gray-900",
    red: "bg-red-50 border-l-red-400 text-red-900",
    blue: "bg-blue-50 border-l-blue-400 text-blue-900",
    purple: "bg-purple-50 border-l-purple-400 text-purple-900",
    green: "bg-green-50 border-l-green-400 text-green-900",
    orange: "bg-orange-50 border-l-orange-400 text-orange-900",
    yellow: "bg-yellow-50 border-l-yellow-400 text-yellow-900",
    pink: "bg-pink-50 border-l-pink-400 text-pink-900",
    brown: "bg-amber-50 border-l-amber-400 text-amber-900",
  };
  return (
    colorMap[color as keyof typeof colorMap] ||
    "bg-gray-50 border-l-gray-400 text-gray-900"
  );
};

export const CustomerNotesTab = ({
  customerData,
  onUpdateNotes,
}: CustomerNotesTabProps) => {
  const [notes, setNotes] = useState<CustomerNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [notesDialogOpen, setNotesDialogOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<CustomerNote | null>(null);

  useEffect(() => {
    loadNotes();
  }, [customerData.id]);

  const loadNotes = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await customerNotesService.getCustomerNotes(
        customerData.id,
      );
      setNotes(response.data);
    } catch (err) {
      console.error("Failed to load notes:", err);
      setError("Failed to load notes");
      toast({
        title: "Error",
        description: "Failed to load customer notes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleNotesUpdate = (updatedNotes: CustomerNote[]) => {
    setNotes(updatedNotes);
    onUpdateNotes(updatedNotes);
  };

  const handleEditNote = (note: CustomerNote) => {
    setEditingNote(note);
    setNotesDialogOpen(true);
  };

  const handleAddNote = () => {
    setEditingNote(null);
    setNotesDialogOpen(true);
  };

  const handleTogglePin = async (noteId: string, currentlyPinned: boolean) => {
    try {
      const response = await customerNotesService.togglePinNote(
        customerData.id,
        noteId,
        !currentlyPinned,
      );
      
      const updatedNotes = notes.map((note) =>
        note.id === noteId ? response.data : note,
      );
      setNotes(updatedNotes);
      onUpdateNotes(updatedNotes);

      toast({
        title: currentlyPinned ? "Note Unpinned" : "Note Pinned",
        description: `Note has been ${currentlyPinned ? 'unpinned' : 'pinned'} successfully.`,
      });
    } catch (error: any) {
      console.error("Failed to toggle pin:", error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to toggle pin",
        variant: "destructive",
      });
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    setNoteToDelete(noteId);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!noteToDelete) return;

    try {
      setIsDeleting(true);
      await customerNotesService.deleteNote(customerData.id, noteToDelete);
      const updatedNotes = notes.filter((note) => note.id !== noteToDelete);
      setNotes(updatedNotes);
      onUpdateNotes(updatedNotes);

      toast({
        title: "Note Deleted",
        description: "Customer note has been deleted successfully.",
      });
    } catch (error: any) {
      console.error("Failed to delete note:", error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to delete note",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setDeleteConfirmOpen(false);
      setNoteToDelete(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Customer Notes</h3>
          <div className="h-10 w-24 bg-gray-200 animate-pulse rounded"></div>
        </div>
        <Card>
          <CardContent className="p-8 text-center">
            <div className="animate-pulse">
              <div className="h-12 w-12 bg-gray-300 rounded mx-auto mb-4"></div>
              <div className="h-4 w-32 bg-gray-300 rounded mx-auto"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Customer Notes</h3>
        </div>
        <Card>
          <CardContent className="p-8 text-center">
            <MessageSquare className="h-12 w-12 text-red-300 mx-auto mb-4" />
            <p className="text-red-500">{error}</p>
            <button
              onClick={loadNotes}
              className="mt-2 text-sm text-blue-600 hover:underline"
            >
              Try again
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Customer Notes</h3>
        <button
          onClick={handleAddNote}
          className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
        >
          <Plus className="h-4 w-4" />
          Add Note
        </button>
      </div>

      {notes.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No notes yet</p>
            <p className="text-sm text-gray-400 mt-1">
              Add your first note to track customer interactions
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {customerNotesService.sortNotes(notes, "date", "desc").map((note) => (
            <div key={note.id} className="space-y-1">
              {/* Name, timestamp, badges, and actions - OUTSIDE the color box */}
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="font-medium">
                    {customerNotesService.getFullName(note.creator)}
                  </span>
                  <span>{customerNotesService.formatTimestamp(note.created_at)}</span>
                  {note.is_pinned && (
                    <Badge variant="secondary" className="text-xs">
                      <Pin className="h-3 w-3 mr-1" />
                      Pinned
                    </Badge>
                  )}
                  {note.is_important && (
                    <Badge variant="secondary" className="text-xs">
                      Important
                    </Badge>
                  )}
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleTogglePin(note.id, note.is_pinned)}
                    className="h-6 w-6 p-0 hover:bg-yellow-100"
                    title={note.is_pinned ? "Unpin note" : "Pin note"}
                  >
                    {note.is_pinned ? (
                      <PinOff className="h-3 w-3" />
                    ) : (
                      <Pin className="h-3 w-3" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditNote(note)}
                    className="h-6 w-6 p-0 hover:bg-blue-100"
                  >
                    <Edit2 className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteNote(note.id)}
                    className="h-6 w-6 p-0 hover:bg-red-100"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              {/* Color box - only contains title and content */}
              <Card
                className={`border-l-4 ${getNoteColorClass(note.color)} ${note.is_pinned ? 'ring-2 ring-yellow-200' : ''}`}
              >
                <CardContent className="p-4">
                  {note.title && (
                    <h4 className="text-sm font-semibold mb-1">{note.title}</h4>
                  )}
                  <div className="text-sm font-medium prose prose-sm max-w-none" dangerouslySetInnerHTML={renderHtmlContent(note.content)} />
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      )}

      <ConfirmationDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        onConfirm={confirmDelete}
        title="Delete Note"
        description="Are you sure you want to delete this note? This action cannot be undone."
        confirmButtonText="Delete"
        cancelButtonText="Cancel"
        variant="destructive"
        isLoading={isDeleting}
      />

      {/* Single Dialog Instance */}
      <CustomerNotesDialog
        customerId={customerData.id}
        customerName={
          customerData.name ||
          `${customerData.firstName} ${customerData.lastName}`
        }
        notes={notes}
        onUpdateNotes={handleNotesUpdate}
        editingNote={editingNote}
        open={notesDialogOpen}
        onOpenChange={(open) => {
          setNotesDialogOpen(open);
          if (!open) {
            setEditingNote(null);
          }
        }}
      />
    </div>
  );
};
