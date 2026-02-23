import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';
import { cn } from '@/lib/utils';
import { 
  Bold, 
  Italic, 
  List, 
  ListOrdered, 
  Undo, 
  Redo,
  Strikethrough
} from 'lucide-react';
import { Button } from './button';
import { useEffect, useRef } from 'react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
  className?: string;
  disabled?: boolean;
  minHeight?: string;
  defaultBold?: boolean;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = 'Enter your text here...',
  maxLength = 2000,
  className,
  disabled = false,
  minHeight = '100px',
  defaultBold = false,
}: RichTextEditorProps) {
  const defaultBoldApplied = useRef(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false, // Disable headings for notes
        codeBlock: false, // Disable code blocks
        blockquote: false, // Disable blockquotes
      }),
      Placeholder.configure({
        placeholder,
      }),
      CharacterCount.configure({
        limit: maxLength,
      }),
    ],
    content: value,
    editable: !disabled,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      // Return empty string if editor only contains empty paragraph
      if (html === '<p></p>') {
        onChange('');
      } else {
        onChange(html);
      }
    },
  });

  // Apply default bold after editor is mounted in React state
  // This ensures the toolbar UI properly reflects the bold-active state
  useEffect(() => {
    if (editor && defaultBold && !defaultBoldApplied.current) {
      defaultBoldApplied.current = true;
      const currentContent = editor.getHTML();
      const isEmpty = !currentContent || currentContent === '<p></p>';
      if (isEmpty) {
        // Use requestAnimationFrame so the editor is fully rendered first
        requestAnimationFrame(() => {
          editor.chain().focus().setBold().run();
        });
      }
    }
  }, [editor, defaultBold]);

  // Update editor content when value prop changes externally
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      // Avoid updating if the content is essentially the same
      const currentContent = editor.getHTML();
      const isEmpty = value === '' || value === '<p></p>';
      const editorIsEmpty = currentContent === '<p></p>';
      
      if (isEmpty && editorIsEmpty) return;
      if (value === currentContent) return;
      
      editor.commands.setContent(value || '');
    }
  }, [value, editor]);

  // Update editable state when disabled prop changes
  useEffect(() => {
    if (editor) {
      editor.setEditable(!disabled);
    }
  }, [disabled, editor]);

  if (!editor) {
    return null;
  }

  const characterCount = editor.storage.characterCount.characters();
  const isOverLimit = characterCount > maxLength;

  return (
    <div className={cn('border rounded-md', disabled && 'opacity-50', className)}>
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-2 border-b bg-gray-50">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={cn('h-8 w-8 p-0', editor.isActive('bold') && 'bg-gray-200')}
          disabled={disabled}
          title="Bold"
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={cn('h-8 w-8 p-0', editor.isActive('italic') && 'bg-gray-200')}
          disabled={disabled}
          title="Italic"
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={cn('h-8 w-8 p-0', editor.isActive('strike') && 'bg-gray-200')}
          disabled={disabled}
          title="Strikethrough"
        >
          <Strikethrough className="h-4 w-4" />
        </Button>
        
        <div className="w-px h-6 bg-gray-300 mx-1" />
        
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={cn('h-8 w-8 p-0', editor.isActive('bulletList') && 'bg-gray-200')}
          disabled={disabled}
          title="Bullet List"
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={cn('h-8 w-8 p-0', editor.isActive('orderedList') && 'bg-gray-200')}
          disabled={disabled}
          title="Numbered List"
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
        
        <div className="w-px h-6 bg-gray-300 mx-1" />
        
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={disabled || !editor.can().undo()}
          className="h-8 w-8 p-0"
          title="Undo"
        >
          <Undo className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={disabled || !editor.can().redo()}
          className="h-8 w-8 p-0"
          title="Redo"
        >
          <Redo className="h-4 w-4" />
        </Button>
      </div>

      {/* Editor Content */}
      <EditorContent 
        editor={editor} 
        className={cn(
          'prose prose-sm max-w-none p-3',
          '[&_.ProseMirror]:outline-none [&_.ProseMirror]:min-h-[80px]',
          '[&_.ProseMirror_p.is-editor-empty:first-child::before]:text-gray-400',
          '[&_.ProseMirror_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)]',
          '[&_.ProseMirror_p.is-editor-empty:first-child::before]:float-left',
          '[&_.ProseMirror_p.is-editor-empty:first-child::before]:pointer-events-none',
          '[&_.ProseMirror_p.is-editor-empty:first-child::before]:h-0',
        )}
        style={{ minHeight }}
      />

      {/* Character Count */}
      <div className={cn(
        'flex justify-end px-3 py-1 text-xs border-t bg-gray-50',
        isOverLimit ? 'text-red-500' : 'text-gray-500'
      )}>
        {characterCount}/{maxLength} characters
      </div>
    </div>
  );
}

export default RichTextEditor;
