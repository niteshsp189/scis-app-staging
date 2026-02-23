import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { FileText, Plus, Trash2, Edit2, Loader2, Pin, PinOff } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { CustomerNote } from "@/types/customer";
import { ConfirmationDialog } from "@/components/dialogs/ConfirmationDialog";
import {
  customerNotesService,
  CreateNoteRequest,
  UpdateNoteRequest,
} from "@/services/customerNotesService";
import { api } from "@/services/api";
import { RichTextEditor } from "@/components/ui/RichTextEditor";
import { renderHtmlContent, stripHtml } from "@/lib/htmlUtils";

interface CustomerNotesDialogProps {
  customerId: number;
  customerName: string;
  notes: CustomerNote[];
  onUpdateNotes: (notes: CustomerNote[]) => void;
  trigger?: React.ReactNode;
  editingNote?: CustomerNote;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  relatedContacts?: Array<{ id: number; name?: string; first_name?: string; last_name?: string }>;
}

export function CustomerNotesDialog({
  customerId,
  customerName,
  notes,
  onUpdateNotes,
  trigger,
  editingNote,
  open: externalOpen,
  onOpenChange: externalOnOpenChange,
  relatedContacts = [],
}: CustomerNotesDialogProps) {
  
  useEffect(() => {
    
  }, [relatedContacts]);
  const [internalOpen, setInternalOpen] = useState(false);

  // Use external control if provided, otherwise use internal state
  const open = externalOpen !== undefined ? externalOpen : internalOpen;
  const setOpen = (value: boolean) => {
    if (externalOnOpenChange) {
      externalOnOpenChange(value);
    } else {
      setInternalOpen(value);
    }
  };
  const [loading, setLoading] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [newNote, setNewNote] = useState<CreateNoteRequest>({
    content: "",
    color: "blue",
    is_important: false,
    is_pinned: false,
    copy_to_related_contacts: false,
  });
  const [editNote, setEditNote] = useState<UpdateNoteRequest>({
    content: "",
    color: "blue",
    is_important: false,
    is_pinned: false,
  });

  const colorOptions = [
    { value: "black", label: "Black", textColor: "white" },
    { value: "red", label: "Red", textColor: "white" },
    { value: "blue", label: "Blue", textColor: "white" },
    { value: "purple", label: "Purple", textColor: "white" },
    { value: "green", label: "Green", textColor: "black" },
    { value: "orange", label: "Orange", textColor: "black" },
    { value: "yellow", label: "Yellow", textColor: "black" },
    { value: "pink", label: "Pink", textColor: "black" },
    { value: "brown", label: "Brown", textColor: "white" },
  ];

// Error state for backend validation
const [backendError, setBackendError] = useState<string | null>(null);

  // Track selected related contacts
  const [selectedRelatedContacts, setSelectedRelatedContacts] = useState<number[]>([]);

  const [fetchedRelatedContacts, setFetchedRelatedContacts] = useState([]); // Define relatedContacts state

  // Fetch related contacts from backend
  useEffect(() => {
    const fetchRelatedContacts = async () => {
      try {
        const response = await api.get(`/customers/${customerId}/related-contacts`);
        if (response.success) {
          setFetchedRelatedContacts(response.data);
        }
      } catch (error) {
        console.error("Failed to fetch related contacts:", error);
      }
    };

    fetchRelatedContacts();
  }, [customerId]);

  const handleAddNote = async () => {
    setBackendError(null);
    if (!newNote.content.trim()) {
      setBackendError("Note content is required");
      return;
    }

    try {
      setLoading(true);
      const response = await api.post(`/customers/${customerId}/notes`, {
        ...newNote,
        related_contact_ids: selectedRelatedContacts,
      });

      if (response.success) {
        const updatedNotes = [response.data, ...notes];
        onUpdateNotes(updatedNotes);
        setNewNote({
          content: "",
          color: "blue",
          is_important: false,
          is_pinned: false,
          copy_to_related_contacts: false,
        });
        setOpen(false);
        toast({
          title: "Note Added",
          description: "Customer note has been added successfully.",
        });
      } else {
        setBackendError(response.message || "Failed to create note");
      }
    } catch (error) {
      console.error("Failed to create note:", error);
      setBackendError(error.response?.data?.message || "Failed to create note");
    } finally {
      setLoading(false);
    }
  };

  const handleEditNote = async (noteId: string) => {
    const validation = customerNotesService.validateNote(editNote);
    if (!validation.isValid) {
      toast({
        title: "Validation Error",
        description: validation.errors.join(", "),
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      const response = await customerNotesService.updateNote(
        customerId,
        noteId,
        editNote,
      );
      const updatedNotes = notes.map((note) =>
        note.id === noteId ? response.data : note,
      );
      onUpdateNotes(updatedNotes);
      setEditingNoteId(null);

      toast({
        title: "Note Updated",
        description: "Customer note has been updated successfully.",
      });
      setOpen(false);
    } catch (error: any) {
      console.error("Failed to update note:", error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to update note",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteNote = (noteId: string) => {
    setNoteToDelete(noteId);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!noteToDelete) return;

    try {
      setIsDeleting(true);
      await customerNotesService.deleteNote(customerId, noteToDelete);
      const updatedNotes = notes.filter((note) => note.id !== noteToDelete);
      onUpdateNotes(updatedNotes);

      toast({
        title: "Note Deleted",
        description: "Customer note has been deleted.",
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

  const handleTogglePin = async (noteId: string, currentlyPinned: boolean) => {
    try {
      setLoading(true);
      const response = await customerNotesService.togglePinNote(
        customerId,
        noteId,
        !currentlyPinned,
      );
      
      const updatedNotes = notes.map((note) =>
        note.id === noteId ? response.data : note,
      );
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
    } finally {
      setLoading(false);
    }
  };

  const startEditing = (note: CustomerNote) => {
    setEditingNoteId(note.id);
    setEditNote({
      content: note.content,
      color: note.color,
      is_important: note.is_important,
      is_pinned: note.is_pinned,
    });
  };

  const cancelEditing = () => {
    setEditingNoteId(null);
    setEditNote({
      content: "",
      color: "blue",
      is_important: false,
      is_pinned: false,
    });
  };

  // Initialize edit mode when dialog opens and editingNote is provided
  useEffect(() => {
    if (open && editingNote) {
      // Directly set edit mode when opening with editingNote
      setEditingNoteId(editingNote.id);
      setEditNote({
        content: editingNote.content,
        color: editingNote.color,
        is_important: editingNote.is_important,
        is_pinned: editingNote.is_pinned,
      });
    } else if (!open) {
      // Reset editing state when dialog closes
      setEditingNoteId(null);
      setEditNote({
        content: "",
        color: "blue",
        is_important: false,
        is_pinned: false,
      });
    } else if (open && !editingNote) {
      // Ensure we're in add mode when opening without editingNote
      setEditingNoteId(null);
    }
  }, [open, editingNote]);

  const getColorClass = (color: string) => {
    return customerNotesService.getBadgeColorClass(color);
  };

  const defaultTrigger = (
    <Button variant="outline" size="sm">
      <FileText className="h-3 w-3 mr-1" />
      Notes ({notes.length})
    </Button>
  );

  // Ensure relatedContacts state is defined
  const handleCheckboxChange = async (checked: boolean) => {
    setNewNote((prev) => ({ ...prev, copy_to_related_contacts: checked }));
    if (checked) {
      try {
        const response = await api.get(`/customers/${customerId}/related-contacts`);
        if (response.success) {
          setFetchedRelatedContacts(response.data);
        }
      } catch (error) {
        console.error("Failed to fetch related contacts:", error);
      }
    } else {
      setSelectedRelatedContacts([]);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && (
        <DialogTrigger asChild>{trigger || defaultTrigger}</DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingNote
              ? `Edit Note`
              : "Customer Notes"}{" "}
            - {customerName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Add New Note - Only show when not editing a specific note */}
          {!editingNote && !editingNoteId && (
            <div className="p-4 border rounded-lg bg-gray-50">
              <h3 className="text-sm font-medium mb-3">Add New Note</h3>
              <div className="space-y-3">
                {backendError && (
                  <div className="text-red-600 text-sm mb-2">{backendError}</div>
                )}
                <div>
                  <Label htmlFor="content">Note Content</Label>
                  <RichTextEditor
                    value={newNote.content}
                    onChange={(value) => setNewNote({ ...newNote, content: value })}
                    placeholder="Enter your note here..."
                    maxLength={2000}
                    defaultBold
                  />
                </div>
                <div>
                  <Label>Color</Label>
                  <RadioGroup
                    value={newNote.color}
                    onValueChange={(value) => setNewNote({ ...newNote, color: value })}
                    className="mt-2"
                  >
                    <div className="grid grid-cols-3 gap-2">
                      {colorOptions.map((option) => (
                        <div key={option.value} className="flex items-center space-x-2">
                          <RadioGroupItem
                            value={option.value}
                            id={`new-note-color-${option.value}`}
                            className="text-current"
                          />
                          <Label
                            htmlFor={`new-note-color-${option.value}`}
                            className="text-sm font-medium capitalize cursor-pointer"
                            style={{ 
                              color: option.value === 'yellow' ? '#b45309' : 
                                     option.value === 'pink' ? '#be185d' : 
                                     option.value 
                            }}
                          >
                            {option.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </RadioGroup>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="is_important"
                      checked={newNote.is_important}
                      onCheckedChange={(checked) =>
                        setNewNote({ ...newNote, is_important: !!checked })
                      }
                    />
                    <Label htmlFor="is_important" className="text-sm">
                      Mark as important
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="is_pinned"
                      checked={newNote.is_pinned}
                      disabled={notes.filter(n => n.is_pinned).length >= 5 && !newNote.is_pinned}
                      onCheckedChange={(checked) =>
                        setNewNote({ ...newNote, is_pinned: !!checked })
                      }
                    />
                    <Label htmlFor="is_pinned" className="text-sm">
                      Pin note (max 5 pinned notes)
                      {notes.filter(n => n.is_pinned).length >= 5 && !newNote.is_pinned && (
                        <span className="text-xs text-red-500 ml-2">Max pinned notes reached</span>
                      )}
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="copy_to_related_contacts"
                      checked={newNote.copy_to_related_contacts}
                      onCheckedChange={handleCheckboxChange}
                    />
                    <Label htmlFor="copy_to_related_contacts" className="text-sm">
                      Copy to related contacts
                    </Label>
                  </div>
                  {/* Show related contacts if checked */}
                  {newNote.copy_to_related_contacts && Array.isArray(fetchedRelatedContacts) && fetchedRelatedContacts.length > 0 && (
                    <div className="mt-2">
                      <Label className="text-xs mb-1">Select related contacts:</Label>
                      <div className="flex flex-col gap-1">
                        {fetchedRelatedContacts.map((contact) => (
                          <div key={contact.id} className="flex items-center gap-2">
                            <Checkbox
                              checked={selectedRelatedContacts.includes(contact.id)}
                              onCheckedChange={(checked) => {
                                
                                setSelectedRelatedContacts((prev) =>
                                  checked
                                    ? [...prev, contact.id]
                                    : prev.filter((id) => id !== contact.id)
                                );
                              }}
                            />
                            <span className="text-sm">{contact.name || `${contact.first_name || ''} ${contact.last_name || ''}`.trim()}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <Button
                  onClick={handleAddNote}
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4 mr-2" />
                  )}
                  Add Note
                </Button>
              </div>
            </div>
          )}

          {/* Notes History */}
          <div>
            <h3 className="text-sm font-medium mb-3">
              Notes History ({notes.length})
            </h3>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {notes.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No notes yet</p>
              ) : (
                customerNotesService.sortNotes(notes, "date", "desc").map((note) => (
                  <div
                    key={note.id}
                    className={`p-3 border rounded-lg ${customerNotesService.getNoteColorClass(note.color)}`}
                  >
                    {editingNoteId === note.id ? (
                      <div className="space-y-3">
                        <div>
                          <Label>Note Content</Label>
                          <RichTextEditor
                            value={editNote.content}
                            onChange={(value) => setEditNote({ ...editNote, content: value })}
                            placeholder="Enter your note here..."
                            maxLength={2000}
                          />
                        </div>
                        <div>
                          <Label>Color</Label>
                          <RadioGroup
                            value={editNote.color}
                            onValueChange={(value) => setEditNote({ ...editNote, color: value })}
                            className="mt-2"
                          >
                            <div className="grid grid-cols-3 gap-2">
                              {colorOptions.map((option) => (
                                <div key={option.value} className="flex items-center space-x-2">
                                  <RadioGroupItem
                                    value={option.value}
                                    id={`edit-note-color-${option.value}`}
                                    className="text-current"
                                  />
                                  <Label
                                    htmlFor={`edit-note-color-${option.value}`}
                                    className="text-sm font-medium capitalize cursor-pointer"
                                    style={{ 
                                      color: option.value === 'yellow' ? '#b45309' : 
                                             option.value === 'pink' ? '#be185d' : 
                                             option.value 
                                    }}
                                  >
                                    {option.label}
                                  </Label>
                                </div>
                              ))}
                            </div>
                          </RadioGroup>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id={`edit_important_${note.id}`}
                              checked={editNote.is_important}
                              onCheckedChange={(checked) =>
                                setEditNote({
                                  ...editNote,
                                  is_important: !!checked,
                                })
                              }
                            />
                            <Label
                              htmlFor={`edit_important_${note.id}`}
                              className="text-sm"
                            >
                              Mark as important
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id={`edit_pinned_${note.id}`}
                              checked={editNote.is_pinned}
                              onCheckedChange={(checked) =>
                                setEditNote({
                                  ...editNote,
                                  is_pinned: !!checked,
                                })
                              }
                            />
                            <Label
                              htmlFor={`edit_pinned_${note.id}`}
                              className="text-sm"
                            >
                              Pin note
                            </Label>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleEditNote(note.id)}
                            disabled={loading}
                          >
                            {loading ? (
                              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                            ) : (
                              "Save"
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={cancelEditing}
                            disabled={loading}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
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
                            <span className="text-xs text-gray-600">
                              {customerNotesService.formatTimestamp(
                                note.created_at,
                              )}
                            </span>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleTogglePin(note.id, note.is_pinned)}
                              className="h-6 w-6 p-0 hover:bg-yellow-100"
                              disabled={loading}
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
                              onClick={() => startEditing(note)}
                              className="h-6 w-6 p-0 hover:bg-blue-100"
                              disabled={loading}
                            >
                              <Edit2 className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteNote(note.id)}
                              className="h-6 w-6 p-0 hover:bg-red-100"
                              disabled={loading || isDeleting}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        <p className="text-sm" dangerouslySetInnerHTML={renderHtmlContent(note.content)} />
                        <p className="text-xs text-gray-600 mt-1">
                          By: {customerNotesService.getFullName(note.creator)}
                        </p>
                      </>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

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
      </DialogContent>
    </Dialog>
  );
}
