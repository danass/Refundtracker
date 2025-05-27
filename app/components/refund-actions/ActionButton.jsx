'use client';
import { useActionState, useEffect } from 'react';
import { toast } from 'sonner'; // New sonner toast
import { Button } from '@/components/ui/button'; // Import shadcn Button

export default function ActionButton({
  serverAction,
  refundRequestId,
  actorName,
  comment,
  commentFieldName = 'actionComment', // Default field name for the comment
  buttonText,
  processingText = 'Processing...',
  successText = 'Action Complete!', // Updated default
  variant = 'default', // Added variant prop, defaults to shadcn's default
  buttonClassName = '', // Allow additional custom classes
  // Or for a secondary button: 'bg-secondary hover:bg-secondary/80 text-secondary-foreground'
  requiresComment = false,
  additionalFormData = {},
  onSuccess, // Optional callback on success
  children, // To allow passing content like icons
}) {
  const initialState = { error: null, success: false, message: '' };
  // The serverAction will receive (prevState, formData)
  // We need to ensure formData includes the comment and any other necessary fields.
  const boundAction = async (prevState, formData) => {
    // Ensure refundRequestId and actorName are appended if not already in additionalFormData
    if (!formData.has('refundRequestId')) {
      formData.append('refundRequestId', refundRequestId);
    }
    if (!formData.has('actorName')) {
      formData.append('actorName', actorName);
    }
    if (commentFieldName && !formData.has(commentFieldName)) {
        formData.append(commentFieldName, comment || '');
    }
    
    // Add any other specific data needed by the action
    // additionalFormData will overwrite if keys conflict, which might be desired
    for (const key in additionalFormData) {
      formData.append(key, additionalFormData[key]);
    }
    return serverAction(prevState, formData);
  };

  const [state, formAction, isPending] = useActionState(boundAction, initialState);

  useEffect(() => {
    if (state.success) {
      toast.success(state.message || successText, {
        description: "Action Successful", // Example if you add more details
      });
      if (onSuccess) onSuccess();
    } else if (state.error) {
      toast.error(state.message || "Action Failed", { // Use state.message if available, then generic
        description: state.error, // Main error message as description
      });
    }
  }, [state, onSuccess, successText]); // Removed toast from dependencies as it's directly imported

  const isButtonDisabled = isPending || state.success || (requiresComment && (!comment || !comment.trim()));

  return (
    <form action={formAction} style={{ display: 'inline-block' }}> {/* Form per button approach */}
      <Button
        type="submit"
        variant={variant}
        disabled={isButtonDisabled}
        className={buttonClassName} // Apply additional classes
      >
        {isPending ? processingText : (state.success ? successText : (children || buttonText))}
      </Button>
      {/* General error display, if not handled by field-specific errors from the action */}
      {state.error && !state.fieldErrors && !state.success && (
        <p className="mt-1 text-xs text-destructive">Error: {state.error}</p>
      )}
    </form>
  );
} 